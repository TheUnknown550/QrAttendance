import { FormItemType, type FormAnswer, type FormItem, type FormItemOption } from "@prisma/client";
import XLSX from "xlsx";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { successResponse } from "../../utils/api-response";
import { asyncHandler } from "../../utils/async-handler";
import { isQuestionType } from "./forms.constants";
import { removeFormResponsePhoto } from "./forms.upload";

type ItemWithOptions = FormItem & { options: FormItemOption[] };

type ResponseColumn = {
  id: string;
  label: string;
  type: FormItem["type"];
  systemField: FormItem["systemField"];
  archived: boolean;
};

async function getOwnedFormWithAllItems(formId: string, organizationId: string) {
  const form = await prisma.form.findFirst({
    where: { id: formId, organizationId },
    include: {
      // Archived questions are included so answers given before they were
      // removed still appear (after the current questions).
      items: {
        orderBy: [{ archivedAt: { sort: "asc", nulls: "first" } }, { position: "asc" }],
        include: { options: true },
      },
    },
  });

  if (!form) {
    throw new ApiError(404, "Form not found");
  }

  return form;
}

function buildColumns(items: ItemWithOptions[]): ResponseColumn[] {
  return items
    .filter((item) => isQuestionType(item.type))
    .map((item, index) => ({
      id: item.id,
      label: item.label?.trim() || `Question ${index + 1}`,
      type: item.type,
      systemField: item.systemField,
      archived: Boolean(item.archivedAt),
    }));
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** Turns a stored answer back into the text shown in tables and Excel. */
function formatAnswer(answer: FormAnswer, optionLabels: Map<string, string>) {
  if (answer.optionIds.length > 0) {
    return answer.optionIds.map((optionId) => optionLabels.get(optionId) ?? "(removed choice)").join(", ");
  }

  if (answer.textValue !== null) return answer.textValue;
  if (answer.numberValue !== null) return answer.numberValue.toString();
  if (answer.dateValue !== null) return formatDateOnly(answer.dateValue);
  return "";
}

function buildOptionLabelMap(items: ItemWithOptions[]) {
  return new Map(items.flatMap((item) => item.options.map((option) => [option.id, option.label] as const)));
}

export const listFormResponses = asyncHandler(async (request, response) => {
  const organizationId = request.auth!.organizationId as string;
  const formId = request.params.id as string;
  const page = Math.max(Number(request.query.page ?? 1) || 1, 1);
  const requestedPageSize = Number(request.query.pageSize ?? env.DEFAULT_PAGE_SIZE) || env.DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(Math.max(requestedPageSize, 1), env.MAX_PAGE_SIZE);

  const form = await getOwnedFormWithAllItems(formId, organizationId);
  const columns = buildColumns(form.items);
  const optionLabels = buildOptionLabelMap(form.items);

  const [responses, total] = await prisma.$transaction([
    prisma.formResponse.findMany({
      where: { formId },
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        answers: true,
        attendee: { select: { id: true, firstName: true, surname: true, deletedAt: true } },
      },
    }),
    prisma.formResponse.count({ where: { formId } }),
  ]);

  response.json(
    successResponse({
      columns,
      items: responses.map((formResponse) => ({
        id: formResponse.id,
        submittedAt: formResponse.submittedAt,
        matchedExistingAttendee: formResponse.matchedExistingAttendee,
        attendee:
          formResponse.attendee && !formResponse.attendee.deletedAt
            ? {
                id: formResponse.attendee.id,
                firstName: formResponse.attendee.firstName,
                surname: formResponse.attendee.surname,
              }
            : null,
        values: Object.fromEntries(
          formResponse.answers.map((answer) => [answer.itemId, formatAnswer(answer, optionLabels)]),
        ),
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
      },
    }),
  );
});

export const deleteFormResponse = asyncHandler(async (request, response) => {
  const organizationId = request.auth!.organizationId as string;
  const formId = request.params.id as string;
  const responseId = request.params.responseId as string;

  const existing = await prisma.formResponse.findFirst({
    where: { id: responseId, formId, form: { organizationId } },
    select: { id: true, answers: { where: { item: { type: FormItemType.PHOTO } }, select: { textValue: true } } },
  });

  if (!existing) {
    throw new ApiError(404, "Response not found");
  }

  // Only the form response (and its uploaded photos) is removed; the attendee it created stays.
  await prisma.formResponse.delete({ where: { id: existing.id } });
  await Promise.all(existing.answers.map((answer) => removeFormResponsePhoto(formId, answer.textValue)));

  response.json(successResponse(null, "Response deleted"));
});

function safeFileName(value: string) {
  const cleaned = value.replace(/[\\/:*?"<>|\r\n]+/g, " ").trim();
  return cleaned || "form";
}

export const exportFormResponses = asyncHandler(async (request, response) => {
  const organizationId = request.auth!.organizationId as string;
  const formId = request.params.id as string;

  const form = await getOwnedFormWithAllItems(formId, organizationId);
  const total = await prisma.formResponse.count({ where: { formId } });

  if (total > env.REPORT_EXPORT_MAX_ROWS) {
    throw new ApiError(
      413,
      `This form has ${total} responses, which exceeds the export limit of ${env.REPORT_EXPORT_MAX_ROWS}.`,
    );
  }

  const columns = buildColumns(form.items);
  const optionLabels = buildOptionLabelMap(form.items);
  const responses = await prisma.formResponse.findMany({
    where: { formId },
    orderBy: { submittedAt: "asc" },
    include: {
      answers: true,
      attendee: { select: { attendeeNumber: true, qrToken: true } },
    },
  });

  const header = [
    "#",
    "Submitted at",
    "Attendee record",
    ...columns.map((column) => (column.archived ? `${column.label} (deleted question)` : column.label)),
  ];

  const rows = responses.map((formResponse, index) => {
    const values = new Map(
      formResponse.answers.map((answer) => [answer.itemId, formatAnswer(answer, optionLabels)]),
    );

    return [
      index + 1,
      formResponse.submittedAt,
      !formResponse.attendee ? "Removed" : formResponse.matchedExistingAttendee ? "Existing attendee" : "New attendee",
      ...columns.map((column) => values.get(column.id) ?? ""),
    ];
  });

  // Photo answers are stored as paths; Excel gets a full, clickable link instead.
  const firstQuestionColumn = 3;
  const photoColumns = columns
    .map((column, index) => (column.type === FormItemType.PHOTO ? firstQuestionColumn + index : -1))
    .filter((index) => index >= 0);

  for (const row of rows) {
    for (const columnIndex of photoColumns) {
      const value = row[columnIndex];
      if (typeof value === "string" && value.startsWith("/uploads/")) row[columnIndex] = `${env.APP_URL}${value}`;
    }
  }

  const sheet = XLSX.utils.aoa_to_sheet([header, ...rows], { cellDates: true, dateNF: "yyyy-mm-dd hh:mm" });

  rows.forEach((row, rowIndex) => {
    for (const columnIndex of photoColumns) {
      const value = row[columnIndex];
      const cell = sheet[XLSX.utils.encode_cell({ r: rowIndex + 1, c: columnIndex })];
      if (cell && typeof value === "string" && value.startsWith("http")) cell.l = { Target: value };
    }
  });
  sheet["!cols"] = header.map((title, index) => ({ wch: index === 0 ? 5 : Math.min(Math.max(String(title).length + 4, 14), 50) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Responses");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const fileName = `${safeFileName(form.title)} - responses.xlsx`;

  response.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  response.setHeader(
    "Content-Disposition",
    `attachment; filename="form-responses.xlsx"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
  );
  response.send(buffer);
});
