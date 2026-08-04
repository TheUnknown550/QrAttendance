-- AlterTable
ALTER TABLE "attendance_records" ADD COLUMN     "check_in_photo_url" TEXT;

-- AlterTable
ALTER TABLE "event_series" ADD COLUMN     "require_check_in_photo" BOOLEAN NOT NULL DEFAULT false;
