-- Supabase flagged every table as publicly readable, and it was right.
--
-- Supabase hands its two API roles — `anon` (anybody) and `authenticated` —
-- full SELECT/INSERT/UPDATE/DELETE on every table in `public` by default, and
-- expects you to fence them off with Row-Level Security. This project never
-- uses that API: it talks to Postgres directly through Prisma as the `postgres`
-- role. So the grants were pure surface area — nothing needed them, and they
-- covered the User table, contact messages and demo requests.
--
-- Three things, in order of how much they matter:
--
--   1. Stop granting them on NEW tables. This is the durable fix — without it
--      the hole reopens the next time a migration adds a table, which is
--      exactly how it got this wide.
--   2. Take back the grants that already exist.
--   3. Turn RLS on everywhere as a second lock. With no policies, the API
--      roles see nothing even if a grant ever comes back. Prisma is unaffected:
--      it connects as the table owner, and owners bypass RLS unless FORCE is
--      set, which it is not.

-- 1 — future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- 2 — existing objects
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE USAGE ON SCHEMA public FROM anon, authenticated;

-- 3 — RLS on every table, no policies
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.relname);
  END LOOP;
END $$;
