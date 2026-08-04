import { sendAttendeeQrCodeEmail } from "../../lib/email";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { successResponse } from "../../utils/api-response";
import { asyncHandler } from "../../utils/async-handler";
import { generateQrPngBuffer } from "../../utils/qr-image";
import { touchOrganizationActivity } from "../organizations/organizations.activity";
import { sendQrEmailsSchema } from "./attendees.schemas";

const SEND_DELAY_MS = 350;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type EventDetails = {
  eventName: string;
  eventDate?: string | null;
  eventLocation?: string | null;
  message?: string | null;
};

type QrEmailAttendee = {
  id: string;
  firstName: string;
  surname: string;
  email: string;
  qrToken: string;
};

async function dispatchAttendeeQrEmails(
  attendees: QrEmailAttendee[],
  organizationName: string,
  eventDetails: EventDetails,
) {
  for (const attendee of attendees) {
    try {
      const qrPngBuffer = await generateQrPngBuffer(attendee.qrToken);

      await sendAttendeeQrCodeEmail({
        to: attendee.email,
        firstName: attendee.firstName,
        surname: attendee.surname,
        organizationName,
        qrPngBuffer,
        ...eventDetails,
      });
    } catch (error) {
      console.error(`Failed to send QR email to attendee ${attendee.id}`, error);
    }

    await delay(SEND_DELAY_MS);
  }
}

export const sendQrEmails = asyncHandler(async (request, response) => {
  const organizationId = request.auth!.organizationId as string;
  const body = sendQrEmailsSchema.parse(request.body);

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

  const attendees = await prisma.attendee.findMany({
    where: {
      organizationId,
      deletedAt: null,
    },
    select: {
      id: true,
      firstName: true,
      surname: true,
      email: true,
      qrToken: true,
    },
  });

  if (attendees.length === 0) {
    throw new ApiError(400, "No attendees found to email");
  }

  await touchOrganizationActivity(organizationId);

  response.status(202).json(
    successResponse(
      {
        recipientCount: attendees.length,
      },
      `Sending QR codes to ${attendees.length} attendee${attendees.length === 1 ? "" : "s"}`,
    ),
  );

  void dispatchAttendeeQrEmails(attendees, organization.name, body).catch((error) => {
    console.error("Bulk attendee QR email dispatch failed", error);
  });
});
