-- AlterTable
ALTER TABLE "LessonPlan" ADD COLUMN     "cycleWeek" INTEGER;

-- CreateIndex
CREATE INDEX "LessonPlan_cycleSlug_cycleWeek_idx" ON "LessonPlan"("cycleSlug", "cycleWeek");
