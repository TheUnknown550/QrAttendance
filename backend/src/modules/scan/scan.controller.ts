import { randomBytes } from "node:crypto";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { successResponse } from "../../utils/api-response";
import { asyncHandler } from "../../utils/async-handler";
import { touchOrganizationActivity } from "../organizations/organizations.activity";
import { saveCheckInPhoto } from "./scan.upload";
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

async function performLookup(eventSessionId: string, organizationId: string, qrToken: string) {
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

  return {
    statusCode: 200,
    body: successResponse(
      {
        status: existingRecord ? "already_checked_in" : "found",
        attendee: {
          id: attendee.id,
          firstName: attendee.firstName,
          surname: attendee.surname,
          organizationName: attendee.organizationName,
          attendeeType: attendee.attendeeType,
          email: attendee.email,
          phone: attendee.phone,
          attendeeNumber: attendee.attendeeNumber,
          profileImageUrl: attendee.profileImageUrl,
        },
        checkedInAt: existingRecord?.checkedInAt ?? null,
      },
      existingRecord ? "Attendee already checked in" : "Attendee found",
    ),
  };
}

async function performCheckIn(
  eventSessionId: string,
  organizationId: string,
  qrToken: string,
  checkInPhotoUrl?: string,
) {
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
            firstName: attendee.firstName,
            surname: attendee.surname,
            organizationName: attendee.organizationName,
            attendeeType: attendee.attendeeType,
            email: attendee.email,
            phone: attendee.phone,
            attendeeNumber: attendee.attendeeNumber,
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
      checkInPhotoUrl,
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
          firstName: attendee.firstName,
          surname: attendee.surname,
          organizationName: attendee.organizationName,
          attendeeType: attendee.attendeeType,
          email: attendee.email,
          phone: attendee.phone,
          attendeeNumber: attendee.attendeeNumber,
          profileImageUrl: attendee.profileImageUrl,
        },
        checkedInAt: record.checkedInAt,
        checkInPhotoUrl: record.checkInPhotoUrl,
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
          requireCheckInApproval: true,
          showOrganizationName: true,
          showAttendeeType: true,
          showPhone: true,
          showEmail: true,
          showAttendeeNumber: true,
          requireCheckInPhoto: true,
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
          requireCheckInApproval: true,
          showOrganizationName: true,
          showAttendeeType: true,
          showPhone: true,
          showEmail: true,
          showAttendeeNumber: true,
          requireCheckInPhoto: true,
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

export const lookupAttendee = asyncHandler(async (request, response) => {
  const body = checkInSchema.parse(request.body);
  const organizationId = request.auth!.organizationId as string;
  const result = await performLookup(body.eventSessionId, organizationId, body.qrToken);

  response.status(result.statusCode).json(result.body);
});

export const checkIn = asyncHandler(async (request, response) => {
  const body = checkInSchema.parse(request.body);
  const organizationId = request.auth!.organizationId as string;
  const result = await performCheckIn(body.eventSessionId, organizationId, body.qrToken);

  response.status(result.statusCode).json(result.body);
});

async function resolvePublicSession(token: string) {
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

  return session;
}

export const publicLookupAttendee = asyncHandler(async (request, response) => {
  const token = request.params.token as string;
  const body = publicCheckInSchema.parse(request.body);
  const session = await resolvePublicSession(token);

  const result = await performLookup(session.id, session.eventSeries.organizationId, body.qrToken);
  response.status(result.statusCode).json(result.body);
});

export const publicCheckIn = asyncHandler(async (request, response) => {
  const token = request.params.token as string;
  const body = publicCheckInSchema.parse(request.body);
  const session = await resolvePublicSession(token);

  const result = await performCheckIn(session.id, session.eventSeries.organizationId, body.qrToken);
  response.status(result.statusCode).json(result.body);
});

export const publicCheckInWithPhoto = asyncHandler(async (request, response) => {
  const token = request.params.token as string;
  const body = publicCheckInSchema.parse(request.body);
  const session = await resolvePublicSession(token);

  if (!request.file) {
    throw new ApiError(400, "A check-in photo is required for this event");
  }

  const organization = await prisma.organization.findUnique({
    where: {
      id: session.eventSeries.organizationId,
    },
    select: {
      name: true,
    },
  });

  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  const photo = await saveCheckInPhoto({
    tenantName: organization.name,
    sessionId: session.id,
    file: request.file,
  });

  const result = await performCheckIn(
    session.id,
    session.eventSeries.organizationId,
    body.qrToken,
    photo.publicUrl,
  );
  response.status(result.statusCode).json(result.body);
});
