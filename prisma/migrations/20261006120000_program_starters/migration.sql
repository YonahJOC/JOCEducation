-- What a school might ask about a program, and the chips on its Ask button.
--
-- Content, not code: the people who run a program know what their schools ask
-- and should not need a deploy to change it.

ALTER TABLE "ProgramPage"
  ADD COLUMN IF NOT EXISTS "starterQuestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "askTopics"        TEXT[] DEFAULT ARRAY[]::TEXT[];
