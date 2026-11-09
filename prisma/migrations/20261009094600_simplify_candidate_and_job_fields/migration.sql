ALTER TABLE "Candidate"
ADD COLUMN "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "skills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "Candidate" AS candidate
SET
  "skills" = COALESCE(
    (
      SELECT ARRAY_AGG(DISTINCT skill."name" ORDER BY skill."name")
      FROM "CandidateSkill" AS candidate_skill
      JOIN "Skill" AS skill ON skill."id" = candidate_skill."skillId"
      WHERE candidate_skill."candidateId" = candidate."id"
    ),
    ARRAY[]::TEXT[]
  ),
  "languages" = COALESCE(
    (
      SELECT ARRAY_AGG(candidate_language."name" ORDER BY candidate_language."name")
      FROM "CandidateLanguage" AS candidate_language
      WHERE candidate_language."candidateId" = candidate."id"
    ),
    ARRAY[]::TEXT[]
  );

ALTER TABLE "JobPosting"
DROP COLUMN "benefits",
DROP COLUMN "salaryMax",
DROP COLUMN "salaryMin";

ALTER TABLE "CandidateLanguage"
DROP CONSTRAINT "CandidateLanguage_candidateId_fkey";

ALTER TABLE "CandidateSkill"
DROP CONSTRAINT "CandidateSkill_candidateId_fkey",
DROP CONSTRAINT "CandidateSkill_skillId_fkey";

ALTER TABLE "CandidateTraining"
DROP CONSTRAINT "CandidateTraining_candidateId_fkey";

DROP TABLE "CandidateLanguage";
DROP TABLE "CandidateSkill";
DROP TABLE "CandidateTraining";
