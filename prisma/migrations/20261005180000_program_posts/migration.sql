-- Things JOC writes once and every school on a program reads: updates, the
-- questions schools keep asking, and what they can open or download.
--
-- One table with a kind rather than three, so the next artefact a program
-- wants to hand its schools needs no migration.

DO $$ BEGIN
  CREATE TYPE "ProgramPostKind" AS ENUM ('UPDATE', 'QA', 'RESOURCE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ProgramPost" (
  "id"          TEXT NOT NULL,
  "programId"   INTEGER NOT NULL,
  "kind"        "ProgramPostKind" NOT NULL,
  "title"       TEXT NOT NULL,
  "body"        TEXT NOT NULL,
  "url"         TEXT,
  "published"   BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "order"       INTEGER NOT NULL DEFAULT 0,
  "authorId"    TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProgramPost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProgramPost_programId_kind_published_idx"
  ON "ProgramPost"("programId", "kind", "published");
