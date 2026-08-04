import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { successResponse } from "../../utils/api-response";
import { asyncHandler } from "../../utils/async-handler";
import { generateQrToken } from "../../utils/qr-token";
import { createAttendeeSchema, updateAttendeeSchema } from "./attendees.schemas";
import { removeStoredAttendeeImage, saveAttendeeImage } from "./attendees.upload";
import { touchOrganizationActivity } from "../organizations/organizations.activity";

function getRequestBody(request: { body?: Record<string, unknown> }) {
  const body = request.body ?? {};

  return {
    name: typeof body.name === "string" ? body.name : undefined,
    email: typeof body.email === "string" ? body.email : undefined,
    phone: typeof body.phone === "string" ? body.phone : undefined,
    attendeeNumber:
      typeof body.attendeeNumber === "string" || typeof body.attendeeNumber === "number"
        ? body.attendeeNumber
        : undefined,
    removeProfileImage:
      typeof body.removeProfileImage === "string"
        ? body.removeProfileImage === "true"
        : Boolean(body.removeProfileImage),
  };
}

export const listAttendees = asyncHandler(async (request, response) => {
  const organizationId = request.auth!.organizationId as string;
  const page = Math.max(Number(request.query.page ?? 1) || 1, 1);
  const requestedPageSize = Number(request.query.pageSize ?? env.DEFAULT_PAGE_SIZE) || env.DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(Math.max(requestedPageSize, 1), env.MAX_PAGE_SIZE);
  const search = typeof request.query.search === "string" ? request.query.search.trim() : "";
  const where = {
    organizationId,
    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              phone: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const [attendees, total] = await prisma.$transaction([
    prisma.attendee.findMany({
      where,
      orderBy: [
        {
          attendeeNumber: {
            sort: "asc",
            nulls: "last",
          },
        },
        {
          createdAt: "desc",
        },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.attendee.count({
      where,
    }),
  ]);

  response.json(
    successResponse({
      items: attendees,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
      },
    }),
  );
});

export const createAttendee = asyncHandler(async (request, response) => {
  const body = createAttendeeSchema.parse(getRequestBody(request));
  const organizationId = request.auth!.organizationId as string;
  const organization = await prisma.organization.findUnique({
    where: {
      id: organizationId,
    },
    select: {
      name: true,
    },
  });

  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  const image = await saveAttendeeImage({
    attendeeName: body.name,
    organizationName: organization.name,
    file: request.file,
  });

  const attendee = await prisma.attendee.create({
    data: {
      ...body,
      organizationId,
      qrToken: generateQrToken(),
      profileImageUrl: image?.publicUrl,
    },
  });

  await touchOrganizationActivity(organizationId);

  response.status(201).json(successResponse(attendee, "Attendee created"));
});

export const getAttendee = asyncHandler(async (request, response) => {
  const attendeeId = request.params.id as string;
  const organizationId = request.auth!.organizationId as string;

  const attendee = await prisma.attendee.findFirst({
    where: {
      id: attendeeId,
      organizationId,
    },
    include: {
      attendance: {
        include: {
          eventSession: {
            include: {
              eventSeries: true,
            },
          },
        },
        orderBy: {
          checkedInAt: "desc",
        },
      },
    },
  });

  if (!attendee) {
    throw new ApiError(404, "Attendee not found");
  }

  response.json(successResponse(attendee));
});

export const updateAttendee = asyncHandler(async (request, response) => {
  const attendeeId = request.params.id as string;
  const { removeProfileImage, ...body } = updateAttendeeSchema.parse(getRequestBody(request));
  const organizationId = request.auth!.organizationId as string;

  const existing = await prisma.attendee.findFirst({
    where: {
      id: attendeeId,
      organizationId,
    },
  });

  if (!existing) {
    throw new ApiError(404, "Attendee not found");
  }

  const organization = await prisma.organization.findUnique({
    where: {
      id: organizationId,
    },
    select: {
      name: true,
    },
  });

  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  const image = await saveAttendeeImage({
    attendeeName: body.name ?? existing.name,
    organizationName: organization.name,
    file: request.file,
  });
  const shouldRemoveProfileImage = removeProfileImage && !image?.publicUrl;

  if (image?.publicUrl) {
    await removeStoredAttendeeImage(existing.profileImageUrl);
  }

  if (shouldRemoveProfileImage) {
    await removeStoredAttendeeImage(existing.profileImageUrl);
  }

  const attendee = await prisma.attendee.update({
    where: {
      id: existing.id,
    },
    data: {
      ...body,
      profileImageUrl: image?.publicUrl ? image.publicUrl : shouldRemoveProfileImage ? null : existing.profileImageUrl,
    },
  });

  await touchOrganizationActivity(organizationId);

  response.json(successResponse(attendee, "Attendee updated"));
});

export const deleteAttendee = asyncHandler(async (request, response) => {
  const attendeeId = request.params.id as string;
  const organizationId = request.auth!.organizationId as string;

  const existing = await prisma.attendee.findFirst({
    where: {
      id: attendeeId,
      organizationId,
    },
  });

  if (!existing) {
    throw new ApiError(404, "Attendee not found");
  }

  await prisma.$transaction([
    prisma.attendanceRecord.deleteMany({
      where: {
        attendeeId: existing.id,
      },
    }),
    prisma.attendee.delete({
      where: {
        id: existing.id,
      },
    }),
  ]);

  await removeStoredAttendeeImage(existing.profileImageUrl);

  await touchOrganizationActivity(organizationId);

  response.json(successResponse(null, "Attendee deleted"));
});
