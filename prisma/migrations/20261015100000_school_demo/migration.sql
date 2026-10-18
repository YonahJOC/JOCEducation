-- The demo portal.
--
-- A school with demoAt set sees its hallway screen and its people, and
-- nothing else. Null for every school that exists today, so this migration
-- changes nothing until somebody turns a school on.
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "demoAt" TIMESTAMP(3);

-- The rollout asks "who is on the demo" on every console load.
CREATE INDEX IF NOT EXISTS "School_demoAt_idx" ON "School"("demoAt");
