-- CreateEnum
CREATE TYPE "FormStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "FormItemType" AS ENUM ('TITLE_TEXT', 'IMAGE', 'DIVIDER', 'SECTION', 'SHORT_TEXT', 'PARAGRAPH', 'MULTIPLE_CHOICE', 'DROPDOWN', 'CHECKBOXES', 'NUMBER', 'DATE', 'EMAIL', 'PHONE');

-- CreateEnum
CREATE TYPE "AttendeeSystemField" AS ENUM ('FIRST_NAME', 'SURNAME', 'EMAIL', 'PHONE', 'ORGANIZATION_NAME', 'ATTENDEE_TYPE', 'ATTENDEE_NUMBER');

-- CreateTable
CREATE TABLE "forms" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "eventSeriesId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "FormStatus" NOT NULL DEFAULT 'DRAFT',
    "public_token" TEXT NOT NULL,
    "theme" JSONB,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_items" (
    "id" UUID NOT NULL,
    "formId" UUID NOT NULL,
    "type" "FormItemType" NOT NULL,
    "system_field" "AttendeeSystemField",
    "position" INTEGER NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "image_url" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "archived_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_item_options" (
    "id" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "image_url" TEXT,
    "position" INTEGER NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "form_item_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_responses" (
    "id" UUID NOT NULL,
    "formId" UUID NOT NULL,
    "attendeeId" UUID,
    "matched_existing_attendee" BOOLEAN NOT NULL DEFAULT false,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "form_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_answers" (
    "id" UUID NOT NULL,
    "responseId" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "text_value" TEXT,
    "number_value" DECIMAL(65,30),
    "date_value" TIMESTAMP(3),
    "option_ids" UUID[] DEFAULT ARRAY[]::UUID[],

    CONSTRAINT "form_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "forms_public_token_key" ON "forms"("public_token");

-- CreateIndex
CREATE INDEX "forms_organizationId_idx" ON "forms"("organizationId");

-- CreateIndex
CREATE INDEX "form_items_formId_position_idx" ON "form_items"("formId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "form_items_formId_system_field_key" ON "form_items"("formId", "system_field");

-- CreateIndex
CREATE INDEX "form_item_options_itemId_position_idx" ON "form_item_options"("itemId", "position");

-- CreateIndex
CREATE INDEX "form_responses_formId_submitted_at_idx" ON "form_responses"("formId", "submitted_at");

-- CreateIndex
CREATE INDEX "form_responses_attendeeId_idx" ON "form_responses"("attendeeId");

-- CreateIndex
CREATE INDEX "form_answers_itemId_idx" ON "form_answers"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "form_answers_responseId_itemId_key" ON "form_answers"("responseId", "itemId");

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_eventSeriesId_fkey" FOREIGN KEY ("eventSeriesId") REFERENCES "event_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_items" ADD CONSTRAINT "form_items_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_item_options" ADD CONSTRAINT "form_item_options_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "form_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "attendees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_answers" ADD CONSTRAINT "form_answers_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "form_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_answers" ADD CONSTRAINT "form_answers_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "form_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
