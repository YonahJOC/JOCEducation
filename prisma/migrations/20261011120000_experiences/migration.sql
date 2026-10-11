-- The Experiences department: the groups it hosts for a chesed experience,
-- what happened with each of them, and the comments under what happened.
--
-- Its own three tables rather than rows on School. A family or a tour group
-- has no plan, no seats and no program enrolment, and putting them on the
-- schools board would make that board about everything.
--
-- Written to be run twice without harm: every type, table, index and
-- constraint is guarded, so a half-applied run can simply be run again.

DO $$ BEGIN
  CREATE TYPE "ExperienceClientStatus" AS ENUM ('LEAD', 'BOOKED', 'REGULAR', 'DORMANT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ExperienceActivityType" AS ENUM (
    'NOTE', 'CALL', 'EMAIL', 'WHATSAPP', 'MEETING', 'EXPERIENCE_BOOKED', 'EXPERIENCE_DONE'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ExperienceClient" (
  "id"          TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "kind"        TEXT,
  "contactName" TEXT,
  "email"       TEXT,
  "phone"       TEXT,
  "notes"       TEXT,
  "status"      "ExperienceClientStatus" NOT NULL DEFAULT 'LEAD',
  "ownerId"     TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "archivedAt"  TIMESTAMP(3),
  CONSTRAINT "ExperienceClient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExperienceActivity" (
  "id"         TEXT NOT NULL,
  "clientId"   TEXT NOT NULL,
  "type"       "ExperienceActivityType" NOT NULL,
  "summary"    TEXT NOT NULL,
  "detail"     TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "groupSize"  INTEGER,
  "authorId"   TEXT,
  "removedAt"  TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExperienceActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExperienceNote" (
  "id"         TEXT NOT NULL,
  "activityId" TEXT NOT NULL,
  "authorId"   TEXT,
  "body"       TEXT NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExperienceNote_pkey" PRIMARY KEY ("id")
);

-- The client list reads live clients by name; a client's history and the
-- department's feed both read newest first.
CREATE INDEX IF NOT EXISTS "ExperienceClient_archivedAt_name_idx"
  ON "ExperienceClient"("archivedAt", "name");
CREATE INDEX IF NOT EXISTS "ExperienceActivity_clientId_occurredAt_idx"
  ON "ExperienceActivity"("clientId", "occurredAt");
CREATE INDEX IF NOT EXISTS "ExperienceActivity_occurredAt_idx"
  ON "ExperienceActivity"("occurredAt");
CREATE INDEX IF NOT EXISTS "ExperienceNote_activityId_createdAt_idx"
  ON "ExperienceNote"("activityId", "createdAt");

-- A person leaving takes their name off what they wrote, never the record.
-- A client going takes its history with it — which never happens, because
-- clients are archived rather than deleted.
DO $$ BEGIN
  ALTER TABLE "ExperienceClient"
    ADD CONSTRAINT "ExperienceClient_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ExperienceActivity"
    ADD CONSTRAINT "ExperienceActivity_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "ExperienceClient"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ExperienceActivity"
    ADD CONSTRAINT "ExperienceActivity_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ExperienceNote"
    ADD CONSTRAINT "ExperienceNote_activityId_fkey"
    FOREIGN KEY ("activityId") REFERENCES "ExperienceActivity"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ExperienceNote"
    ADD CONSTRAINT "ExperienceNote_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
