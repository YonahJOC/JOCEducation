-- CreateEnum
CREATE TYPE "GrantKind" AS ENUM ('SCHOLARSHIP', 'PILOT', 'COMP');

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "grantKind" "GrantKind",
ADD COLUMN     "grantReviewOn" TIMESTAMP(3),
ADD COLUMN     "grantedAt" TIMESTAMP(3),
ADD COLUMN     "grantedById" TEXT;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
