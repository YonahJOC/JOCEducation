-- A sign-up belongs to a school, and a teacher can run their school's app.
ALTER TABLE "FormResponse" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
CREATE INDEX IF NOT EXISTS "FormResponse_schoolId_idx" ON "FormResponse"("schoolId");
ALTER TABLE "FormResponse" ADD CONSTRAINT "FormResponse_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "schoolAppAdmin" BOOLEAN NOT NULL DEFAULT false;
UPDATE "FormResponse" r SET "schoolId" = u."schoolId" FROM "User" u WHERE r."userId" = u.id AND r."schoolId" IS NULL AND u."schoolId" IS NOT NULL;
