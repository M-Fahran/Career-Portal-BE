-- CreateEnum
CREATE TYPE "NoticePeriod" AS ENUM ('IMMEDIATE', 'ONE_WEEK', 'TWO_WEEKS', 'ONE_MONTH', 'TWO_MONTHS', 'THREE_MONTHS');

-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "noticePeriod" "NoticePeriod",
ADD COLUMN     "onboardedAt" TIMESTAMP(3),
ALTER COLUMN "fullName" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL;
