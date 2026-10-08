-- A person's own diary: meetings, calls, anything they put in their day
-- themselves. Separate from SchoolActivity, which is JOC's record of what
-- happened with a school and is read by everybody.
CREATE TABLE "DeskEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeskEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DeskEvent_userId_startsAt_idx" ON "DeskEvent"("userId", "startsAt");

ALTER TABLE "DeskEvent" ADD CONSTRAINT "DeskEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
