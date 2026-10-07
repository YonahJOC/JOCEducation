-- A name against an invited address.
--
-- The box took an email and nothing else, so somebody typing "Moshe Hirt"
-- was told it did not look like an email address and nothing was saved. A
-- person has a name; the address is how the account will be matched, not
-- what anybody calls them.
ALTER TABLE "BuzzInvite" ADD COLUMN IF NOT EXISTS "name" TEXT;
