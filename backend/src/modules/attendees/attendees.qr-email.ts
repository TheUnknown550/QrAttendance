import { sendAttendeeQrCodeEmail } from "../../lib/email";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { successResponse } from "../../utils/api-response";
import { asyncHandler } from "../../utils/async-handler";
import { generateAttendeeQrAttachment, type QrPlacementTemplate } from "../../utils/qr-image";
import {
  QR_TEMPLATE_CANVAS_HEIGHT,
  QR_TEMPLATE_CANVAS_WIDTH,
  QR_TEMPLATE_DEFAULT_QR_SIZE,
  QR_TEMPLATE_DEFAULT_QR_X,
  QR_TEMPLATE_DEFAULT_QR_Y,
} from "../organizations/qr-template.constants";
import { touchOrganizationActivity } from "../organizations/organizations.activity";
import { sendQrEmailsSchema } from "./attendees.schemas";

const SEND_DELAY_MS = 350;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type EventDetails = {
  eventName: string;
  subject?: string | null;
  eventDate?: string | null;
  eventLocation?: string | null;
  message?: string | null;
};

type QrEmailAttendee = {
  id: string;
  firstName: string;
  surname: string;
  organizationName: string | null;
  attendeeType: string | null;
  attendeeNumber: number | null;
  email: string;
  qrToken: string;
};

async function dispatchAttendeeQrEmails(
  attendees: QrEmailAttendee[],
  organizationName: string,
  qrTemplate: QrPlacementTemplate,
  eventDetails: EventDetails,
) {
  for (const attendee of attendees) {
    try {
      const { buffer: qrPngBuffer, width, height } = await generateAttendeeQrAttachment(
        attendee.qrToken,
        qrTemplate,
      );

      await sendAttendeeQrCodeEmail({
        to: attendee.email,
        firstName: attendee.firstName,
        surname: attendee.surname,
        attendeeOrganizationName: attendee.organizationName,
        attendeeType: attendee.attendeeType,
        attendeeNumber: attendee.attendeeNumber,
        organizationName,
        qrPngBuffer,
        qrImageWidth: width,
        qrImageHeight: height,
        ...eventDetails,
      });

      await prisma.attendee.update({
        where: { id: attendee.id },
        data: { emailedAt: new Date() },
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
      qrTemplateImageUrl: true,
      qrTemplateX: true,
      qrTemplateY: true,
      qrTemplateSize: true,
    },
  });

  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  const matchedAttendees = await prisma.attendee.findMany({
    where: {
      organizationId,
      deletedAt: null,
      ...(body.attendeeIds && body.attendeeIds.length > 0 ? { id: { in: body.attendeeIds } } : {}),
      ...(body.recipientFilter === "new" ? { emailedAt: null } : {}),
    },
    select: {
      id: true,
      firstName: true,
      surname: true,
      organizationName: true,
      attendeeType: true,
      attendeeNumber: true,
      email: true,
      qrToken: true,
    },
  });

  if (matchedAttendees.length === 0) {
    throw new ApiError(
      404,
      body.attendeeIds && body.attendeeIds.length > 0
        ? "Attendee not found"
        : body.recipientFilter === "new"
          ? "Every attendee has already been emailed"
          : "No attendees found to email",
    );
  }

  const attendees = matchedAttendees.filter(
    (attendee): attendee is QrEmailAttendee => Boolean(attendee.email),
  );
  const skippedNoEmailCount = matchedAttendees.length - attendees.length;

  if (attendees.length === 0) {
    throw new ApiError(400, "None of the selected attendees have an email address on file");
  }

  const { attendeeIds, ...eventDetails } = body;

  const qrTemplate: QrPlacementTemplate = {
    imageUrl: organization.qrTemplateImageUrl,
    canvasWidth: QR_TEMPLATE_CANVAS_WIDTH,
    canvasHeight: QR_TEMPLATE_CANVAS_HEIGHT,
    qrX: organization.qrTemplateX ?? QR_TEMPLATE_DEFAULT_QR_X,
    qrY: organization.qrTemplateY ?? QR_TEMPLATE_DEFAULT_QR_Y,
    qrSize: organization.qrTemplateSize ?? QR_TEMPLATE_DEFAULT_QR_SIZE,
  };

  await touchOrganizationActivity(organizationId);

  response.status(202).json(
    successResponse(
      {
        recipientCount: attendees.length,
        skippedNoEmailCount,
      },
      `Sending QR codes to ${attendees.length} attendee${attendees.length === 1 ? "" : "s"}`,
    ),
  );

  void dispatchAttendeeQrEmails(attendees, organization.name, qrTemplate, eventDetails).catch((error) => {
    console.error("Bulk attendee QR email dispatch failed", error);
  });
});
