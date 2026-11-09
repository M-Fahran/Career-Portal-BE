-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'PREFER_NOT_TO_SAY');

-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "city" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "graduationYear" INTEGER,
ADD COLUMN     "institution" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "major" TEXT,
ADD COLUMN     "portfolioUrl" TEXT,
ADD COLUMN     "province" TEXT;
