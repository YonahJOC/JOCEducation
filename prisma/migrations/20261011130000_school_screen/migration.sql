-- The school live screen: the TV each school puts in its hallway.
--
-- Four tables, one for each kind of thing the screen shows that somebody has
-- to choose — the day's dedication, the slideshow's flyers, the photos of
-- students, and the shout-outs students send from the QR code — plus the
-- school's own settings for its screen on the School row.
--
-- Everything a student or ambassador adds arrives PENDING and stays off the
-- wall until a teacher or JOC approves it. Written to be safe to run twice.

DO $$ BEGIN
  CREATE TYPE "ScreenItemStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ScreenFlyerTemplate" AS ENUM ('EVENT', 'PROGRAM', 'BANNER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "screenEmailDomains" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "screenGradeGoal" INTEGER;
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "screenLogoUrl" TEXT;
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "screenShortName" TEXT;

CREATE TABLE IF NOT EXISTS "ScreenDedication" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT,
    "date" DATE NOT NULL,
    "hebrewName" TEXT NOT NULL,
    "text" TEXT,
    "setById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScreenDedication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ScreenFlyer" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT,
    "template" "ScreenFlyerTemplate" NOT NULL,
    "title" TEXT NOT NULL,
    "line" TEXT,
    "startsAt" TIMESTAMP(3),
    "time" TEXT,
    "place" TEXT,
    "ambassadors" TEXT,
    "icon" TEXT,
    "imageId" TEXT,
    "qrUrl" TEXT,
    "qrLabel" TEXT,
    "showFrom" TIMESTAMP(3) NOT NULL,
    "showUntil" TIMESTAMP(3) NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "status" "ScreenItemStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ScreenFlyer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ScreenPhoto" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "caption" TEXT,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "status" "ScreenItemStatus" NOT NULL DEFAULT 'PENDING',
    "uploadedById" TEXT,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScreenPhoto_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ShoutOut" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastInitial" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "showName" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT,
    "authorEmail" TEXT NOT NULL,
    "status" "ScreenItemStatus" NOT NULL DEFAULT 'PENDING',
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShoutOut_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ScreenDedication_date_schoolId_idx" ON "ScreenDedication"("date", "schoolId");
CREATE INDEX IF NOT EXISTS "ScreenFlyer_schoolId_status_idx" ON "ScreenFlyer"("schoolId", "status");
CREATE INDEX IF NOT EXISTS "ScreenPhoto_schoolId_status_idx" ON "ScreenPhoto"("schoolId", "status");
CREATE INDEX IF NOT EXISTS "ShoutOut_schoolId_status_createdAt_idx" ON "ShoutOut"("schoolId", "status", "createdAt");

DO $$ BEGIN
  ALTER TABLE "ScreenDedication" ADD CONSTRAINT "ScreenDedication_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ScreenDedication" ADD CONSTRAINT "ScreenDedication_setById_fkey" FOREIGN KEY ("setById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ScreenFlyer" ADD CONSTRAINT "ScreenFlyer_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ScreenFlyer" ADD CONSTRAINT "ScreenFlyer_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "StoredFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ScreenFlyer" ADD CONSTRAINT "ScreenFlyer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ScreenFlyer" ADD CONSTRAINT "ScreenFlyer_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ScreenPhoto" ADD CONSTRAINT "ScreenPhoto_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ScreenPhoto" ADD CONSTRAINT "ScreenPhoto_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "StoredFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ScreenPhoto" ADD CONSTRAINT "ScreenPhoto_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ScreenPhoto" ADD CONSTRAINT "ScreenPhoto_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ShoutOut" ADD CONSTRAINT "ShoutOut_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ShoutOut" ADD CONSTRAINT "ShoutOut_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ShoutOut" ADD CONSTRAINT "ShoutOut_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
