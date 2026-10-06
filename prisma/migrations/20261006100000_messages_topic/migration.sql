-- A message can carry the topic it was raised under.
--
-- An ask used to be its own one-shot thing: a question with a chip and a
-- single reply, living in SchoolActivity. It is a message with a label on it
-- now, so a school that asks from a program page and a school that writes in
-- the thread end up in the same conversation instead of two places neither
-- side can see whole.

ALTER TABLE "SchoolMessage" ADD COLUMN IF NOT EXISTS "topic" TEXT;
