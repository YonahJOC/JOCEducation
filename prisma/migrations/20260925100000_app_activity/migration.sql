DO $$ BEGIN CREATE TYPE "AppSyncStatus" AS ENUM ('RUNNING','OK','FAILED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "appSchoolId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "School_appSchoolId_key" ON "School"("appSchoolId");

CREATE TABLE IF NOT EXISTS "AppSchoolStats" (
  "schoolId" TEXT NOT NULL PRIMARY KEY,
  "minutesThisWeek" INTEGER NOT NULL DEFAULT 0,
  "minutesThisCycle" INTEGER NOT NULL DEFAULT 0,
  "minutesThisYear" INTEGER NOT NULL DEFAULT 0,
  "unapprovedMinutes" INTEGER NOT NULL DEFAULT 0,
  "unapprovedEntries" INTEGER NOT NULL DEFAULT 0,
  "unapprovedStudents" INTEGER NOT NULL DEFAULT 0,
  "unapprovedOldestAt" TIMESTAMP(3),
  "unapprovedThisWeek" INTEGER NOT NULL DEFAULT 0,
  "unapprovedOneToTwo" INTEGER NOT NULL DEFAULT 0,
  "unapprovedOverTwo" INTEGER NOT NULL DEFAULT 0,
  "activeStudents" INTEGER NOT NULL DEFAULT 0,
  "activeStudentsLast" INTEGER NOT NULL DEFAULT 0,
  "opportunitiesOpen" INTEGER NOT NULL DEFAULT 0,
  "opportunitiesThisWeek" INTEGER NOT NULL DEFAULT 0,
  "opportunitiesThisCycle" INTEGER NOT NULL DEFAULT 0,
  "lastActivityAt" TIMESTAMP(3),
  "lastActivityText" TEXT,
  "storeRedeemedThisMonth" INTEGER,
  "storeTopPrize" TEXT,
  "storeLastRedeemedAt" TIMESTAMP(3),
  "syncedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AppSchoolStats_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AppSchoolStats_syncedAt_idx" ON "AppSchoolStats"("syncedAt");

CREATE TABLE IF NOT EXISTS "AppChallengeStat" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "schoolId" TEXT NOT NULL,
  "appChallengeId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "cycleSlug" TEXT,
  "joined" INTEGER NOT NULL DEFAULT 0,
  "finished" INTEGER NOT NULL DEFAULT 0,
  "running" BOOLEAN NOT NULL DEFAULT true,
  "syncedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AppChallengeStat_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "AppChallengeStat_schoolId_appChallengeId_key" ON "AppChallengeStat"("schoolId","appChallengeId");

CREATE INDEX IF NOT EXISTS "AppChallengeStat_schoolId_idx" ON "AppChallengeStat"("schoolId");

CREATE TABLE IF NOT EXISTS "AppSchoolMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "schoolId" TEXT NOT NULL,
  "appMessageId" TEXT NOT NULL,
  "fromName" TEXT,
  "body" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL,
  "answered" BOOLEAN NOT NULL DEFAULT false,
  "syncedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AppSchoolMessage_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "AppSchoolMessage_appMessageId_key" ON "AppSchoolMessage"("appMessageId");

CREATE INDEX IF NOT EXISTS "AppSchoolMessage_schoolId_answered_idx" ON "AppSchoolMessage"("schoolId","answered");

CREATE TABLE IF NOT EXISTS "AppSyncRun" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "status" "AppSyncStatus" NOT NULL DEFAULT 'RUNNING',
  "rows" INTEGER NOT NULL DEFAULT 0,
  "unmatched" INTEGER NOT NULL DEFAULT 0,
  "error" TEXT
);

CREATE INDEX IF NOT EXISTS "AppSyncRun_startedAt_idx" ON "AppSyncRun"("startedAt");

CREATE INDEX IF NOT EXISTS "AppSyncRun_status_finishedAt_idx" ON "AppSyncRun"("status","finishedAt");
