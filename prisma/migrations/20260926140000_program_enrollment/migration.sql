-- Which school runs which program, and how far along it is.

DO $$ BEGIN CREATE TYPE "EnrollmentStage" AS ENUM ('INTRODUCED','MEETING_BOOKED','REGISTERED','MATERIALS_SENT','TRAINED','LAUNCHED','RUNNING','PAUSED','ENDED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ProgramEnrollment" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "schoolId"   TEXT NOT NULL,
  "programId"  INTEGER NOT NULL,
  "stage"      "EnrollmentStage" NOT NULL DEFAULT 'INTRODUCED',
  "stageSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "contactId"  TEXT,
  "startedAt"  TIMESTAMP(3),
  "endedAt"    TIMESTAMP(3),
  "note"       TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProgramEnrollment_schoolId_fkey"  FOREIGN KEY ("schoolId")  REFERENCES "School"("id")        ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT "ProgramEnrollment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "ProgramPage"("id")   ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT "ProgramEnrollment_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "SchoolContact"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProgramEnrollment_schoolId_programId_key" ON "ProgramEnrollment"("schoolId","programId");
CREATE INDEX IF NOT EXISTS "ProgramEnrollment_programId_stage_idx" ON "ProgramEnrollment"("programId","stage");
CREATE INDEX IF NOT EXISTS "ProgramEnrollment_schoolId_idx" ON "ProgramEnrollment"("schoolId");
