-- The traffic light: whether a coordinator may approach a school about a program.

DO $$ BEGIN CREATE TYPE "ProgramLight" AS ENUM ('GREEN','AMBER','RED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "LightSource" AS ENUM ('RULE','MANUAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "AgendaKind" AS ENUM ('REVIEW','SEND_FOR_REVIEW','SUGGEST_APPEAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "AgendaOutcome" AS ENUM ('KEEP_LIGHT','CHANGE_LIGHT','CLOSED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "SchoolProgramLight" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "schoolId"     TEXT NOT NULL,
  "programId"    INTEGER NOT NULL,
  "light"        "ProgramLight" NOT NULL,
  "reason"       TEXT NOT NULL,
  "source"       "LightSource" NOT NULL DEFAULT 'RULE',
  "setById"      TEXT,
  "setAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "until"        TIMESTAMP(3),
  "expiryToldAt" TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SchoolProgramLight_schoolId_fkey"  FOREIGN KEY ("schoolId")  REFERENCES "School"("id")      ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT "SchoolProgramLight_programId_fkey" FOREIGN KEY ("programId") REFERENCES "ProgramPage"("id") ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT "SchoolProgramLight_setById_fkey"   FOREIGN KEY ("setById")   REFERENCES "User"("id")        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "SchoolProgramLight_schoolId_programId_key" ON "SchoolProgramLight"("schoolId","programId");
CREATE INDEX IF NOT EXISTS "SchoolProgramLight_programId_light_idx" ON "SchoolProgramLight"("programId","light");
CREATE INDEX IF NOT EXISTS "SchoolProgramLight_source_until_idx" ON "SchoolProgramLight"("source","until");

CREATE TABLE IF NOT EXISTS "AdminMeeting" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "meetsAt"   TIMESTAMP(3) NOT NULL,
  "note"      TEXT,
  "closedAt"  TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AdminMeeting_meetsAt_idx" ON "AdminMeeting"("meetsAt");

CREATE TABLE IF NOT EXISTS "AdminMeetingItem" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "meetingId"   TEXT NOT NULL,
  "schoolId"    TEXT NOT NULL,
  "programId"   INTEGER NOT NULL,
  "light"       "ProgramLight" NOT NULL,
  "kind"        "AgendaKind" NOT NULL,
  "note"        TEXT NOT NULL,
  "createdById" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "outcome"     "AgendaOutcome",
  "outcomeNote" TEXT,
  "outcomeAt"   TIMESTAMP(3),
  "outcomeById" TEXT,
  CONSTRAINT "AdminMeetingItem_meetingId_fkey"   FOREIGN KEY ("meetingId")   REFERENCES "AdminMeeting"("id") ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT "AdminMeetingItem_schoolId_fkey"    FOREIGN KEY ("schoolId")    REFERENCES "School"("id")       ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT "AdminMeetingItem_programId_fkey"   FOREIGN KEY ("programId")   REFERENCES "ProgramPage"("id")  ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT "AdminMeetingItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id")         ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "AdminMeetingItem_outcomeById_fkey" FOREIGN KEY ("outcomeById") REFERENCES "User"("id")         ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AdminMeetingItem_meetingId_idx" ON "AdminMeetingItem"("meetingId");
CREATE INDEX IF NOT EXISTS "AdminMeetingItem_programId_idx" ON "AdminMeetingItem"("programId");
CREATE INDEX IF NOT EXISTS "AdminMeetingItem_schoolId_idx"  ON "AdminMeetingItem"("schoolId");
