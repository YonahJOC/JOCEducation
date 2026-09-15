-- The programming team's role. Placed below ADMIN on purpose: it is not a
-- lesser education admin, it is a different job — the calendar and the school
-- accounts behind it, and deliberately nothing educational.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'PROGRAM_STAFF' BEFORE 'ADMIN';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "EventStatus" AS ENUM ('PLANNED', 'CONFIRMED', 'DONE', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ProgramEvent" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "programId" INTEGER,
    "schoolId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "allDay" BOOLEAN NOT NULL DEFAULT true,
    "location" TEXT,
    "audience" TEXT,
    "detail" TEXT NOT NULL DEFAULT '',
    "lead" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'PLANNED',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ProgramEvent_slug_key" ON "ProgramEvent"("slug");
CREATE INDEX IF NOT EXISTS "ProgramEvent_startsAt_idx" ON "ProgramEvent"("startsAt");
CREATE INDEX IF NOT EXISTS "ProgramEvent_schoolId_idx" ON "ProgramEvent"("schoolId");
CREATE INDEX IF NOT EXISTS "ProgramEvent_published_startsAt_idx" ON "ProgramEvent"("published", "startsAt");

-- AddForeignKey
ALTER TABLE "ProgramEvent" DROP CONSTRAINT IF EXISTS "ProgramEvent_programId_fkey";
ALTER TABLE "ProgramEvent" ADD CONSTRAINT "ProgramEvent_programId_fkey" FOREIGN KEY ("programId") REFERENCES "ProgramPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProgramEvent" DROP CONSTRAINT IF EXISTS "ProgramEvent_schoolId_fkey";
ALTER TABLE "ProgramEvent" ADD CONSTRAINT "ProgramEvent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
