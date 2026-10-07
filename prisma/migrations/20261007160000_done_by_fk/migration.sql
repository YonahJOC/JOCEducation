-- doneById was a loose column; the card wants the name against it.
ALTER TABLE "SchoolActivity" ADD CONSTRAINT "SchoolActivity_doneById_fkey" FOREIGN KEY ("doneById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "SchoolActivity_doneById_idx" ON "SchoolActivity"("doneById");
