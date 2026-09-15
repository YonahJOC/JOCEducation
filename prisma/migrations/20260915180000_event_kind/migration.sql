-- The calendar carries two different things: big JOC events, and one program
-- running at one school. The difference is not "is a school named" — a Run for
-- Chesed happens at one park and is still a JOC event — so it is stated.
DO $$ BEGIN
  CREATE TYPE "EventKind" AS ENUM ('JOC_EVENT', 'SCHOOL_PROGRAM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "ProgramEvent"
  ADD COLUMN IF NOT EXISTS "kind" "EventKind" NOT NULL DEFAULT 'SCHOOL_PROGRAM';

CREATE INDEX IF NOT EXISTS "ProgramEvent_kind_startsAt_idx" ON "ProgramEvent"("kind", "startsAt");
