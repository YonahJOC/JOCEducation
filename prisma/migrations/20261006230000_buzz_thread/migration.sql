-- Comments on a school update, and taking one off the Buzz.
--
-- Removal is a date, not a DELETE. The row is also the school's own history
-- and the thing the board counts; destroying it to tidy the feed would take
-- a visit out of the record of a school. Hidden, with who hid it.
ALTER TABLE "SchoolActivity" ADD COLUMN IF NOT EXISTS "removedAt" TIMESTAMP(3);
ALTER TABLE "SchoolActivity" ADD COLUMN IF NOT EXISTS "removedById" TEXT;
CREATE INDEX IF NOT EXISTS "SchoolActivity_removedAt_idx" ON "SchoolActivity"("removedAt");

CREATE TABLE IF NOT EXISTS "BuzzNote" (
  "id" TEXT NOT NULL,
  "activityId" TEXT NOT NULL,
  "authorId" TEXT,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BuzzNote_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "BuzzNote_activityId_createdAt_idx" ON "BuzzNote"("activityId", "createdAt");
ALTER TABLE "BuzzNote" ADD CONSTRAINT "BuzzNote_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "SchoolActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BuzzNote" ADD CONSTRAINT "BuzzNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
