-- My desk, v5: a task you can hand to somebody, a notebook, and a Buzz note
-- you can be finished with without closing it for everybody.

-- Tasks gain a when, a hand-off and a status.
--
-- A hand-off is one row on the recipient's desk with assignedById set — not
-- two rows kept in step. Dalia's "waiting on others" is the same row read
-- from the other end, so it cannot disagree with what Tuvia sees.
ALTER TABLE "DeskTodo" ADD COLUMN IF NOT EXISTS "whenBucket" TEXT NOT NULL DEFAULT 'TODAY';
ALTER TABLE "DeskTodo" ADD COLUMN IF NOT EXISTS "seenAt" TIMESTAMP(3);
ALTER TABLE "DeskTodo" ADD COLUMN IF NOT EXISTS "nudgedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "DeskTodo_assignedById_idx" ON "DeskTodo"("assignedById");

-- A private notebook. Nobody else ever reads it.
CREATE TABLE IF NOT EXISTS "NotebookPage" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL DEFAULT '',
  "body" TEXT NOT NULL DEFAULT '',
  "sort" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotebookPage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "NotebookPage_userId_sort_idx" ON "NotebookPage"("userId", "sort");
ALTER TABLE "NotebookPage" ADD CONSTRAINT "NotebookPage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- "Done for me" on a Buzz note: personal, and nothing to do with closing a
-- thread. One person being finished with a note is not the school being
-- answered.
CREATE TABLE IF NOT EXISTS "BuzzDone" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "activityId" TEXT NOT NULL,
  "doneAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BuzzDone_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "BuzzDone_userId_activityId_key" ON "BuzzDone"("userId", "activityId");
ALTER TABLE "BuzzDone" ADD CONSTRAINT "BuzzDone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BuzzDone" ADD CONSTRAINT "BuzzDone_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "SchoolActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Closing a thread is the super admin's, and it is for everyone. The
-- existing doneAt/doneById become exactly that.
ALTER TABLE "SchoolActivity" ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3);
ALTER TABLE "SchoolActivity" ADD COLUMN IF NOT EXISTS "closedById" TEXT;
ALTER TABLE "SchoolActivity" ADD CONSTRAINT "SchoolActivity_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
UPDATE "SchoolActivity" SET "closedAt" = "doneAt", "closedById" = "doneById" WHERE "doneAt" IS NOT NULL;

-- Something in For you that this person has dealt with. Kind plus the id of
-- whatever it points at, because the three sources are three tables.
CREATE TABLE IF NOT EXISTS "InTrayCleared" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "refId" TEXT NOT NULL,
  "clearedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InTrayCleared_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "InTrayCleared_userId_kind_refId_key" ON "InTrayCleared"("userId", "kind", "refId");
ALTER TABLE "InTrayCleared" ADD CONSTRAINT "InTrayCleared_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
