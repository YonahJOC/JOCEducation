-- CreateTable
CREATE TABLE "Cycle" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "num" INTEGER NOT NULL,
    "theme" TEXT NOT NULL,
    "gloss" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "hebrew" TEXT NOT NULL,
    "anchor" TEXT NOT NULL,
    "range" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "weeks" INTEGER NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#2D46AF',
    "israel" BOOLEAN NOT NULL DEFAULT false,
    "desc" TEXT NOT NULL,
    "focus" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CycleWeek" (
    "id" SERIAL NOT NULL,
    "cycleId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CycleWeek_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cycle_slug_key" ON "Cycle"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Cycle_num_key" ON "Cycle"("num");

-- CreateIndex
CREATE INDEX "Cycle_startDate_idx" ON "Cycle"("startDate");

-- CreateIndex
CREATE INDEX "CycleWeek_cycleId_idx" ON "CycleWeek"("cycleId");

-- AddForeignKey
ALTER TABLE "CycleWeek" ADD CONSTRAINT "CycleWeek_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
