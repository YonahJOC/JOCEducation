-- Student ambassadors: two per program per school, scoped and time-limited.

CREATE TABLE IF NOT EXISTS "ProgramAmbassador" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "userId"       TEXT NOT NULL,
  "schoolId"     TEXT NOT NULL,
  "programId"    INTEGER NOT NULL,
  "supervisorId" TEXT NOT NULL,
  "startsAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endsAt"       TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProgramAmbassador_userId_fkey"       FOREIGN KEY ("userId")       REFERENCES "User"("id")        ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT "ProgramAmbassador_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id")        ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ProgramAmbassador_schoolId_fkey"     FOREIGN KEY ("schoolId")     REFERENCES "School"("id")      ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT "ProgramAmbassador_programId_fkey"    FOREIGN KEY ("programId")    REFERENCES "ProgramPage"("id") ON DELETE CASCADE  ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProgramAmbassador_userId_schoolId_programId_key" ON "ProgramAmbassador"("userId","schoolId","programId");
CREATE INDEX IF NOT EXISTS "ProgramAmbassador_schoolId_programId_idx" ON "ProgramAmbassador"("schoolId","programId");
CREATE INDEX IF NOT EXISTS "ProgramAmbassador_supervisorId_idx" ON "ProgramAmbassador"("supervisorId");

CREATE TABLE IF NOT EXISTS "AmbassadorInvite" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "code"        TEXT NOT NULL,
  "schoolId"    TEXT NOT NULL,
  "programId"   INTEGER NOT NULL,
  "createdById" TEXT NOT NULL,
  "expiresAt"   TIMESTAMP(3) NOT NULL,
  "usedCount"   INTEGER NOT NULL DEFAULT 0,
  "revokedAt"   TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AmbassadorInvite_schoolId_fkey"    FOREIGN KEY ("schoolId")    REFERENCES "School"("id")      ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AmbassadorInvite_programId_fkey"   FOREIGN KEY ("programId")   REFERENCES "ProgramPage"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AmbassadorInvite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id")        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "AmbassadorInvite_code_key" ON "AmbassadorInvite"("code");
CREATE INDEX IF NOT EXISTS "AmbassadorInvite_schoolId_programId_idx" ON "AmbassadorInvite"("schoolId","programId");
CREATE INDEX IF NOT EXISTS "AmbassadorInvite_expiresAt_idx" ON "AmbassadorInvite"("expiresAt");

CREATE TABLE IF NOT EXISTS "EventReport" (
  "id"                 TEXT NOT NULL PRIMARY KEY,
  "ambassadorId"       TEXT NOT NULL,
  "eventId"            INTEGER,
  "occurredOn"         TIMESTAMP(3) NOT NULL,
  "participants"       INTEGER,
  "whatHappened"       TEXT NOT NULL,
  "wentWell"           TEXT,
  "wouldChange"        TEXT,
  "photoId"            TEXT,
  "photoShared"        BOOLEAN NOT NULL DEFAULT false,
  "submittedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "seenBySupervisorAt" TIMESTAMP(3),
  CONSTRAINT "EventReport_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "ProgramAmbassador"("id") ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT "EventReport_eventId_fkey"      FOREIGN KEY ("eventId")      REFERENCES "ProgramEvent"("id")     ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "EventReport_photoId_fkey"      FOREIGN KEY ("photoId")      REFERENCES "StoredFile"("id")       ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "EventReport_ambassadorId_occurredOn_idx" ON "EventReport"("ambassadorId","occurredOn");
CREATE INDEX IF NOT EXISTS "EventReport_eventId_idx" ON "EventReport"("eventId");
CREATE INDEX IF NOT EXISTS "EventReport_occurredOn_idx" ON "EventReport"("occurredOn");
