-- A program can carry its own form, and its own people.
ALTER TABLE "ProgramPage" ADD COLUMN IF NOT EXISTS "formId" TEXT;
ALTER TABLE "ProgramPage" DROP CONSTRAINT IF EXISTS "ProgramPage_formId_fkey";
ALTER TABLE "ProgramPage" ADD CONSTRAINT "ProgramPage_formId_fkey"
  FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Who runs which program. A lead sees that one program and its answers
-- without needing the run of the whole console.
CREATE TABLE IF NOT EXISTS "_ProgramLeads" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "_ProgramLeads_AB_unique" ON "_ProgramLeads"("A", "B");
CREATE INDEX IF NOT EXISTS "_ProgramLeads_B_index" ON "_ProgramLeads"("B");

ALTER TABLE "_ProgramLeads" DROP CONSTRAINT IF EXISTS "_ProgramLeads_A_fkey";
ALTER TABLE "_ProgramLeads" ADD CONSTRAINT "_ProgramLeads_A_fkey"
  FOREIGN KEY ("A") REFERENCES "ProgramPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ProgramLeads" DROP CONSTRAINT IF EXISTS "_ProgramLeads_B_fkey";
ALTER TABLE "_ProgramLeads" ADD CONSTRAINT "_ProgramLeads_B_fkey"
  FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
