-- A student ambassador and their teacher, in writing.
--
-- The ambassador had no way to ask anything. Everything on their side was
-- one-directional: they sent work up, the teacher said yes or no, and the
-- Updates page told them what happened. A fifteen-year-old who does not
-- understand why their flyer was set aside had nowhere to say so.
--
-- A conversation is (ambassadorId), the same way a school's is derived from
-- (schoolId, programId) — there is nothing to store about one that this
-- column does not already say.
--
-- `audience` is who the other side is. TEACHER is their own supervising
-- teacher. JOC is reserved and nothing writes it yet: a channel between
-- adults at JOC and somebody's child is a decision about safeguarding, not
-- a feature, and it is not one to make in a migration.
CREATE TABLE IF NOT EXISTS "AmbassadorMessage" (
  "id"            TEXT NOT NULL,
  "ambassadorId"  TEXT NOT NULL,
  "audience"      TEXT NOT NULL DEFAULT 'TEACHER',
  "body"          TEXT NOT NULL,
  -- True when the student wrote it.
  "fromStudent"   BOOLEAN NOT NULL DEFAULT false,
  "authorId"      TEXT,
  "sentAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "seenAt"        TIMESTAMP(3),
  CONSTRAINT "AmbassadorMessage_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AmbassadorMessage" ADD CONSTRAINT "AmbassadorMessage_ambassadorId_fkey"
  FOREIGN KEY ("ambassadorId") REFERENCES "ProgramAmbassador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AmbassadorMessage" ADD CONSTRAINT "AmbassadorMessage_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "AmbassadorMessage_ambassadorId_sentAt_idx" ON "AmbassadorMessage"("ambassadorId", "sentAt");
CREATE INDEX IF NOT EXISTS "AmbassadorMessage_ambassadorId_fromStudent_seenAt_idx" ON "AmbassadorMessage"("ambassadorId", "fromStudent", "seenAt");
