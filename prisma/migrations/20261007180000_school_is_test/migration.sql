-- A school that exists to try something on.
--
-- Five of them are in here, and they were being counted as real: "38 of 45
-- have no contact" counted schools nobody will ever ring, and "Hey Gilad,
-- this is a test" sat at the top of the console as a thing that needed
-- somebody.
--
-- A column rather than matching on the name. A school called "Test School"
-- is a guess; a flag is a decision, and somebody can change it.
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "isTest" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "School_isTest_idx" ON "School"("isTest");
