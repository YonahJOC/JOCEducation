-- Two-stage approval for anything that goes on a screen.
--
-- A student ambassador gives the first approval (ENDORSED) or sets an item
-- aside (SET_ASIDE); the school gives the second (APPROVED) or refuses it
-- (REJECTED). Only APPROVED has ever reached a wall and that does not change,
-- so a half-migrated database shows exactly what it showed before.
--
-- SET_ASIDE is kept apart from REJECTED on purpose. A student with a fast
-- finger must not produce something indistinguishable from the school's own
-- decision, and an administrator has to be able to see the pile and overturn
-- any of it.
--
-- Each statement runs on its own here (scripts/apply-migration.mjs does not
-- wrap them), which is what lets ALTER TYPE ... ADD VALUE work at all: a new
-- enum label cannot be used by a statement in the same transaction that
-- added it.

ALTER TYPE "ScreenItemStatus" ADD VALUE IF NOT EXISTS 'ENDORSED';

ALTER TYPE "ScreenItemStatus" ADD VALUE IF NOT EXISTS 'SET_ASIDE';

ALTER TABLE "ScreenFlyer" ADD COLUMN IF NOT EXISTS "endorsedById" TEXT;

ALTER TABLE "ScreenFlyer" ADD COLUMN IF NOT EXISTS "endorsedAt" TIMESTAMP(3);

ALTER TABLE "ScreenPhoto" ADD COLUMN IF NOT EXISTS "endorsedById" TEXT;

ALTER TABLE "ScreenPhoto" ADD COLUMN IF NOT EXISTS "endorsedAt" TIMESTAMP(3);

ALTER TABLE "ShoutOut" ADD COLUMN IF NOT EXISTS "endorsedById" TEXT;

ALTER TABLE "ShoutOut" ADD COLUMN IF NOT EXISTS "endorsedAt" TIMESTAMP(3);

-- Postgres has no ADD CONSTRAINT IF NOT EXISTS. These are written on one line
-- each because the migration runner splits on a semicolon followed by a
-- newline, and a multi-line DO block would be torn in half by it.
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ScreenFlyer_endorsedById_fkey') THEN ALTER TABLE "ScreenFlyer" ADD CONSTRAINT "ScreenFlyer_endorsedById_fkey" FOREIGN KEY ("endorsedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ScreenPhoto_endorsedById_fkey') THEN ALTER TABLE "ScreenPhoto" ADD CONSTRAINT "ScreenPhoto_endorsedById_fkey" FOREIGN KEY ("endorsedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ShoutOut_endorsedById_fkey') THEN ALTER TABLE "ShoutOut" ADD CONSTRAINT "ShoutOut_endorsedById_fkey" FOREIGN KEY ("endorsedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; END IF; END $$;

-- The queues are read by status, per school, newest first.
CREATE INDEX IF NOT EXISTS "ScreenFlyer_schoolId_status_idx" ON "ScreenFlyer"("schoolId", "status");
