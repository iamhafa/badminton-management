import type { Tables } from '@/libs/supabase/types/database.type';
import type { TMember, TMemberDraft } from '@/types/player.type';

/** Nhóm chơi kèm danh sách thành viên: kết quả `select('*, members(*)')` của bảng `groups`. */
export type TGroup = Tables<'groups'> & { members: TMember[] };

/** Dữ liệu để lưu 1 nhóm: các cột của bảng `groups` + toàn bộ danh sách thành viên. */
export type TGroupSave = Omit<TGroup, 'members'> & { members: TMemberDraft[] };
