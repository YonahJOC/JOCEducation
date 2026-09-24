-- What a school brings on the day, and what students can actually do.
--
-- The Kindness Booth page on justonechesed.org carries three things the
-- portal had no field for: the four acts of kindness on offer, the note that
-- a new one is added each month, and the short list of what the school
-- supplies. They were living in a marketing page and in people's heads.

ALTER TABLE "ProgramPage"
  ADD COLUMN "schoolProvides"  TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "activitiesTitle" TEXT,
  ADD COLUMN "activitiesNote"  TEXT;

CREATE TABLE "ProgramActivity" (
  "id"          SERIAL       NOT NULL,
  "programId"   INTEGER      NOT NULL,
  "title"       TEXT         NOT NULL,
  "description" TEXT         NOT NULL,
  "order"       INTEGER      NOT NULL DEFAULT 0,

  CONSTRAINT "ProgramActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProgramActivity_programId_idx" ON "ProgramActivity"("programId");

ALTER TABLE "ProgramActivity"
  ADD CONSTRAINT "ProgramActivity_programId_fkey"
  FOREIGN KEY ("programId") REFERENCES "ProgramPage"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
