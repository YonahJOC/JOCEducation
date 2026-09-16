-- A program can be announced before it runs. Without this the only options
-- were to hide it or to invite schools to register for something that does
-- not exist yet.
ALTER TABLE "ProgramPage" ADD COLUMN IF NOT EXISTS "comingSoon" BOOLEAN NOT NULL DEFAULT false;
