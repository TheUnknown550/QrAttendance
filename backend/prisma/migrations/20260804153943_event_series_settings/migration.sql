-- AlterTable
ALTER TABLE "event_series" ADD COLUMN     "require_check_in_approval" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "show_attendee_number" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "show_attendee_type" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "show_email" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "show_organization_name" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "show_phone" BOOLEAN NOT NULL DEFAULT true;
