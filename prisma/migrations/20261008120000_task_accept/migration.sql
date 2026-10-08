-- A handed-off task is an offer, not a posting. It waits in the other
-- person's For you until they take it on, and the sender is told either way.
ALTER TABLE "DeskTodo" ADD COLUMN "acceptedAt" TIMESTAMP(3);

ALTER TABLE "DeskTodo" ADD COLUMN "declinedAt" TIMESTAMP(3);

-- Anything already handed over was on somebody's list under the old rule.
-- Leaving it unaccepted would take it off their list this afternoon.
UPDATE "DeskTodo" SET "acceptedAt" = "createdAt" WHERE "assignedById" IS NOT NULL;
