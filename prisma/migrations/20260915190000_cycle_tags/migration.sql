-- One hardcoded "Israel-focused" checkbox meant the education team had to ask
-- a developer for any other label. Cycles now carry as many labels as apply,
-- named by whoever is editing them.
ALTER TABLE "Cycle" ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Carry the old flag across so nothing is lost.
UPDATE "Cycle" SET "tags" = ARRAY['Israel-focused'] WHERE "israel" = true AND cardinality("tags") = 0;

-- "israel" is deliberately left in place, unread, so the old value is
-- recoverable if the backfill turns out to have been wrong.
