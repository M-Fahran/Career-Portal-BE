ALTER TABLE "JobPosting"
DROP COLUMN "educationRequirements";

ALTER TABLE "JobPosting"
ALTER COLUMN "qualifications" DROP DEFAULT,
ALTER COLUMN "qualifications" TYPE "EducationLevel"[]
USING ARRAY[]::"EducationLevel"[],
ALTER COLUMN "qualifications" SET DEFAULT ARRAY[]::"EducationLevel"[],
ALTER COLUMN "qualifications" SET NOT NULL;
