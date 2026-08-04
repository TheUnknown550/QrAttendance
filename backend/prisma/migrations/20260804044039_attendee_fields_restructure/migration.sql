/*
  Warnings:

  - You are about to drop the column `name` on the `attendees` table. All the data in the column will be lost.
  - Added the required column `attendee_type` to the `attendees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `attendees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organization_name` to the `attendees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `surname` to the `attendees` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "attendees" DROP COLUMN "name",
ADD COLUMN     "attendee_type" TEXT NOT NULL,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "organization_name" TEXT NOT NULL,
ADD COLUMN     "surname" TEXT NOT NULL;
