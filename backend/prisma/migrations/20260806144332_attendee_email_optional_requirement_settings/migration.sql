-- AlterTable
ALTER TABLE "attendees" ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "require_attendee_email" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "require_attendee_number" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "require_attendee_phone" BOOLEAN NOT NULL DEFAULT false;
