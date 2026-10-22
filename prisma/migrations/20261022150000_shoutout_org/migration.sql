-- Where somebody is from, when they are not from a school.
--
-- A school's shout-out says a grade, because the person is a pupil there
-- and that is the useful thing about them. Somebody who scanned the code in
-- JOC's own lobby is from a shul, a seminary, an office or nowhere in
-- particular, and "9th grade" has nothing to say about them.
--
-- Nullable, and nothing writes it except the lobby's own landing page, so
-- every existing row and all thirty school screens carry on unchanged.

ALTER TABLE "ShoutOut" ADD COLUMN IF NOT EXISTS "org" TEXT;
