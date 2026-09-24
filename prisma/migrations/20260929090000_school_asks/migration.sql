-- An ask: somebody at a school writing to their coordinator from the portal.
--
-- SchoolActivity already held everything JOC did to a school. This is the
-- first row that runs the other way, so it needs a direction, a program to
-- land on, and somewhere to record that the answer happened — which it does
-- on the phone, never here.

ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'ASK';

ALTER TABLE "SchoolActivity"
  ADD COLUMN IF NOT EXISTS "inbound"        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "programId"      INTEGER,
  ADD COLUMN IF NOT EXISTS "topic"          TEXT,
  ADD COLUMN IF NOT EXISTS "answeredAt"     TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "answeredById"   TEXT,
  ADD COLUMN IF NOT EXISTS "reply"          TEXT,
  ADD COLUMN IF NOT EXISTS "seenBySchoolAt" TIMESTAMP(3);

DO $$ BEGIN
  ALTER TABLE "SchoolActivity"
    ADD CONSTRAINT "SchoolActivity_programId_fkey"
    FOREIGN KEY ("programId") REFERENCES "ProgramPage"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "SchoolActivity"
    ADD CONSTRAINT "SchoolActivity_answeredById_fkey"
    FOREIGN KEY ("answeredById") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Open asks for one program, and open asks for one school: the two questions
-- the console Today tab and the school's Today page each ask once per load.
CREATE INDEX IF NOT EXISTS "SchoolActivity_programId_answeredAt_idx"
  ON "SchoolActivity"("programId", "answeredAt");

CREATE INDEX IF NOT EXISTS "SchoolActivity_schoolId_inbound_answeredAt_idx"
  ON "SchoolActivity"("schoolId", "inbound", "answeredAt");
