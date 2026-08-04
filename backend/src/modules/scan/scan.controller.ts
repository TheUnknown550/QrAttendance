import { randomBytes } from "node:crypto";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { successResponse } from "../../utils/api-response";
import { asyncHandler } from "../../utils/async-handler";
import { touchOrganizationActivity } from "../organizations/organizations.activity";
import { checkInSchema, publicCheckInSchema } from "./scan.schemas";

async function generateUniquePublicScanToken() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = randomBytes(24).toString("hex");
    const existing = await prisma.eventSession.findUnique({
      where: {
        publicScanToken: token,
      },
    });

    if (!existing) {
      return token;
    }
  }

  throw new ApiError(500, "Failed to generate scanner share token");
}

async function ensurePublicScanToken(sessionId: string) {
  const existingSession = await prisma.eventSession.findUnique({
    where: {
      id: sessionId,
    },
    select: {
      publicScanToken: true,
    },
  });

  if (!existingSession) {
    throw new ApiError(404, "Event session not found");
  }

  if (existingSession.publicScanToken) {
    return existingSession.publicScanToken;
  }

  const token = await generateUniquePublicScanToken();
  const updatedSession = await prisma.eventSession.update({
    where: {
      id: sessionId,
    },
    data: {
      publicScanToken: token,
    },
    select: {
      publicScanToken: true,
    },
  });

  return updatedSession.publicScanToken!;
}

async function performCheckIn(eventSessionId: string, organizationId: string, qrToken: string) {
  const [session, attendee] = await Promise.all([
    prisma.eventSession.findFirst({
      where: {
        id: eventSessionId,
        eventSeries: {
          organizationId,
        },
      },
    }),
    prisma.attendee.findFirst({
      where: {
        qrToken,
      },
    }),
  ]);

  if (!session) {
    return {
      statusCode: 200,
      body: successResponse(
        {
          status: "wrong_event_session",
        },
        "Event session not found",
      ),
    };
  }

  if (!attendee) {
    return {
      statusCode: 200,
      body: successResponse(
        {
          status: "invalid_qr",
        },
        "Invalid QR",
      ),
    };
  }

  if (attendee.organizationId !== organizationId) {
    return {
      statusCode: 200,
      body: successResponse(
        {
          status: "wrong_event_session",
        },
        "Attendee does not belong to this event organization",
      ),
    };
  }

  const existingRecord = await prisma.attendanceRecord.findUnique({
    where: {
      attendeeId_eventSessionId: {
        attendeeId: attendee.id,
        eventSessionId: session.id,
      },
    },
  });

  if (existingRecord) {
    await touchOrganizationActivity(organizationId);

    return {
      statusCode: 200,
      body: successResponse(
        {
          status: "already_checked_in",
          attendee: {
            id: attendee.id,
            name: attendee.name,
            email: attendee.email,
            profileImageUrl: attendee.profileImageUrl,
          },
          checkedInAt: existingRecord.checkedInAt,
        },
        "Attendee already checked in",
      ),
    };
  }

  const record = await prisma.attendanceRecord.create({
    data: {
      attendeeId: attendee.id,
      eventSessionId: session.id,
    },
  });

  await touchOrganizationActivity(organizationId);

  return {
    statusCode: 201,
    body: successResponse(
      {
        status: "success",
        attendee: {
          id: attendee.id,
          name: attendee.name,
          email: attendee.email,
          profileImageUrl: attendee.profileImageUrl,
        },
        checkedInAt: record.checkedInAt,
      },
      "Check-in successful",
    ),
  };
}

export const getSessionShareLink = asyncHandler(async (request, response) => {
  const organizationId = request.auth!.organizationId as string;
  const eventSessionId = request.params.eventSessionId as string;

  const session = await prisma.eventSession.findFirst({
    where: {
      id: eventSessionId,
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
    },
  });

  if (!session) {
    throw new ApiError(404, "Event session not found");
  }

  const token = await ensurePublicScanToken(session.id);
  await touchOrganizationActivity(organizationId);

  response.json(
    successResponse({
      token,
      path: `/scan/${token}`,
      session: {
        id: session.id,
        title: session.title,
        sessionDate: session.sessionDate,
        eventSeries: session.eventSeries,
      },
    }),
  );
});

export const getPublicScannerSession = asyncHandler(async (request, response) => {
  const token = request.params.token as string;

  const session = await prisma.eventSession.findUnique({
    where: {
      publicScanToken: token,
    },
    include: {
      eventSeries: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!session) {
    throw new ApiError(404, "Scanner link not found");
  }

  response.json(
    successResponse({
      token,
      session: {
        id: session.id,
        title: session.title,
        description: session.description,
        sessionDate: session.sessionDate,
        eventSeries: session.eventSeries,
      },
    }),
  );
});

export const checkIn = asyncHandler(async (request, response) => {
  const body = checkInSchema.parse(request.body);
  const organizationId = request.auth!.organizationId as string;
  const result = await performCheckIn(body.eventSessionId, organizationId, body.qrToken);

  response.status(result.statusCode).json(result.body);
});

export const publicCheckIn = asyncHandler(async (request, response) => {
  const token = request.params.token as string;
  const body = publicCheckInSchema.parse(request.body);

  const session = await prisma.eventSession.findUnique({
    where: {
      publicScanToken: token,
    },
    include: {
      eventSeries: {
        select: {
          organizationId: true,
        },
      },
    },
  });

  if (!session) {
    throw new ApiError(404, "Scanner link not found");
  }

  const result = await performCheckIn(session.id, session.eventSeries.organizationId, body.qrToken);
  response.status(result.statusCode).json(result.body);
});
