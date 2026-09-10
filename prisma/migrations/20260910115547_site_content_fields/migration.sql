-- CreateEnum
CREATE TYPE "SiteFieldType" AS ENUM ('SHORT_TEXT', 'LONG_TEXT', 'URL', 'EMAIL', 'NUMBER', 'IMAGE', 'REPEATABLE');

-- CreateTable
CREATE TABLE "SiteField" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "SiteFieldType" NOT NULL DEFAULT 'SHORT_TEXT',
    "help" TEXT,
    "valuePublished" TEXT,
    "valueDraft" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteFieldHistory" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedById" TEXT,

    CONSTRAINT "SiteFieldHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteField_page_sort_idx" ON "SiteField"("page", "sort");

-- CreateIndex
CREATE UNIQUE INDEX "SiteField_page_section_key_key" ON "SiteField"("page", "section", "key");

-- CreateIndex
CREATE INDEX "SiteFieldHistory_fieldId_publishedAt_idx" ON "SiteFieldHistory"("fieldId", "publishedAt");

-- AddForeignKey
ALTER TABLE "SiteField" ADD CONSTRAINT "SiteField_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteFieldHistory" ADD CONSTRAINT "SiteFieldHistory_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteFieldHistory" ADD CONSTRAINT "SiteFieldHistory_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "SiteField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
