-- A conversation between JOC and the people who run a school's account.
--
-- Not email. Nothing here leaves the system: a coordinator writes, and the
-- school reads it next time somebody signs in to their own panel.

CREATE TABLE IF NOT EXISTS "SchoolMessage" (
  "id"        TEXT NOT NULL,
  "schoolId"  TEXT NOT NULL,
  "programId" INTEGER,
  "body"      TEXT NOT NULL,
  "inbound"   BOOLEAN NOT NULL DEFAULT false,
  "authorId"  TEXT,
  "sentAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "seenAt"    TIMESTAMP(3),
  CONSTRAINT "SchoolMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SchoolMessage_schoolId_sentAt_idx"
  ON "SchoolMessage"("schoolId", "sentAt");

CREATE INDEX IF NOT EXISTS "SchoolMessage_schoolId_inbound_seenAt_idx"
  ON "SchoolMessage"("schoolId", "inbound", "seenAt");
