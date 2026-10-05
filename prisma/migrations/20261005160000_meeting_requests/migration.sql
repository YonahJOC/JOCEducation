-- When a school would like to meet.
--
-- A meeting request is an ask with a date on it rather than its own table: it
-- wants the same console row, the same answer and the same record afterwards.

ALTER TABLE "SchoolActivity" ADD COLUMN IF NOT EXISTS "requestedFor" TIMESTAMP(3);
