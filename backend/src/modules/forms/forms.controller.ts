import { AttendeeSystemField, Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { successResponse } from "../../utils/api-response";
import { asyncHandler } from "../../utils/async-handler";
import { ensureDefaultAttendeeTypes } from "../attendee-types/attendee-types.controller";
import { touchOrganizationActivity } from "../organizations/organizations.activity";
import {
  CHOICE_ITEM_TYPES,
  SYSTEM_FIELD_TYPES,
  getDefaultSystemFields,
  getRequiredSystemFields,
  getSystemFieldLabel,
} from "./forms.constants";
import {
  createFormSchema,
  syncItemsSchema,
  updateFormSchema,
  type SyncItemInput,
} from "./forms.schemas";
import { removeFormImages, saveFormImage } from "./forms.upload";

export function generateFormPublicToken() {
  return randomBytes(12).toString("base64url");
}

const organizationRequirementSelect = {
  requireAttendeeEmail: true,
  requireAttendeePhone: true,
  requireAttendeeNumber: true,
} as const;

export const formItemsInclude = {
  where: { archivedAt: null },
  orderBy: { position: "asc" },
  include: {
    options: {
      where: { archivedAt: null },
      orderBy: { position: "asc" },
    },
  },
} satisfies Prisma.Form$itemsArgs;

async function getOwnedForm(formId: string, organizationId: string) {
  const form = await prisma.form.findFirst({
    where: { id: formId, organizationId },
  });

  if (!form) {
    throw new ApiError(404, "Form not found");
  }

  return form;
}

async function getOrganizationRequirements(organizationId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: organizationRequirementSelect,
  });

  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  return organization;
}

async function assertEventSeriesInOrganization(eventSeriesId: string | null | undefined, organizationId: string) {
  if (!eventSeriesId) {
    return;
  }

  const series = await prisma.eventSeries.findFirst({
    where: { id: eventSeriesId, organizationId },
    select: { id: true },
  });

  if (!series) {
    throw new ApiError(400, "Event series not found in this organization");
  }
}

function assertImageBelongsToForm(imageUrl: string | null | undefined, formId: string) {
  if (imageUrl && !imageUrl.startsWith(`/uploads/forms/${formId}/`)) {
    throw new ApiError(400, "Images must be uploaded to this form");
  }
}

function toJsonInput(value: unknown) {
  return value === null || value === undefined ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
}

export const listForms = asyncHandler(async (request, response) => {
  const organizationId = request.auth!.organizationId as string;

  const forms = await prisma.form.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      eventSeries: { select: { id: true, name: true } },
      _count: { select: { responses: true } },
    },
  });

  response.json(
    successResponse(
      forms.map(({ _count, ...form }) => ({
        ...form,
        responseCount: _count.responses,
      })),
    ),
  );
});

export const createForm = asyncHandler(async (request, response) => {
  const organizationId = request.auth!.organizationId as string;
  const body = createFormSchema.parse(request.body);
  const organization = await getOrganizationRequirements(organizationId);
  const requiredFields = getRequiredSystemFields(organization);
  const language = body.language ?? "th";

  await assertEventSeriesInOrganization(body.eventSeriesId, organizationId);

  const form = await prisma.form.create({
    data: {
      organizationId,
      title: body.title,
      description: body.description,
      eventSeriesId: body.eventSeriesId ?? null,
      publicToken: generateFormPublicToken(),
      theme: { primaryColor: "#d97706", backgroundColor: "#fff7ed" },
      settings: { sendQrEmailOnSubmit: true, showQrOnSuccess: true },
      items: {
        create: getDefaultSystemFields(organization).map((systemField, position) => ({
          type: SYSTEM_FIELD_TYPES[systemField],
          systemField,
          position,
          label: getSystemFieldLabel(systemField, language),
          required: requiredFields.has(systemField),
        })),
      },
    },
  });

  await touchOrganizationActivity(organizationId);

  response.status(201).json(successResponse(form, "Form created"));
});

export const getForm = asyncHandler(async (request, response) => {
  const organizationId = request.auth!.organizationId as string;
  const formId = request.params.id as string;

  const form = await prisma.form.findFirst({
    where: { id: formId, organizationId },
    include: {
      items: formItemsInclude,
      eventSeries: { select: { id: true, name: true } },
      _count: { select: { responses: true } },
    },
  });

  if (!form) {
    throw new ApiError(404, "Form not found");
  }

  await ensureDefaultAttendeeTypes(organizationId);

  const [organization, attendeeTypes] = await Promise.all([
    getOrganizationRequirements(organizationId),
    prisma.attendeeType.findMany({
      where: { organizationId },
      orderBy: { label: "asc" },
      select: { label: true },
    }),
  ]);

  const { _count, ...rest } = form;

  response.json(
    successResponse({
      ...rest,
      responseCount: _count.responses,
      requiredSystemFields: Array.from(getRequiredSystemFields(organization)),
      attendeeTypeOptions: attendeeTypes.map((type) => type.label),
    }),
  );
});

export const updateForm = asyncHandler(async (request, response) => {
  const organizationId = request.auth!.organizationId as string;
  const formId = request.params.id as string;
  const body = updateFormSchema.parse(request.body);

  await getOwnedForm(formId, organizationId);
  await assertEventSeriesInOrganization(body.eventSeriesId, organizationId);
  assertImageBelongsToForm(body.theme?.headerImageUrl, formId);
  assertImageBelongsToForm(body.theme?.backgroundImageUrl, formId);
  assertImageBelongsToForm(body.theme?.logoUrl, formId);

  const form = await prisma.form.update({
    where: { id: formId },
    data: {
      title: body.title,
      description: body.description,
      eventSeriesId: body.eventSeriesId === undefined ? undefined : body.eventSeriesId,
      status: body.status,
      theme: body.theme === undefined ? undefined : toJsonInput(body.theme),
      settings: body.settings === undefined ? undefined : toJsonInput(body.settings),
    },
  });

  await touchOrganizationActivity(organizationId);

  response.json(successResponse(form, "Form updated"));
});

export const deleteForm = asyncHandler(async (request, response) => {
  const organizationId = request.auth!.organizationId as string;
  const formId = request.params.id as string;

  await getOwnedForm(formId, organizationId);
  await prisma.form.delete({ where: { id: formId } });
  await removeFormImages(formId);
  await touchOrganizationActivity(organizationId);

  response.json(successResponse(null, "Form deleted"));
});

export const uploadFormImage = asyncHandler(async (request, response) => {
  const organizationId = request.auth!.organizationId as string;
  const formId = request.params.id as string;

  await getOwnedForm(formId, organizationId);

  if (!request.file) {
    throw new ApiError(400, "Choose an image to upload");
  }

  const url = await saveFormImage(formId, request.file);

  response.status(201).json(successResponse({ url }, "Image uploaded"));
});

/**
 * Validates the full item list sent by the builder before anything is written.
 * Attendee fields keep a fixed type, cannot appear twice, and the ones the
 * organization requires cannot be removed or made optional.
 */
function normalizeItems(items: SyncItemInput[], requiredFields: Set<AttendeeSystemField>, formId: string) {
  const seenSystemFields = new Set<AttendeeSystemField>();

  const normalized = items.map((item, index) => {
    const systemField = item.systemField ?? null;
    const type = systemField ? SYSTEM_FIELD_TYPES[systemField] : item.type;

    if (systemField) {
      if (seenSystemFields.has(systemField)) {
        throw new ApiError(400, `The attendee field ${systemField} appears more than once`);
      }

      seenSystemFields.add(systemField);
    }

    assertImageBelongsToForm(item.imageUrl, formId);
    item.options.forEach((option) => assertImageBelongsToForm(option.imageUrl, formId));

    // Attendee type choices come from the organization's attendee type list.
    const usesOptions = CHOICE_ITEM_TYPES.has(type) && systemField !== AttendeeSystemField.ATTENDEE_TYPE;

    if (usesOptions && item.options.length === 0) {
      throw new ApiError(400, `Question ${index + 1} needs at least one choice`);
    }

    return {
      ...item,
      type,
      systemField,
      required: systemField && requiredFields.has(systemField) ? true : item.required,
      options: usesOptions ? item.options : [],
    };
  });

  for (const field of requiredFields) {
    if (!seenSystemFields.has(field)) {
      throw new ApiError(400, `The attendee field ${field} is required on every form`);
    }
  }

  return normalized;
}

export const syncFormItems = asyncHandler(async (request, response) => {
  const organizationId = request.auth!.organizationId as string;
  const formId = request.params.id as string;
  const body = syncItemsSchema.parse(request.body);

  await getOwnedForm(formId, organizationId);

  const organization = await getOrganizationRequirements(organizationId);
  const items = normalizeItems(body.items, getRequiredSystemFields(organization), formId);

  await prisma.$transaction(
    async (tx) => {
      const [existingItems, responseCount] = await Promise.all([
        tx.formItem.findMany({
          where: { formId },
          include: { options: true },
        }),
        tx.formResponse.count({ where: { formId } }),
      ]);

      // Once people have answered, removed questions/choices are archived
      // instead of deleted so their answers still show up in exports.
      const keepHistory = responseCount > 0;
      const existingById = new Map(existingItems.map((item) => [item.id, item]));
      const claimedIds = new Set<string>();

      // Resolve which stored row each incoming item updates. An attendee field
      // re-added without an id reuses its old row (it is unique per form).
      const resolved = items.map((item) => {
        let targetId = item.id && existingById.has(item.id) ? item.id : undefined;

        if (!targetId && item.systemField) {
          targetId = existingItems.find(
            (existing) => existing.systemField === item.systemField && !claimedIds.has(existing.id),
          )?.id;
        }

        if (targetId) {
          if (claimedIds.has(targetId)) {
            throw new ApiError(400, "The same question was sent twice");
          }

          claimedIds.add(targetId);
        }

        return { item, targetId };
      });

      const removedItems = existingItems.filter((item) => !item.archivedAt && !claimedIds.has(item.id));

      if (removedItems.length > 0) {
        const removedIds = removedItems.map((item) => item.id);

        if (keepHistory) {
          await tx.formItem.updateMany({
            where: { id: { in: removedIds } },
            data: { archivedAt: new Date() },
          });
        } else {
          await tx.formItem.deleteMany({ where: { id: { in: removedIds } } });
        }
      }

      for (const [position, { item, targetId }] of resolved.entries()) {
        const data = {
          type: item.type,
          systemField: item.systemField,
          position,
          label: item.label,
          description: item.description,
          imageUrl: item.imageUrl ?? null,
          required: item.required,
          config: toJsonInput(item.config),
          archivedAt: null,
        };

        const saved = targetId
          ? await tx.formItem.update({ where: { id: targetId }, data })
          : await tx.formItem.create({ data: { ...data, formId } });

        const existingOptions = targetId ? existingById.get(targetId)?.options ?? [] : [];
        const existingOptionIds = new Set(existingOptions.map((option) => option.id));
        const keptOptionIds = new Set<string>();

        for (const [optionPosition, option] of item.options.entries()) {
          const optionData = {
            label: option.label,
            imageUrl: option.imageUrl ?? null,
            position: optionPosition,
            archivedAt: null,
          };

          if (option.id && existingOptionIds.has(option.id) && !keptOptionIds.has(option.id)) {
            keptOptionIds.add(option.id);
            await tx.formItemOption.update({ where: { id: option.id }, data: optionData });
          } else {
            await tx.formItemOption.create({ data: { ...optionData, itemId: saved.id } });
          }
        }

        const removedOptionIds = existingOptions
          .filter((option) => !option.archivedAt && !keptOptionIds.has(option.id))
          .map((option) => option.id);

        if (removedOptionIds.length > 0) {
          if (keepHistory) {
            await tx.formItemOption.updateMany({
              where: { id: { in: removedOptionIds } },
              data: { archivedAt: new Date() },
            });
          } else {
            await tx.formItemOption.deleteMany({ where: { id: { in: removedOptionIds } } });
          }
        }
      }

      await tx.form.update({ where: { id: formId }, data: { updatedAt: new Date() } });
    },
    { timeout: 30_000 },
  );

  const savedItems = await prisma.formItem.findMany({
    where: { formId, archivedAt: null },
    orderBy: { position: "asc" },
    include: { options: { where: { archivedAt: null }, orderBy: { position: "asc" } } },
  });

  await touchOrganizationActivity(organizationId);

  response.json(successResponse(savedItems, "Form saved"));
});
