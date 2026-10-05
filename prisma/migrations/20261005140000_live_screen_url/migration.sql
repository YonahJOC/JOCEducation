-- Where a school's live screen lives.
--
-- liveScreenAt recorded that a screen existed and never said where, which is
-- a date nobody can act on.

ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "liveScreenUrl" TEXT;
