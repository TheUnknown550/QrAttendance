-- CreateTable
CREATE TABLE "attendee_types" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendee_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendee_types_organizationId_idx" ON "attendee_types"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "attendee_types_organizationId_label_key" ON "attendee_types"("organizationId", "label");

-- AddForeignKey
ALTER TABLE "attendee_types" ADD CONSTRAINT "attendee_types_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
