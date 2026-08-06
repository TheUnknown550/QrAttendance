import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { successResponse } from "../../utils/api-response";
import { asyncHandler } from "../../utils/async-handler";
import { requireMembership } from "../auth/auth.utils";
import { touchOrganizationActivity } from "./organizations.activity";
import {
  QR_TEMPLATE_CANVAS_HEIGHT,
  QR_TEMPLATE_CANVAS_WIDTH,
  QR_TEMPLATE_DEFAULT_QR_SIZE,
  QR_TEMPLATE_DEFAULT_QR_X,
  QR_TEMPLATE_DEFAULT_QR_Y,
} from "./qr-template.constants";
import { updateQrTemplateSchema } from "./qr-template.schemas";
import { removeStoredQrTemplateImage, saveQrTemplateImage } from "./qr-template.upload";

function buildQrTemplateResponse(organization: {
  qrTemplateImageUrl: string | null;
  qrTemplateX: number | null;
  qrTemplateY: number | null;
  qrTemplateSize: number | null;
}) {
  return {
    canvasWidth: QR_TEMPLATE_CANVAS_WIDTH,
    canvasHeight: QR_TEMPLATE_CANVAS_HEIGHT,
    imageUrl: organization.qrTemplateImageUrl,
    qrX: organization.qrTemplateX ?? QR_TEMPLATE_DEFAULT_QR_X,
    qrY: organization.qrTemplateY ?? QR_TEMPLATE_DEFAULT_QR_Y,
    qrSize: organization.qrTemplateSize ?? QR_TEMPLATE_DEFAULT_QR_SIZE,
  };
}

export const getQrTemplate = asyncHandler(async (request, response) => {
  const organizationId = request.auth!.organizationId!;
  await requireMembership(request.auth!.userId, organizationId);

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      qrTemplateImageUrl: true,
      qrTemplateX: true,
      qrTemplateY: true,
      qrTemplateSize: true,
    },
  });

  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  response.json(successResponse(buildQrTemplateResponse(organization)));
});

export const updateQrTemplate = asyncHandler(async (request, response) => {
  const organizationId = request.auth!.organizationId!;
  await requireMembership(request.auth!.userId, organizationId);

  const body = updateQrTemplateSchema.parse(request.body);

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true, qrTemplateImageUrl: true },
  });

  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  let imageUrl = organization.qrTemplateImageUrl;

  if (request.file) {
    const uploaded = await saveQrTemplateImage({ tenantName: organization.name, file: request.file });
    await removeStoredQrTemplateImage(organization.qrTemplateImageUrl);
    imageUrl = uploaded.publicUrl;
  }

  const updated = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      qrTemplateImageUrl: imageUrl,
      qrTemplateX: body.qrX,
      qrTemplateY: body.qrY,
      qrTemplateSize: body.qrSize,
    },
    select: {
      qrTemplateImageUrl: true,
      qrTemplateX: true,
      qrTemplateY: true,
      qrTemplateSize: true,
    },
  });

  await touchOrganizationActivity(organizationId);

  response.json(successResponse(buildQrTemplateResponse(updated), "QR template updated"));
});

export const deleteQrTemplateImage = asyncHandler(async (request, response) => {
  const organizationId = request.auth!.organizationId!;
  await requireMembership(request.auth!.userId, organizationId);

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { qrTemplateImageUrl: true },
  });

  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  await removeStoredQrTemplateImage(organization.qrTemplateImageUrl);

  const updated = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      qrTemplateImageUrl: null,
      qrTemplateX: null,
      qrTemplateY: null,
      qrTemplateSize: null,
    },
    select: {
      qrTemplateImageUrl: true,
      qrTemplateX: true,
      qrTemplateY: true,
      qrTemplateSize: true,
    },
  });

  await touchOrganizationActivity(organizationId);

  response.json(successResponse(buildQrTemplateResponse(updated), "QR template reset"));
});
