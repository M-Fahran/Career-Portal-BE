ALTER TABLE "JobPosting"
ADD COLUMN "requiredSkills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "JobPosting" AS job
SET "requiredSkills" = COALESCE(
  (
    SELECT ARRAY_AGG(skill."name" ORDER BY skill."name")
    FROM "JobPostingSkill" AS job_skill
    JOIN "Skill" AS skill ON skill."id" = job_skill."skillId"
    WHERE job_skill."jobPostingId" = job."id"
  ),
  ARRAY[]::TEXT[]
);

ALTER TABLE "JobPostingSkill"
DROP CONSTRAINT "JobPostingSkill_jobPostingId_fkey",
DROP CONSTRAINT "JobPostingSkill_skillId_fkey";

DROP TABLE "JobPostingSkill";
DROP TABLE "Skill";
