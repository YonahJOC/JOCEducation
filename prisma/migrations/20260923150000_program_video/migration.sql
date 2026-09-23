-- A promo video at the top of each program page.
ALTER TABLE "ProgramPage" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
