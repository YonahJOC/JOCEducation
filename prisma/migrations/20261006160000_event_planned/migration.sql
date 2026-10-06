-- An event that is booked but has not happened yet.
--
-- A VISIT dated in the future would have read as something somebody did,
-- which is the one thing it is not: nobody has been there. Dalia's board
-- needs to tell "we are going" from "we went".
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'EVENT_PLANNED';
