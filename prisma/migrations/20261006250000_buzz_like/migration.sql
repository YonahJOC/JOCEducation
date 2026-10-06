-- A thumbs up on a school update.
--
-- One per person per item, which is what the unique index is for: a count
-- that can be clicked twice is not a count of anything.
CREATE TABLE IF NOT EXISTS "BuzzLike" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "activityId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BuzzLike_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "BuzzLike_userId_activityId_key" ON "BuzzLike"("userId", "activityId");
CREATE INDEX IF NOT EXISTS "BuzzLike_activityId_idx" ON "BuzzLike"("activityId");
ALTER TABLE "BuzzLike" ADD CONSTRAINT "BuzzLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BuzzLike" ADD CONSTRAINT "BuzzLike_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "SchoolActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
