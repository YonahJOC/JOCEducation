-- CreateTable
CREATE TABLE "ProgramPage" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "heroColor" TEXT NOT NULL DEFAULT '#2D46AF',
    "meta" TEXT NOT NULL,
    "available" TEXT[],
    "whatsIncluded" TEXT[],
    "externalHref" TEXT,
    "cta" TEXT NOT NULL DEFAULT 'Register your school',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramStep" (
    "id" SERIAL NOT NULL,
    "programId" INTEGER NOT NULL,
    "step" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProgramStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgramPage_slug_key" ON "ProgramPage"("slug");

-- CreateIndex
CREATE INDEX "ProgramStep_programId_idx" ON "ProgramStep"("programId");

-- AddForeignKey
ALTER TABLE "ProgramStep" ADD CONSTRAINT "ProgramStep_programId_fkey" FOREIGN KEY ("programId") REFERENCES "ProgramPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
