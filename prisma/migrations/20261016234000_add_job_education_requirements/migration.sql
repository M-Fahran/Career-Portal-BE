ALTER TABLE "JobPosting"
ADD COLUMN "educationRequirements" "EducationLevel"[] NOT NULL DEFAULT ARRAY[]::"EducationLevel"[];
