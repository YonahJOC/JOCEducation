-- The two things the console home needs that nothing else in here holds:
-- one person's list, and a noticeboard for the whole office.

-- A thing somebody has to do. Three sources, one row: what they typed, what
-- they took off the Buzz, and what somebody handed them. They look the same
-- on the page on purpose — a list that sorts itself by where an item came
-- from is a list nobody works through.
CREATE TABLE IF NOT EXISTS "DeskTodo" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'MINE',
  "activityId" TEXT,
  "assignedById" TEXT,
  "due" TIMESTAMP(3),
  "doneAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeskTodo_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "DeskTodo_userId_doneAt_idx" ON "DeskTodo"("userId", "doneAt");
CREATE INDEX IF NOT EXISTS "DeskTodo_activityId_idx" ON "DeskTodo"("activityId");
ALTER TABLE "DeskTodo" ADD CONSTRAINT "DeskTodo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeskTodo" ADD CONSTRAINT "DeskTodo_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "SchoolActivity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DeskTodo" ADD CONSTRAINT "DeskTodo_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Something one team needs everybody to know. Comes down on its own date,
-- because a noticeboard nobody clears is a wall of last term.
CREATE TABLE IF NOT EXISTS "Notice" (
  "id" TEXT NOT NULL,
  "dept" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "authorId" TEXT,
  "takeDownAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Notice_createdAt_idx" ON "Notice"("createdAt");
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Read is per person, for the same reason the Buzz's unread dot is.
CREATE TABLE IF NOT EXISTS "NoticeRead" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "noticeId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NoticeRead_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "NoticeRead_userId_noticeId_key" ON "NoticeRead"("userId", "noticeId");
ALTER TABLE "NoticeRead" ADD CONSTRAINT "NoticeRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NoticeRead" ADD CONSTRAINT "NoticeRead_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "Notice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A Buzz note everybody can see is finished with, as against one person
-- having picked it up.
ALTER TABLE "SchoolActivity" ADD COLUMN IF NOT EXISTS "doneAt" TIMESTAMP(3);
ALTER TABLE "SchoolActivity" ADD COLUMN IF NOT EXISTS "doneById" TEXT;
