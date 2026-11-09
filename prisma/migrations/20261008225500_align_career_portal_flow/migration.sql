-- AlterEnum
BEGIN;
CREATE TYPE "ApplicationStatus_new" AS ENUM ('PROCESS', 'SCREENING', 'ACCEPTED', 'REJECTED');
ALTER TABLE "public"."Application" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Application" ALTER COLUMN "status" TYPE "ApplicationStatus_new" USING ("status"::text::"ApplicationStatus_new");
ALTER TABLE "ApplicationStatusHistory" ALTER COLUMN "oldStatus" TYPE "ApplicationStatus_new" USING ("oldStatus"::text::"ApplicationStatus_new");
ALTER TABLE "ApplicationStatusHistory" ALTER COLUMN "newStatus" TYPE "ApplicationStatus_new" USING ("newStatus"::text::"ApplicationStatus_new");
ALTER TYPE "ApplicationStatus" RENAME TO "ApplicationStatus_old";
ALTER TYPE "ApplicationStatus_new" RENAME TO "ApplicationStatus";
DROP TYPE "public"."ApplicationStatus_old";
ALTER TABLE "Application" ALTER COLUMN "status" SET DEFAULT 'PROCESS';
COMMIT;

-- DropForeignKey
ALTER TABLE "CandidateResume" DROP CONSTRAINT "CandidateResume_candidateId_fkey";

-- DropForeignKey
ALTER TABLE "InterviewSchedule" DROP CONSTRAINT "InterviewSchedule_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "InterviewSchedule" DROP CONSTRAINT "InterviewSchedule_interviewerId_fkey";

-- DropForeignKey
ALTER TABLE "JobPosting" DROP CONSTRAINT "JobPosting_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "JobPosting" DROP CONSTRAINT "JobPosting_departmentId_fkey";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "coverLetter",
ALTER COLUMN "status" SET DEFAULT 'PROCESS';

-- AlterTable
ALTER TABLE "JobPosting" ALTER COLUMN "location" DROP NOT NULL,
ALTER COLUMN "workMode" DROP NOT NULL,
ALTER COLUMN "deadline" SET NOT NULL,
ALTER COLUMN "departmentId" DROP NOT NULL,
ALTER COLUMN "categoryId" DROP NOT NULL,
ALTER COLUMN "qualifications" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "recipientType",
ADD COLUMN     "applicationId" TEXT NOT NULL;

-- DropTable
DROP TABLE "InterviewSchedule";

-- DropEnum
DROP TYPE "InterviewStatus";

-- DropEnum
DROP TYPE "RecipientType";

-- CreateTable
CREATE TABLE "CandidateTraining" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "description" TEXT,
    "fileUrl" TEXT,
    "candidateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateTraining_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateSkill" (
    "candidateId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    CONSTRAINT "CandidateSkill_pkey" PRIMARY KEY ("candidateId","skillId")
);

-- CreateTable
CREATE TABLE "JobPostingSkill" (
    "jobPostingId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    CONSTRAINT "JobPostingSkill_pkey" PRIMARY KEY ("jobPostingId","skillId")
);

-- CreateTable
CREATE TABLE "CandidateLanguage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "proficiency" TEXT,
    "candidateId" TEXT NOT NULL,

    CONSTRAINT "CandidateLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateSavedJob" (
    "candidateId" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateSavedJob_pkey" PRIMARY KEY ("candidateId","jobPostingId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE INDEX "CandidateSkill_skillId_idx" ON "CandidateSkill"("skillId");

-- CreateIndex
CREATE INDEX "JobPostingSkill_skillId_idx" ON "JobPostingSkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateLanguage_candidateId_name_key" ON "CandidateLanguage"("candidateId", "name");

-- CreateIndex
CREATE INDEX "CandidateSavedJob_jobPostingId_idx" ON "CandidateSavedJob"("jobPostingId");

-- CreateIndex
CREATE INDEX "Application_jobPostingId_status_idx" ON "Application"("jobPostingId", "status");

-- CreateIndex
CREATE INDEX "Notification_recipientId_isRead_sentAt_idx" ON "Notification"("recipientId", "isRead", "sentAt");

-- CreateIndex
CREATE INDEX "Notification_sentAt_idx" ON "Notification"("sentAt");

-- AddForeignKey
ALTER TABLE "CandidateResume" ADD CONSTRAINT "CandidateResume_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "JobCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateTraining" ADD CONSTRAINT "CandidateTraining_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateSkill" ADD CONSTRAINT "CandidateSkill_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateSkill" ADD CONSTRAINT "CandidateSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPostingSkill" ADD CONSTRAINT "JobPostingSkill_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPostingSkill" ADD CONSTRAINT "JobPostingSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateLanguage" ADD CONSTRAINT "CandidateLanguage_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateSavedJob" ADD CONSTRAINT "CandidateSavedJob_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateSavedJob" ADD CONSTRAINT "CandidateSavedJob_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
