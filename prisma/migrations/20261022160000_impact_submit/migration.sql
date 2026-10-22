-- Every push from the counter in the centre to the wall.
--
-- The totals themselves live in the lobby document, which is one number per
-- thing and no memory of how it got there. That is fine until somebody taps
-- +1 eleven times too many, or a group is counted twice, and the only way to
-- find the mistake is to remember who was in the building.
--
-- So each submit is written down: what was added, to which counter, by whom,
-- for which group. It is an audit trail and the raw material for an undo. It
-- never decides what the wall shows - the document does that - so losing this
-- table would cost history and not correctness.

CREATE TABLE IF NOT EXISTS "ImpactSubmit" (
  "id"         TEXT NOT NULL,
  -- "pizzas" or "beds". Text rather than an enum: a third project should
  -- cost a row, not a migration and a deploy.
  "project"    TEXT NOT NULL,
  -- The change, not the running total. Negative when staff corrected a
  -- count downward after submitting it.
  "delta"      INTEGER NOT NULL,
  -- What the counter read after this submit, for reconciling against the
  -- document if the two ever disagree.
  "total"      INTEGER NOT NULL,
  "groupName"  TEXT,
  "byId"       TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ImpactSubmit_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ImpactSubmit_byId_fkey') THEN ALTER TABLE "ImpactSubmit" ADD CONSTRAINT "ImpactSubmit_byId_fkey" FOREIGN KEY ("byId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; END IF; END $$;

CREATE INDEX IF NOT EXISTS "ImpactSubmit_createdAt_idx" ON "ImpactSubmit"("createdAt" DESC);
