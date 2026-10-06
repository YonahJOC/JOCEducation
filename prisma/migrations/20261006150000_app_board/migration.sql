-- The JOC App clients board, which replaces the Monday board of the same
-- name.
--
-- The statuses, the extra columns and the one-off ticks are rows rather than
-- enums on purpose: everything a coordinator could rename or reorder in
-- Monday they can rename or reorder here, and a board that needs a developer
-- to add a column is a board people go back to Monday for.

CREATE TYPE "StudentListState" AS ENUM ('NOT_SENT', 'UPLOADED', 'STUCK');
CREATE TYPE "SchoolNetwork"    AS ENUM ('YESHIVA_LEAGUE', 'ISRAEL', 'CANADA');

ALTER TYPE "SchoolType" ADD VALUE IF NOT EXISTS 'MIDDLE_SCHOOL';

CREATE TABLE "BoardStatus" (
  "id"    TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "tone"  TEXT NOT NULL DEFAULT 'ink',
  "sort"  INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "BoardStatus_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BoardStatus_sort_idx" ON "BoardStatus"("sort");

CREATE TABLE "BoardField" (
  "id"    TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "sort"  INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "BoardField_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BoardField_sort_idx" ON "BoardField"("sort");

CREATE TABLE "BoardFieldValue" (
  "fieldId"  TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "value"    TEXT NOT NULL,
  CONSTRAINT "BoardFieldValue_pkey" PRIMARY KEY ("fieldId", "schoolId")
);
CREATE INDEX "BoardFieldValue_schoolId_idx" ON "BoardFieldValue"("schoolId");

CREATE TABLE "BoardCheck" (
  "id"    TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "sort"  INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "BoardCheck_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BoardCheck_sort_idx" ON "BoardCheck"("sort");

CREATE TABLE "BoardCheckMark" (
  "checkId"  TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "byId"     TEXT,
  "imported" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "BoardCheckMark_pkey" PRIMARY KEY ("checkId", "schoolId")
);
CREATE INDEX "BoardCheckMark_schoolId_idx" ON "BoardCheckMark"("schoolId");

CREATE TABLE "StudentListFile" (
  "id"           TEXT NOT NULL,
  "schoolId"     TEXT NOT NULL,
  "fileId"       TEXT NOT NULL,
  "uploadedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "uploadedById" TEXT,
  "fromSchool"   BOOLEAN NOT NULL DEFAULT false,
  "label"        TEXT,
  CONSTRAINT "StudentListFile_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "StudentListFile_schoolId_uploadedAt_idx"
  ON "StudentListFile"("schoolId", "uploadedAt");

ALTER TABLE "School"
  ADD COLUMN IF NOT EXISTS "boardStatusId"    TEXT,
  ADD COLUMN IF NOT EXISTS "network"          "SchoolNetwork",
  ADD COLUMN IF NOT EXISTS "onBoard"          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "studentListState" "StudentListState" NOT NULL DEFAULT 'NOT_SENT',
  ADD COLUMN IF NOT EXISTS "studentListNote"  TEXT;

ALTER TABLE "BoardFieldValue"
  ADD CONSTRAINT "BoardFieldValue_fieldId_fkey"
  FOREIGN KEY ("fieldId") REFERENCES "BoardField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BoardFieldValue"
  ADD CONSTRAINT "BoardFieldValue_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BoardCheckMark"
  ADD CONSTRAINT "BoardCheckMark_checkId_fkey"
  FOREIGN KEY ("checkId") REFERENCES "BoardCheck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BoardCheckMark"
  ADD CONSTRAINT "BoardCheckMark_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BoardCheckMark"
  ADD CONSTRAINT "BoardCheckMark_byId_fkey"
  FOREIGN KEY ("byId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StudentListFile"
  ADD CONSTRAINT "StudentListFile_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentListFile"
  ADD CONSTRAINT "StudentListFile_fileId_fkey"
  FOREIGN KEY ("fileId") REFERENCES "StoredFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentListFile"
  ADD CONSTRAINT "StudentListFile_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "School"
  ADD CONSTRAINT "School_boardStatusId_fkey"
  FOREIGN KEY ("boardStatusId") REFERENCES "BoardStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
