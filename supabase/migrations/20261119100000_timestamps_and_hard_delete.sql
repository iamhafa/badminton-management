-- Quy ước mới cho mọi bảng:
--   * Có `created_at` và `updated_at` (timestamptz, not null, mặc định now()).
--   * `updated_at` do trigger `set_updated_at` (extension moddatetime) tự cập nhật ở mỗi lệnh UPDATE,
--     app không cần tự gán.
--   * Không xóa mềm: bỏ cột `deleted_at`, xóa là xóa hẳn dòng.

-- 1. Thêm cột còn thiếu, điền giá trị cho dữ liệu cũ theo bảng cha.
alter table public.members
  add column created_at timestamptz not null default now(),
  add column updated_at timestamptz not null default now();
update public.members m set created_at = g.created_at, updated_at = g.created_at
from public.groups g where g.id = m.group_id;

alter table public.sessions
  add column updated_at timestamptz not null default now();
update public.sessions set updated_at = created_at;

alter table public.session_players
  add column created_at timestamptz not null default now(),
  add column updated_at timestamptz not null default now();
update public.session_players p set created_at = s.created_at, updated_at = coalesce(p.paid_at, s.created_at)
from public.sessions s where s.id = p.session_id;

-- 2. Bỏ xóa mềm. Dòng đang bị ẩn được coi là đã xóa, nên xóa hẳn trước khi bỏ cột.
--    Khóa ngoại tự xử lý phần liên quan: members bị xóa theo nhóm (cascade);
--    sessions.group_id / court_id / shuttlecock_id và groups.default_court_id về null (set null),
--    buổi chơi vẫn giữ group_name / court_name / shuttle_brand.
delete from public.groups where deleted_at is not null;
delete from public.courts where deleted_at is not null;
delete from public.shuttlecocks where deleted_at is not null;
alter table public.groups drop column deleted_at;
alter table public.courts drop column deleted_at;
alter table public.shuttlecocks drop column deleted_at;

-- 3. Trigger tự cập nhật updated_at.
create extension if not exists moddatetime with schema extensions;
create trigger set_updated_at before update on public.courts
  for each row execute function extensions.moddatetime(updated_at);
create trigger set_updated_at before update on public.shuttlecocks
  for each row execute function extensions.moddatetime(updated_at);
create trigger set_updated_at before update on public.groups
  for each row execute function extensions.moddatetime(updated_at);
create trigger set_updated_at before update on public.members
  for each row execute function extensions.moddatetime(updated_at);
create trigger set_updated_at before update on public.sessions
  for each row execute function extensions.moddatetime(updated_at);
create trigger set_updated_at before update on public.session_players
  for each row execute function extensions.moddatetime(updated_at);

-- 4. save_group: bỏ deleted_at. Chỉ update thành viên khi có thay đổi thật,
--    để updated_at của thành viên không bị đổi mỗi lần lưu nhóm.
create or replace function public.save_group(p_group jsonb, p_members jsonb) returns void
  language plpgsql
  as $$
declare
  v_group public.groups := jsonb_populate_record(null::public.groups, p_group);
begin
  insert into public.groups (id, name, female_cap, default_court_id, created_at)
  values (
    v_group.id,
    v_group.name,
    coalesce(v_group.female_cap, 50000),
    v_group.default_court_id,
    coalesce(v_group.created_at, now())
  )
  on conflict (id) do update set
    name             = excluded.name,
    female_cap       = excluded.female_cap,
    default_court_id = excluded.default_court_id
  where (groups.name, groups.female_cap, groups.default_court_id)
        is distinct from (excluded.name, excluded.female_cap, excluded.default_court_id);

  delete from public.members
  where group_id = v_group.id
    and id not in (select e ->> 'id' from jsonb_array_elements(coalesce(p_members, '[]'::jsonb)) as e);

  insert into public.members (id, group_id, name, gender, role, position)
  select e ->> 'id', v_group.id, e ->> 'name', e ->> 'gender', nullif(e ->> 'role', ''), (ord - 1)::integer
  from jsonb_array_elements(coalesce(p_members, '[]'::jsonb)) with ordinality as t(e, ord)
  on conflict (id) do update set
    name     = excluded.name,
    gender   = excluded.gender,
    role     = excluded.role,
    position = excluded.position
  where (members.name, members.gender, members.role, members.position)
        is distinct from (excluded.name, excluded.gender, excluded.role, excluded.position);
end;
$$;

-- 5. save_session: jsonb_populate_record điền null (không dùng default) cho cột không có trong JSON,
--    nên phải tự gán created_at / updated_at cho buổi chơi và từng người chơi.
create or replace function public.save_session(p_session jsonb, p_players jsonb) returns text
  language plpgsql
  as $$
declare
  v_id text := coalesce(nullif(p_session ->> 'id', ''), gen_random_uuid()::text);
  v_now timestamptz := now();
begin
  insert into public.sessions
  select (jsonb_populate_record(
    null::public.sessions,
    p_session || jsonb_build_object(
      'id', v_id,
      'created_at', coalesce(p_session ->> 'created_at', v_now::text),
      'updated_at', v_now
    )
  )).*;

  insert into public.session_players
  select (jsonb_populate_record(
    null::public.session_players,
    e || jsonb_build_object('session_id', v_id, 'created_at', v_now, 'updated_at', v_now)
  )).*
  from jsonb_array_elements(coalesce(p_players, '[]'::jsonb)) as e;

  return v_id;
end;
$$;

-- 6. set_default_shuttlecock: trigger đã lo updated_at.
create or replace function public.set_default_shuttlecock(p_id text) returns void
  language plpgsql
  as $$
begin
  update public.shuttlecocks set is_default = false where is_default and id <> p_id;
  update public.shuttlecocks set is_default = true where id = p_id and not is_default;
end;
$$;
