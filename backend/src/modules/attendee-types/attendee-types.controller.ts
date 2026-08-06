import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { successResponse } from "../../utils/api-response";
import { asyncHandler } from "../../utils/async-handler";
import { touchOrganizationActivity } from "../organizations/organizations.activity";
import { createAttendeeTypeSchema } from "./attendee-types.schemas";

export const DEFAULT_ATTENDEE_TYPES = ["ผู้บริหาร", "วิทยากร", "ผู้ชนะรางวัล", "คณะกรรมการ"];

export async function ensureDefaultAttendeeTypes(organizationId: string) {
  const existingCount = await prisma.attendeeType.count({ where: { organizationId } });

  if (existingCount > 0) {
    return;
  }

  await prisma.attendeeType.createMany({
    data: DEFAULT_ATTENDEE_TYPES.map((label) => ({ organizationId, label })),
    skipDuplicates: true,
  });
}

export const listAttendeeTypes = asyncHandler(async (request, response) => {
  const organizationId = request.auth!.organizationId as string;

  await ensureDefaultAttendeeTypes(organizationId);

  const attendeeTypes = await prisma.attendeeType.findMany({
    where: { organizationId },
    orderBy: { label: "asc" },
  });

  response.json(successResponse(attendeeTypes));
});

export const createAttendeeType = asyncHandler(async (request, response) => {
  const organizationId = request.auth!.organizationId as string;
  const { label } = createAttendeeTypeSchema.parse(request.body);

  const existing = await prisma.attendeeType.findFirst({
    where: {
      organizationId,
      label: {
        equals: label,
        mode: "insensitive",
      },
    },
  });

  if (existing) {
    response.status(200).json(successResponse(existing));
    return;
  }

  const attendeeType = await prisma.attendeeType.create({
    data: { organizationId, label },
  });

  await touchOrganizationActivity(organizationId);

  response.status(201).json(successResponse(attendeeType, "Attendee type created"));
});

export const deleteAttendeeType = asyncHandler(async (request, response) => {
  const organizationId = request.auth!.organizationId as string;
  const attendeeTypeId = request.params.id as string;

  const existing = await prisma.attendeeType.findFirst({
    where: { id: attendeeTypeId, organizationId },
  });

  if (!existing) {
    throw new ApiError(404, "Attendee type not found");
  }

  await prisma.attendeeType.delete({ where: { id: existing.id } });

  await touchOrganizationActivity(organizationId);

  response.json(successResponse(null, "Attendee type deleted"));
});
