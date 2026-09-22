-- Forms the JOC team builds in the console. Fields are rows, not code.
DO $$ BEGIN
  CREATE TYPE "FormFieldType" AS ENUM
    ('SHORT_TEXT','LONG_TEXT','EMAIL','PHONE','NUMBER','DATE','CHOICE','CHECKBOXES','YES_NO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "Form" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "thankYou" TEXT NOT NULL DEFAULT 'Thank you — we have your answers.',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "requiresSignIn" BOOLEAN NOT NULL DEFAULT false,
    "feeCents" INTEGER,
    "feeLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Form_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Form_slug_key" ON "Form"("slug");
CREATE INDEX IF NOT EXISTS "Form_published_idx" ON "Form"("published");

CREATE TABLE IF NOT EXISTS "FormField" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "help" TEXT,
    "type" "FormFieldType" NOT NULL DEFAULT 'SHORT_TEXT',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "FormField_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FormField_formId_order_idx" ON "FormField"("formId", "order");

CREATE TABLE IF NOT EXISTS "FormResponse" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT,
    "email" TEXT,
    "answers" JSONB NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paymentRef" TEXT,
    "amountCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FormResponse_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FormResponse_formId_createdAt_idx" ON "FormResponse"("formId", "createdAt");
CREATE INDEX IF NOT EXISTS "FormResponse_userId_idx" ON "FormResponse"("userId");

ALTER TABLE "FormField" DROP CONSTRAINT IF EXISTS "FormField_formId_fkey";
ALTER TABLE "FormField" ADD CONSTRAINT "FormField_formId_fkey"
  FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FormResponse" DROP CONSTRAINT IF EXISTS "FormResponse_formId_fkey";
ALTER TABLE "FormResponse" ADD CONSTRAINT "FormResponse_formId_fkey"
  FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FormResponse" DROP CONSTRAINT IF EXISTS "FormResponse_userId_fkey";
ALTER TABLE "FormResponse" ADD CONSTRAINT "FormResponse_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
