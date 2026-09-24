-- How many students at a school are signed up on the app.
--
-- The public leaderboard carries the count. Only the count is read; the
-- leaderboard itself is a list of children.

ALTER TABLE "AppSchoolStats"
  ADD COLUMN IF NOT EXISTS "studentsOnApp" INTEGER;
