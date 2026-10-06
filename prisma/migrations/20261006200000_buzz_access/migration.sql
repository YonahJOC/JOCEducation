-- Who may read the Buzz, named one person at a time.
--
-- The capability on an admin type grants it to everybody holding that type,
-- which is the wrong shape for this: the Buzz is a list of people somebody
-- decided on, not a rank. A column of its own means the list can be read and
-- changed on one screen without touching anybody's console permissions.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "buzzAccess" BOOLEAN NOT NULL DEFAULT false;
