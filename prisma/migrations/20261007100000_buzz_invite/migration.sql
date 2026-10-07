-- Somebody given the Buzz before they have ever signed in.
--
-- The switch list can only offer people who already have an account, which
-- is the wrong way round for a new member of staff: the moment to decide
-- they should see this is when they start, not the first time they happen
-- to log in.
--
-- Kept by email rather than by creating a half-made User: a stub account
-- with no provider record is something Google sign-in would have to be
-- taught to adopt, and getting that wrong locks a real person out of
-- everything, not just the Buzz.
CREATE TABLE IF NOT EXISTS "BuzzInvite" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "invitedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BuzzInvite_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "BuzzInvite_email_key" ON "BuzzInvite"("email");
ALTER TABLE "BuzzInvite" ADD CONSTRAINT "BuzzInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
