UPDATE "JobPosting"
SET "status" = 'CLOSED'
WHERE "status"::text = 'DRAFT';

ALTER TABLE "JobPosting"
ALTER COLUMN "status" DROP DEFAULT;

CREATE TYPE "JobStatus_new" AS ENUM ('PUBLISHED', 'CLOSED');

ALTER TABLE "JobPosting"
ALTER COLUMN "status" TYPE "JobStatus_new"
USING ("status"::text::"JobStatus_new");

DROP TYPE "JobStatus";

ALTER TYPE "JobStatus_new" RENAME TO "JobStatus";

ALTER TABLE "JobPosting"
ALTER COLUMN "status" SET DEFAULT 'PUBLISHED';
