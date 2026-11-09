/*
  Warnings:

  - You are about to drop the `CandidateDocument` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CandidateDocument" DROP CONSTRAINT "CandidateDocument_candidateId_fkey";

-- AlterTable
ALTER TABLE "Candidate" ALTER COLUMN "graduationYear" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "CandidateDocument";

-- DropEnum
DROP TYPE "DocumentType";
