-- A student may give their last name, not only its first letter.
--
-- The column was called lastInitial and the form would not accept a second
-- character, which is a decision the student should be making. Renamed
-- rather than kept, because a column called lastInitial is an invitation to
-- the next person to call charAt(0) on it.
--
-- No shout-out has ever been written, so there is nothing to convert.
ALTER TABLE "ShoutOut" RENAME COLUMN "lastInitial" TO "lastName";
