CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'INACTIVE');

ALTER TABLE "organizations"
ADD COLUMN "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "inactiveSinceAt" TIMESTAMP(3),
ADD COLUMN "scheduledDeletionAt" TIMESTAMP(3);

UPDATE "organizations"
SET "lastActivityAt" = COALESCE("updatedAt", "createdAt");
