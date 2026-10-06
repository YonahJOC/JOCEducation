-- When each person last opened each thread.
--
-- Per person, not per item: a dot that clears for everybody the moment one
-- of us reads it is worse than no dot, because the other four never learn
-- there was anything to read.
CREATE TABLE IF NOT EXISTS "BuzzSeen" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "activityId" TEXT NOT NULL,
  "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BuzzSeen_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "BuzzSeen_userId_activityId_key" ON "BuzzSeen"("userId", "activityId");
CREATE INDEX IF NOT EXISTS "BuzzSeen_userId_idx" ON "BuzzSeen"("userId");
ALTER TABLE "BuzzSeen" ADD CONSTRAINT "BuzzSeen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BuzzSeen" ADD CONSTRAINT "BuzzSeen_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "SchoolActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
