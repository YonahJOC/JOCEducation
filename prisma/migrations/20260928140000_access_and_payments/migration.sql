-- Schools on their programs before the full site, and one record of money.
--
-- fullSiteLaunchedAt is null for every school, which is the rollout: they are
-- on the programs they run and nothing else until somebody opens the site to
-- them. Everything else about access is derived from enrolments, so this is
-- the only switch anybody has to remember.
--
-- Payment is the table nothing before it had. A subscription is per school
-- with no program on it, an order is shop products, and a program fee was a
-- boolean with no amount and no date — so "what did the Kindness Booth bring
-- in" had no answer at all.

ALTER TABLE "School"      ADD COLUMN "fullSiteLaunchedAt" TIMESTAMP(3);
ALTER TABLE "ProgramPage" ADD COLUMN "portalHref" TEXT;

CREATE TYPE "InquiryStatus" AS ENUM ('OPEN', 'ANSWERED', 'CLOSED');
CREATE TYPE "PaymentKind"   AS ENUM ('PROGRAM_FEE', 'PLAN', 'SHOP', 'REFUND', 'GRANT');

CREATE TABLE "Inquiry" (
  "id"           TEXT            NOT NULL,
  "schoolId"     TEXT            NOT NULL,
  "kind"         TEXT            NOT NULL,
  "programId"    INTEGER,
  "askedById"    TEXT,
  "status"       "InquiryStatus" NOT NULL DEFAULT 'OPEN',
  "response"     TEXT,
  "answeredById" TEXT,
  "answeredAt"   TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3)    NOT NULL,

  CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- One open ask per school per thing, so pressing it twice does not file twice.
CREATE UNIQUE INDEX "Inquiry_schoolId_kind_status_key" ON "Inquiry"("schoolId", "kind", "status");
CREATE INDEX "Inquiry_schoolId_idx" ON "Inquiry"("schoolId");
CREATE INDEX "Inquiry_status_idx"   ON "Inquiry"("status");

ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_programId_fkey"
  FOREIGN KEY ("programId") REFERENCES "ProgramPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_askedById_fkey"
  FOREIGN KEY ("askedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_answeredById_fkey"
  FOREIGN KEY ("answeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Payment" (
  "id"                    TEXT          NOT NULL,
  "schoolId"              TEXT          NOT NULL,
  "programId"             INTEGER,
  "subscriptionId"        TEXT,
  "kind"                  "PaymentKind" NOT NULL,
  "amountCents"           INTEGER       NOT NULL,
  "currency"              TEXT          NOT NULL DEFAULT 'usd',
  "paidAt"                TIMESTAMP(3)  NOT NULL,
  "schoolYear"            TEXT          NOT NULL,
  "refundOfId"            TEXT,
  "grantKind"             "GrantKind",
  "reason"                TEXT,
  "decidedById"           TEXT,
  "stripePaymentIntentId" TEXT,
  "stripeInvoiceId"       TEXT,
  "stripeChargeId"        TEXT,
  "formResponseId"        TEXT,
  "orderId"               TEXT,
  "recordedById"          TEXT,
  "createdAt"             TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- The Stripe ids are what the webhook deduplicates on.
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");
CREATE UNIQUE INDEX "Payment_stripeInvoiceId_key"       ON "Payment"("stripeInvoiceId");
CREATE UNIQUE INDEX "Payment_stripeChargeId_key"        ON "Payment"("stripeChargeId");
CREATE INDEX "Payment_schoolId_idx"   ON "Payment"("schoolId");
CREATE INDEX "Payment_programId_idx"  ON "Payment"("programId");
CREATE INDEX "Payment_schoolYear_idx" ON "Payment"("schoolYear");
CREATE INDEX "Payment_kind_idx"       ON "Payment"("kind");

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_programId_fkey"
  FOREIGN KEY ("programId") REFERENCES "ProgramPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_decidedById_fkey"
  FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_recordedById_fkey"
  FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
