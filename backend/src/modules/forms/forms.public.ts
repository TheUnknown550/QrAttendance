import { AttendeeSystemField, FormItemType, FormStatus, Prisma, type FormItem, type FormItemOption } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { successResponse } from "../../utils/api-response";
import { asyncHandler } from "../../utils/async-handler";
import { generateQrToken } from "../../utils/qr-token";
import { ensureDefaultAttendeeTypes } from "../attendee-types/attendee-types.controller";
import { buildOrganizationQrTemplate, dispatchAttendeeQrEmails } from "../attendees/attendees.qr-email";
import { touchOrganizationActivity } from "../organizations/organizations.activity";
import { getRequiredSystemFields, isQuestionType } from "./forms.constants";
import { formItemsInclude } from "./forms.controller";
import { submitFormSchema, type FormSettings } from "./forms.schemas";

type ItemWithOptions = FormItem & { options: FormItemOption[] };

type ParsedAnswer = {
  textValue: string | null;
  numberValue: Prisma.Decimal | null;
  dateValue: Date | null;
  optionIds: string[];
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9+\-()\s.#]{3,30}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function readSettings(value: Prisma.JsonValue | null): FormSettings {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as FormSettings) : {};
}

function isFormClosed(form: { status: FormStatus; settings: Prisma.JsonValue | null }) {
  if (form.status === FormStatus.CLOSED) {
    return true;
  }

  const closesAt = readSettings(form.settings).closesAt;
  return Boolean(closesAt && new Date(closesAt).getTime() <= Date.now());
}

async function findPublishedForm(token: string) {
  const form = await prisma.form.findUnique({
    where: { publicToken: token },
    include: {
      items: formItemsInclude,
      organization: {
        select: {
          id: true,
          name: true,
          requireAttendeeEmail: true,
          requireAttendeePhone: true,
          requireAttendeeNumber: true,
          qrTemplateImageUrl: true,
          qrTemplateX: true,
          qrTemplateY: true,
          qrTemplateSize: true,
        },
      },
      eventSeries: { select: { id: true, name: true } },
    },
  });

  if (!form || form.status === FormStatus.DRAFT) {
    throw new ApiError(404, "Form not found");
  }

  return form;
}

async function getAttendeeTypeLabels(organizationId: string) {
  await ensureDefaultAttendeeTypes(organizationId);

  const types = await prisma.attendeeType.findMany({
    where: { organizationId },
    orderBy: { label: "asc" },
    select: { label: true },
  });

  return types.map((type) => type.label);
}

export const getPublicForm = asyncHandler(async (request, response) => {
  const form = await findPublishedForm(request.params.token as string);
  const settings = readSettings(form.settings);

  response.json(
    successResponse({
      title: form.title,
      description: form.description,
      theme: form.theme,
      closesAt: settings.closesAt ?? null,
      isClosed: isFormClosed(form),
      organizationName: form.organization.name,
      eventSeriesName: form.eventSeries?.name ?? null,
      attendeeTypeOptions: await getAttendeeTypeLabels(form.organization.id),
      items: form.items.map((item) => ({
        id: item.id,
        type: item.type,
        systemField: item.systemField,
        label: item.label,
        description: item.description,
        imageUrl: item.imageUrl,
        required: item.required,
        config: item.config,
        options: item.options.map((option) => ({
          id: option.id,
          label: option.label,
          imageUrl: option.imageUrl,
        })),
      })),
    }),
  );
});

function isEmptyValue(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0)
  );
}

/** Converts one raw submitted value into typed answer columns, or returns an error message. */
function parseAnswer(
  item: ItemWithOptions,
  value: unknown,
  attendeeTypeLabels: string[],
): ParsedAnswer | string {
  const empty: ParsedAnswer = { textValue: null, numberValue: null, dateValue: null, optionIds: [] };
  const text = typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : null;

  // Attendee type is answered with one of the organization's type labels.
  if (item.systemField === AttendeeSystemField.ATTENDEE_TYPE) {
    if (!text || !attendeeTypeLabels.includes(text)) return "Choose one of the listed options";
    return { ...empty, textValue: text };
  }

  switch (item.type) {
    case FormItemType.SHORT_TEXT:
      if (text === null) return "Enter text";
      if (text.length > 500) return "Keep this under 500 characters";
      return { ...empty, textValue: text };
    case FormItemType.PARAGRAPH:
      if (text === null) return "Enter text";
      return { ...empty, textValue: text };
    case FormItemType.EMAIL:
      if (!text || !emailPattern.test(text) || text.length > 254) return "Enter a valid email address";
      return { ...empty, textValue: text.toLowerCase() };
    case FormItemType.PHONE:
      if (!text || !phonePattern.test(text)) return "Enter a valid phone number";
      return { ...empty, textValue: text };
    case FormItemType.NUMBER: {
      const number = text === null ? Number.NaN : Number(text);
      if (!Number.isFinite(number)) return "Enter a number";
      const config = (item.config ?? {}) as { min?: number | null; max?: number | null };
      if (typeof config.min === "number" && number < config.min) return `Must be at least ${config.min}`;
      if (typeof config.max === "number" && number > config.max) return `Must be at most ${config.max}`;
      if (item.systemField === AttendeeSystemField.ATTENDEE_NUMBER && !Number.isInteger(number)) {
        return "Enter a whole number";
      }
      return { ...empty, numberValue: new Prisma.Decimal(number) };
    }
    case FormItemType.DATE: {
      if (!text || !datePattern.test(text)) return "Enter a valid date";
      const date = new Date(`${text}T00:00:00.000Z`);
      if (Number.isNaN(date.getTime())) return "Enter a valid date";
      return { ...empty, dateValue: date };
    }
    case FormItemType.MULTIPLE_CHOICE:
    case FormItemType.DROPDOWN: {
      const optionId = Array.isArray(value) ? value[0] : text;
      if (!optionId || !item.options.some((option) => option.id === optionId)) {
        return "Choose one of the listed options";
      }
      return { ...empty, optionIds: [optionId] };
    }
    case FormItemType.CHECKBOXES: {
      const selected = Array.isArray(value) ? Array.from(new Set(value.map(String))) : text ? [text] : [];
      const validIds = new Set(item.options.map((option) => option.id));
      if (selected.some((optionId) => !validIds.has(optionId))) return "Choose from the listed options";
      // Keep the order the choices appear on the form.
      return { ...empty, optionIds: item.options.filter((option) => selected.includes(option.id)).map((o) => o.id) };
    }
    default:
      return empty;
  }
}

function answerAsText(answer: ParsedAnswer | undefined) {
  if (!answer) return undefined;
  if (answer.textValue) return answer.textValue;
  if (answer.numberValue) return answer.numberValue.toString();
  return undefined;
}

export const submitPublicForm = asyncHandler(async (request, response) => {
  const form = await findPublishedForm(request.params.token as string);

  if (isFormClosed(form)) {
    throw new ApiError(410, "This form is no longer accepting responses");
  }

  const body = submitFormSchema.parse(request.body);
  const attendeeTypeLabels = await getAttendeeTypeLabels(form.organization.id);
  const requiredSystemFields = getRequiredSystemFields(form.organization);
  const fieldErrors: Record<string, string> = {};
  const parsedAnswers = new Map<string, ParsedAnswer>();
  const systemValues = new Map<AttendeeSystemField, ParsedAnswer>();

  for (const item of form.items) {
    if (!isQuestionType(item.type)) continue;

    const raw = body.answers[item.id];
    const required = item.required || (item.systemField ? requiredSystemFields.has(item.systemField) : false);

    if (isEmptyValue(raw)) {
      if (required) fieldErrors[item.id] = "This question is required";
      continue;
    }

    const parsed = parseAnswer(item, raw, attendeeTypeLabels);

    if (typeof parsed === "string") {
      fieldErrors[item.id] = parsed;
      continue;
    }

    parsedAnswers.set(item.id, parsed);
    if (item.systemField) systemValues.set(item.systemField, parsed);
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ApiError(400, "Please check your answers", { fieldErrors });
  }

  // Answers to attendee fields are passed straight into the attendee record.
  const attendeeValues = {
    firstName: answerAsText(systemValues.get(AttendeeSystemField.FIRST_NAME)),
    surname: answerAsText(systemValues.get(AttendeeSystemField.SURNAME)),
    email: answerAsText(systemValues.get(AttendeeSystemField.EMAIL)),
    phone: answerAsText(systemValues.get(AttendeeSystemField.PHONE)),
    organizationName: answerAsText(systemValues.get(AttendeeSystemField.ORGANIZATION_NAME)),
    attendeeType: answerAsText(systemValues.get(AttendeeSystemField.ATTENDEE_TYPE)),
    attendeeNumber: systemValues.get(AttendeeSystemField.ATTENDEE_NUMBER)?.numberValue?.toNumber(),
  };

  if (!attendeeValues.firstName || !attendeeValues.surname) {
    throw new ApiError(400, "First name and surname are required");
  }

  const firstName = attendeeValues.firstName;
  const surname = attendeeValues.surname;
  const organizationId = form.organization.id;

  const result = await prisma.$transaction(async (tx) => {
    // Re-use the attendee if they are already registered: match by email first,
    // otherwise by full name (the same rule the bulk import uses). A name match
    // is skipped when both records have different emails.
    let existing = attendeeValues.email
      ? await tx.attendee.findFirst({
          where: {
            organizationId,
            deletedAt: null,
            email: { equals: attendeeValues.email, mode: "insensitive" },
          },
        })
      : null;

    if (!existing) {
      const nameMatch = await tx.attendee.findFirst({
        where: {
          organizationId,
          deletedAt: null,
          firstName: { equals: firstName, mode: "insensitive" },
          surname: { equals: surname, mode: "insensitive" },
        },
        orderBy: { createdAt: "asc" },
      });

      const emailsConflict = Boolean(
        nameMatch?.email && attendeeValues.email && nameMatch.email.toLowerCase() !== attendeeValues.email,
      );

      existing = emailsConflict ? null : nameMatch;
    }

    let attendee;

    if (existing) {
      // Fill in only what the attendee record is missing. A public form never
      // overwrites details an organizer already has on file.
      attendee = await tx.attendee.update({
        where: { id: existing.id },
        data: {
          email: existing.email ?? attendeeValues.email,
          phone: existing.phone ?? attendeeValues.phone,
          organizationName: existing.organizationName ?? attendeeValues.organizationName,
          attendeeType: existing.attendeeType ?? attendeeValues.attendeeType,
          attendeeNumber: existing.attendeeNumber ?? attendeeValues.attendeeNumber,
        },
      });
    } else {
      attendee = await tx.attendee.create({
        data: {
          organizationId,
          firstName,
          surname,
          email: attendeeValues.email,
          phone: attendeeValues.phone,
          organizationName: attendeeValues.organizationName,
          attendeeType: attendeeValues.attendeeType,
          attendeeNumber: attendeeValues.attendeeNumber,
          qrToken: generateQrToken(),
        },
      });
    }

    await tx.formResponse.create({
      data: {
        formId: form.id,
        attendeeId: attendee.id,
        matchedExistingAttendee: Boolean(existing),
        ipAddress: request.ip?.slice(0, 100),
        userAgent: request.get("user-agent")?.slice(0, 500),
        answers: {
          create: Array.from(parsedAnswers.entries()).map(([itemId, answer]) => ({ itemId, ...answer })),
        },
      },
    });

    return { attendee, matchedExisting: Boolean(existing) };
  });

  await touchOrganizationActivity(organizationId);

  const settings = readSettings(form.settings);
  const { attendee, matchedExisting } = result;
  const willEmail = Boolean(settings.sendQrEmailOnSubmit && attendee.email);

  if (willEmail && attendee.email) {
    void dispatchAttendeeQrEmails(
      [{ ...attendee, email: attendee.email }],
      form.organization.name,
      buildOrganizationQrTemplate(form.organization),
      { eventName: form.eventSeries?.name ?? form.title },
    ).catch((error) => console.error("Form QR email dispatch failed", error));
  }

  response.status(201).json(
    successResponse(
      {
        firstName: attendee.firstName,
        surname: attendee.surname,
        matchedExisting,
        emailSent: willEmail,
        // The QR code is only shown on screen to brand-new registrations, so a
        // form can never be used to look up someone else's existing QR code.
        qrToken: settings.showQrOnSuccess && !matchedExisting ? attendee.qrToken : null,
        confirmationMessage: settings.confirmationMessage ?? null,
      },
      "Response submitted",
    ),
  );
});

