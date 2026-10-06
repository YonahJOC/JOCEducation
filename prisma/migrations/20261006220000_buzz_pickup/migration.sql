-- Somebody taking a school update off the Buzz to deal with.
--
-- Three columns rather than a move: the row stays where it is, on the school
-- and in the feed, and gains a name against it. Re-tagging it to whichever
-- program picked it up would rewrite what actually happened — a JOC App
-- meeting does not become a Boots meeting because the Boots coordinator is
-- the one chasing it.
ALTER TABLE "SchoolActivity" ADD COLUMN IF NOT EXISTS "takenById" TEXT;
ALTER TABLE "SchoolActivity" ADD COLUMN IF NOT EXISTS "takenAt" TIMESTAMP(3);
ALTER TABLE "SchoolActivity" ADD COLUMN IF NOT EXISTS "takenDoneAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "SchoolActivity_takenById_idx" ON "SchoolActivity"("takenById");
