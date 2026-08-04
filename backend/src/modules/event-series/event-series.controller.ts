import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { successResponse } from "../../utils/api-response";
import { asyncHandler } from "../../utils/async-handler";
import { touchOrganizationActivity } from "../organizations/organizations.activity";
import {
  createEventSeriesSchema,
  createEventSessionSchema,
  manageSessionAttendanceSchema,
  updateEventSeriesSchema,
  updateEventSessionSchema,
} from "./event-series.schemas";

async function requireScopedSeries(eventSeriesId: string, organizationId: string) {
  const eventSeries = await prisma.eventSeries.findFirst({
    where: {
      id: eventSeriesId,
      organizationId,
    },
  });

  if (!eventSeries) {
    throw new ApiError(404, "Event series not found");
  }

  return eventSeries;
}

async function requireScopedSession(eventSeriesId: string, sessionId: string, organizationId: string) {
  const session = await prisma.eventSession.findFirst({
    where: {
      id: sessionId,
      eventSeriesId,
      eventSeries: {
        organizationId,
      },
    },
  });

  if (!session) {
    throw new ApiError(404, "Session not found");
  }

  return session;
}

async function requireScopedAttendee(attendeeId: string, organizationId: string) {
  const attendee = await prisma.attendee.findFirst({
    where: {
      id: attendeeId,
      organizationId,
    },
  });

  if (!attendee) {
    throw new ApiError(404, "Attendee not found");
  }

  return attendee;
}

export const listEventSeries = asyncHandler(async (request, response) => {
  const organizationId = request.auth!.organizationId as string;

  const eventSeries = await prisma.eventSeries.findMany({
    where: {
      organizationId,
    },
    include: {
      sessions: {
        orderBy: {
          sessionDate: "asc",
        },
      },
      _count: {
        select: {
          sessions: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  response.json(successResponse(eventSeries));
});

export const createEventSeries = asyncHandler(async (request, response) => {
  const body = createEventSeriesSchema.parse(request.body);
  const organizationId = request.auth!.organizationId as string;

  const eventSeries = await prisma.eventSeries.create({
    data: {
      name: body.name,
      description: body.description,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      organizationId,
    },
  });

  await touchOrganizationActivity(organizationId);

  response.status(201).json(successResponse(eventSeries, "Event series created"));
});

export const getEventSeries = asyncHandler(async (request, response) => {
  const eventSeriesId = request.params.id as string;
  const organizationId = request.auth!.organizationId as string;

  const eventSeries = await prisma.eventSeries.findFirst({
    where: {
      id: eventSeriesId,
      organizationId,
    },
    include: {
      sessions: {
        orderBy: {
          sessionDate: "asc",
        },
        include: {
          _count: {
            select: {
              attendance: true,
            },
          },
        },
      },
    },
  });

  if (!eventSeries) {
    throw new ApiError(404, "Event series not found");
  }

  response.json(successResponse(eventSeries));
});

export const createEventSession = asyncHandler(async (request, response) => {
  const eventSeriesId = request.params.id as string;
  const body = createEventSessionSchema.parse(request.body);
  const organizationId = request.auth!.organizationId as string;

  const eventSeries = await requireScopedSeries(eventSeriesId, organizationId);

  const session = await prisma.eventSession.create({
    data: {
      eventSeriesId: eventSeries.id,
      title: body.title,
      description: body.description,
      sessionDate: new Date(body.sessionDate),
    },
  });

  await touchOrganizationActivity(organizationId);

  response.status(201).json(successResponse(session, "Session created"));
});

export const getEventSession = asyncHandler(async (request, response) => {
  const eventSeriesId = request.params.id as string;
  const sessionId = request.params.sessionId as string;
  const organizationId = request.auth!.organizationId as string;

  const [session, attendees] = await Promise.all([
    prisma.eventSession.findFirst({
      where: {
        id: sessionId,
        eventSeriesId,
        eventSeries: {
          organizationId,
        },
      },
      include: {
        eventSeries: {
          select: {
            id: true,
            name: true,
          },
        },
        attendance: {
          include: {
            attendee: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                attendeeNumber: true,
                profileImageUrl: true,
                qrToken: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
          orderBy: {
            checkedInAt: "desc",
          },
        },
        _count: {
          select: {
            attendance: true,
          },
        },
      },
    }),
    prisma.attendee.findMany({
      where: {
        organizationId,
      },
      orderBy: [
        {
          attendeeNumber: {
            sort: "asc",
            nulls: "last",
          },
        },
        {
          name: "asc",
        },
      ],
    }),
  ]);

  if (!session) {
    throw new ApiError(404, "Session not found");
  }

  response.json(
    successResponse({
      ...session,
      allAttendees: attendees,
    }),
  );
});

export const updateEventSeries = asyncHandler(async (request, response) => {
  const eventSeriesId = request.params.id as string;
  const organizationId = request.auth!.organizationId as string;
  const body = updateEventSeriesSchema.parse(request.body);

  await requireScopedSeries(eventSeriesId, organizationId);

  const eventSeries = await prisma.eventSeries.update({
    where: {
      id: eventSeriesId,
    },
    data: {
      name: body.name,
      description: body.description,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
    },
  });

  await touchOrganizationActivity(organizationId);

  response.json(successResponse(eventSeries, "Event series updated"));
});

export const deleteEventSeries = asyncHandler(async (request, response) => {
  const eventSeriesId = request.params.id as string;
  const organizationId = request.auth!.organizationId as string;

  await requireScopedSeries(eventSeriesId, organizationId);

  await prisma.$transaction([
    prisma.attendanceRecord.deleteMany({
      where: {
        eventSession: {
          eventSeriesId,
        },
      },
    }),
    prisma.eventSession.deleteMany({
      where: {
        eventSeriesId,
      },
    }),
    prisma.eventSeries.delete({
      where: {
        id: eventSeriesId,
      },
    }),
  ]);

  await touchOrganizationActivity(organizationId);

  response.json(successResponse(null, "Event series deleted"));
});

export const updateEventSession = asyncHandler(async (request, response) => {
  const eventSeriesId = request.params.id as string;
  const sessionId = request.params.sessionId as string;
  const organizationId = request.auth!.organizationId as string;
  const body = updateEventSessionSchema.parse(request.body);

  await requireScopedSession(eventSeriesId, sessionId, organizationId);

  const session = await prisma.eventSession.update({
    where: {
      id: sessionId,
    },
    data: {
      title: body.title,
      description: body.description,
      sessionDate: new Date(body.sessionDate),
    },
  });

  await touchOrganizationActivity(organizationId);

  response.json(successResponse(session, "Session updated"));
});

export const deleteEventSession = asyncHandler(async (request, response) => {
  const eventSeriesId = request.params.id as string;
  const sessionId = request.params.sessionId as string;
  const organizationId = request.auth!.organizationId as string;

  await requireScopedSession(eventSeriesId, sessionId, organizationId);

  await prisma.$transaction([
    prisma.attendanceRecord.deleteMany({
      where: {
        eventSessionId: sessionId,
      },
    }),
    prisma.eventSession.delete({
      where: {
        id: sessionId,
      },
    }),
  ]);

  await touchOrganizationActivity(organizationId);

  response.json(successResponse(null, "Session deleted"));
});

export const addSessionAttendance = asyncHandler(async (request, response) => {
  const eventSeriesId = request.params.id as string;
  const sessionId = request.params.sessionId as string;
  const organizationId = request.auth!.organizationId as string;
  const body = manageSessionAttendanceSchema.parse(request.body);

  const [session, attendee] = await Promise.all([
    requireScopedSession(eventSeriesId, sessionId, organizationId),
    requireScopedAttendee(body.attendeeId, organizationId),
  ]);

  const existingRecord = await prisma.attendanceRecord.findUnique({
    where: {
      attendeeId_eventSessionId: {
        attendeeId: attendee.id,
        eventSessionId: session.id,
      },
    },
  });

  if (existingRecord) {
    response.json(successResponse(existingRecord, "Attendee already marked attended"));
    return;
  }

  const record = await prisma.attendanceRecord.create({
    data: {
      attendeeId: attendee.id,
      eventSessionId: session.id,
    },
  });

  await touchOrganizationActivity(organizationId);

  response.status(201).json(successResponse(record, "Attendance recorded"));
});

export const removeSessionAttendance = asyncHandler(async (request, response) => {
  const eventSeriesId = request.params.id as string;
  const sessionId = request.params.sessionId as string;
  const attendeeId = request.params.attendeeId as string;
  const organizationId = request.auth!.organizationId as string;

  const [session, attendee] = await Promise.all([
    requireScopedSession(eventSeriesId, sessionId, organizationId),
    requireScopedAttendee(attendeeId, organizationId),
  ]);

  const existingRecord = await prisma.attendanceRecord.findUnique({
    where: {
      attendeeId_eventSessionId: {
        attendeeId: attendee.id,
        eventSessionId: session.id,
      },
    },
  });

  if (!existingRecord) {
    throw new ApiError(404, "Attendance record not found");
  }

  await prisma.attendanceRecord.delete({
    where: {
      attendeeId_eventSessionId: {
        attendeeId: attendee.id,
        eventSessionId: session.id,
      },
    },
  });

  await touchOrganizationActivity(organizationId);

  response.json(successResponse(null, "Attendance removed"));
});
