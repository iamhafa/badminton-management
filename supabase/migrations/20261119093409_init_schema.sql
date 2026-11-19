


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."save_group"("p_group" "jsonb", "p_members" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_group public.groups := jsonb_populate_record(null::public.groups, p_group);
begin
  insert into public.groups (id, name, female_cap, default_court_id, created_at, updated_at, deleted_at)
  values (
    v_group.id,
    v_group.name,
    coalesce(v_group.female_cap, 50000),
    v_group.default_court_id,
    coalesce(v_group.created_at, now()),
    coalesce(v_group.updated_at, now()),
    v_group.deleted_at
  )
  on conflict (id) do update set
    name             = excluded.name,
    female_cap       = excluded.female_cap,
    default_court_id = excluded.default_court_id,
    updated_at       = excluded.updated_at,
    deleted_at       = excluded.deleted_at;

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
    position = excluded.position;
end;
$$;


ALTER FUNCTION "public"."save_group"("p_group" "jsonb", "p_members" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_session"("p_session" "jsonb", "p_players" "jsonb") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_id text := coalesce(nullif(p_session ->> 'id', ''), gen_random_uuid()::text);
begin
  insert into public.sessions
  select (jsonb_populate_record(
    null::public.sessions,
    p_session || jsonb_build_object('id', v_id, 'created_at', coalesce(p_session ->> 'created_at', now()::text))
  )).*;

  insert into public.session_players
  select (jsonb_populate_record(null::public.session_players, e || jsonb_build_object('session_id', v_id))).*
  from jsonb_array_elements(coalesce(p_players, '[]'::jsonb)) as e;

  return v_id;
end;
$$;


ALTER FUNCTION "public"."save_session"("p_session" "jsonb", "p_players" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_default_shuttlecock"("p_id" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  update public.shuttlecocks set is_default = false, updated_at = now() where is_default and id <> p_id;
  update public.shuttlecocks set is_default = true, updated_at = now() where id = p_id;
end;
$$;


ALTER FUNCTION "public"."set_default_shuttlecock"("p_id" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."courts" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "name" "text" NOT NULL,
    "address" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."courts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "name" "text" NOT NULL,
    "female_cap" integer DEFAULT 50000 NOT NULL,
    "default_court_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "groups_female_cap_check" CHECK (("female_cap" >= 0))
);


ALTER TABLE "public"."groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."members" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "group_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "gender" "text" NOT NULL,
    "role" "text",
    "position" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "members_gender_check" CHECK (("gender" = ANY (ARRAY['MALE'::"text", 'FEMALE'::"text"]))),
    CONSTRAINT "members_role_check" CHECK (("role" = ANY (ARRAY['LEADER'::"text", 'VICE_LEADER'::"text"])))
);


ALTER TABLE "public"."members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."session_players" (
    "session_id" "text" NOT NULL,
    "player_id" "text" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "name" "text" NOT NULL,
    "gender" "text" NOT NULL,
    "type" "text" DEFAULT 'REGULAR'::"text" NOT NULL,
    "guest_source" "text",
    "role" "text",
    "drinks_water" boolean DEFAULT true NOT NULL,
    "court_and_shuttle_share" numeric DEFAULT 0 NOT NULL,
    "water_share" numeric DEFAULT 0 NOT NULL,
    "base_share" numeric DEFAULT 0 NOT NULL,
    "water_credit" numeric DEFAULT 0 NOT NULL,
    "raw_net_payable" numeric DEFAULT 0 NOT NULL,
    "rounded_payable" integer DEFAULT 0 NOT NULL,
    "paid_method" "text",
    "paid_at" timestamp with time zone,
    CONSTRAINT "session_players_check" CHECK ((("paid_method" IS NULL) = ("paid_at" IS NULL))),
    CONSTRAINT "session_players_gender_check" CHECK (("gender" = ANY (ARRAY['MALE'::"text", 'FEMALE'::"text"]))),
    CONSTRAINT "session_players_guest_source_check" CHECK (("guest_source" = ANY (ARRAY['FRIEND'::"text", 'FACEBOOK'::"text"]))),
    CONSTRAINT "session_players_paid_method_check" CHECK (("paid_method" = ANY (ARRAY['TRANSFER'::"text", 'CASH'::"text"]))),
    CONSTRAINT "session_players_role_check" CHECK (("role" = ANY (ARRAY['LEADER'::"text", 'VICE_LEADER'::"text"]))),
    CONSTRAINT "session_players_type_check" CHECK (("type" = ANY (ARRAY['REGULAR'::"text", 'GUEST'::"text"])))
);


ALTER TABLE "public"."session_players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "group_id" "text",
    "court_id" "text",
    "shuttlecock_id" "text",
    "group_name" "text" DEFAULT ''::"text" NOT NULL,
    "court_name" "text" DEFAULT ''::"text" NOT NULL,
    "shuttle_brand" "text" DEFAULT ''::"text" NOT NULL,
    "iso_date" "date" NOT NULL,
    "hours_played" numeric(4,1) DEFAULT 2 NOT NULL,
    "court_fee" integer DEFAULT 0 NOT NULL,
    "tube_price" integer DEFAULT 0 NOT NULL,
    "shuttles_used" integer DEFAULT 0 NOT NULL,
    "water_fee" integer DEFAULT 0 NOT NULL,
    "water_payer_id" "text",
    "female_cap" integer DEFAULT 0 NOT NULL,
    "shuttle_total_cost" numeric DEFAULT 0 NOT NULL,
    "total_cost" numeric DEFAULT 0 NOT NULL,
    "water_drinkers_count" integer DEFAULT 0 NOT NULL,
    "water_per_person" numeric DEFAULT 0 NOT NULL,
    "rounded_female_unit" integer DEFAULT 0 NOT NULL,
    "rounded_male_unit" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shuttlecocks" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "name" "text" NOT NULL,
    "tube_price" integer NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "shuttlecocks_tube_price_check" CHECK (("tube_price" >= 0))
);


ALTER TABLE "public"."shuttlecocks" OWNER TO "postgres";


ALTER TABLE ONLY "public"."courts"
    ADD CONSTRAINT "courts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_players"
    ADD CONSTRAINT "session_players_pkey" PRIMARY KEY ("session_id", "player_id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shuttlecocks"
    ADD CONSTRAINT "shuttlecocks_pkey" PRIMARY KEY ("id");



CREATE INDEX "members_group_id" ON "public"."members" USING "btree" ("group_id", "position");



CREATE INDEX "sessions_group_id" ON "public"."sessions" USING "btree" ("group_id");



CREATE INDEX "sessions_iso_date" ON "public"."sessions" USING "btree" ("iso_date" DESC, "created_at" DESC);



CREATE UNIQUE INDEX "shuttlecocks_one_default" ON "public"."shuttlecocks" USING "btree" ("is_default") WHERE "is_default";



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_default_court_id_fkey" FOREIGN KEY ("default_court_id") REFERENCES "public"."courts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_players"
    ADD CONSTRAINT "session_players_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "public"."courts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_shuttlecock_id_fkey" FOREIGN KEY ("shuttlecock_id") REFERENCES "public"."shuttlecocks"("id") ON DELETE SET NULL;



ALTER TABLE "public"."courts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public read" ON "public"."courts" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."groups" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."members" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."session_players" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."sessions" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."shuttlecocks" FOR SELECT USING (true);



CREATE POLICY "public write" ON "public"."courts" USING (true) WITH CHECK (true);



CREATE POLICY "public write" ON "public"."groups" USING (true) WITH CHECK (true);



CREATE POLICY "public write" ON "public"."members" USING (true) WITH CHECK (true);



CREATE POLICY "public write" ON "public"."session_players" USING (true) WITH CHECK (true);



CREATE POLICY "public write" ON "public"."sessions" USING (true) WITH CHECK (true);



CREATE POLICY "public write" ON "public"."shuttlecocks" USING (true) WITH CHECK (true);



ALTER TABLE "public"."session_players" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shuttlecocks" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."save_group"("p_group" "jsonb", "p_members" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."save_group"("p_group" "jsonb", "p_members" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_group"("p_group" "jsonb", "p_members" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."save_session"("p_session" "jsonb", "p_players" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."save_session"("p_session" "jsonb", "p_players" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_session"("p_session" "jsonb", "p_players" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_default_shuttlecock"("p_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."set_default_shuttlecock"("p_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_default_shuttlecock"("p_id" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."courts" TO "anon";
GRANT ALL ON TABLE "public"."courts" TO "authenticated";
GRANT ALL ON TABLE "public"."courts" TO "service_role";



GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";



GRANT ALL ON TABLE "public"."members" TO "anon";
GRANT ALL ON TABLE "public"."members" TO "authenticated";
GRANT ALL ON TABLE "public"."members" TO "service_role";



GRANT ALL ON TABLE "public"."session_players" TO "anon";
GRANT ALL ON TABLE "public"."session_players" TO "authenticated";
GRANT ALL ON TABLE "public"."session_players" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON TABLE "public"."shuttlecocks" TO "anon";
GRANT ALL ON TABLE "public"."shuttlecocks" TO "authenticated";
GRANT ALL ON TABLE "public"."shuttlecocks" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































