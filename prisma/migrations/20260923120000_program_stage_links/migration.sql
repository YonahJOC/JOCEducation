-- A stage on a program page can carry a call to action.
ALTER TABLE "ProgramStep" ADD COLUMN IF NOT EXISTS "linkLabel" TEXT;
ALTER TABLE "ProgramStep" ADD COLUMN IF NOT EXISTS "linkUrl" TEXT;
