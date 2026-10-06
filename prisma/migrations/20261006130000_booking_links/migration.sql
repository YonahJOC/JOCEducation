-- Where a school books time with JOC.
--
-- On the person, because it is their calendar and only they know when it
-- moves. On the program too, for one that keeps its own booking page.

ALTER TABLE "User"        ADD COLUMN IF NOT EXISTS "bookingUrl" TEXT;
ALTER TABLE "ProgramPage" ADD COLUMN IF NOT EXISTS "bookingUrl" TEXT;
