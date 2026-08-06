import multer from "multer";
import XLSX from "xlsx";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { successResponse } from "../../utils/api-response";
import { asyncHandler } from "../../utils/async-handler";
import { generateQrToken } from "../../utils/qr-token";
import { touchOrganizationActivity } from "../organizations/organizations.activity";
import { suggestColumnMapping } from "./attendees.import-columns";
import { confirmAttendeeImportSchema } from "./attendees.schemas";

const maxUploadSizeBytes = 5 * 1024 * 1024;
const maxPreviewRows = 5;

const allowedMimeTypes = new Set([
  "text/csv",
  "application/vnd.ms-excel",
  "application/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
]);

export const attendeeImportUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadSizeBytes,
  },
  fileFilter: (_request, file, callback) => {
    const looksLikeSpreadsheet =
      allowedMimeTypes.has(file.mimetype) || /\.(csv|xlsx|xls)$/i.test(file.originalname);

    if (!looksLikeSpreadsheet) {
      callback(new ApiError(400, "Only CSV or Excel (.xlsx/.xls) files are allowed"));
      return;
    }

    callback(null, true);
  },
});

function parseSpreadsheet(buffer: Buffer, originalName: string) {
  const isCsv = /\.csv$/i.test(originalName);

  // XLSX.read doesn't reliably auto-detect UTF-8 for plain-text CSV buffers
  // (no BOM => it falls back to a binary codepage and mangles non-ASCII text).
  // Decoding the buffer as UTF-8 text ourselves and parsing it as a string
  // sidesteps that; real .xlsx/.xls files are binary and must stay as buffers.
  const workbook = isCsv
    ? XLSX.read(buffer.toString("utf8"), { type: "string" })
    : XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new ApiError(400, "The uploaded file has no sheets");
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });

  const nonEmptyRows = rows.filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""));

  if (nonEmptyRows.length === 0) {
    throw new ApiError(400, "The uploaded file is empty");
  }

  const [headerRow, ...dataRows] = nonEmptyRows;
  const headers = headerRow.map((cell) => String(cell ?? "").trim());

  return { headers, rows: dataRows.map((row) => headers.map((_header, index) => String(row[index] ?? "").trim())) };
}

export const parseAttendeeImportFile = asyncHandler(async (request, response) => {
  if (!request.file) {
    throw new ApiError(400, "No file uploaded");
  }

  const { headers, rows } = parseSpreadsheet(request.file.buffer, request.file.originalname);

  if (rows.length > env.ATTENDEE_IMPORT_MAX_ROWS) {
    throw new ApiError(
      413,
      `This file has ${rows.length} rows, which exceeds the limit of ${env.ATTENDEE_IMPORT_MAX_ROWS}. Split it into smaller files.`,
    );
  }

  const suggestedMapping = suggestColumnMapping(headers);

  response.json(
    successResponse({
      headers,
      rows,
      previewRows: rows.slice(0, maxPreviewRows),
      totalRows: rows.length,
      suggestedMapping,
    }),
  );
});

function splitFullName(value: string) {
  const trimmed = value.trim();
  const firstSpaceIndex = trimmed.indexOf(" ");

  if (firstSpaceIndex === -1) {
    return { firstName: trimmed, surname: trimmed };
  }

  return {
    firstName: trimmed.slice(0, firstSpaceIndex).trim(),
    surname: trimmed.slice(firstSpaceIndex + 1).trim(),
  };
}

function cell(row: string[], columnIndex?: number) {
  if (columnIndex === undefined) {
    return "";
  }

  return (row[columnIndex] ?? "").trim();
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function registerNewAttendeeTypeLabels(organizationId: string, labels: Array<string | undefined>) {
  const uniqueLabels = Array.from(new Set(labels.filter((label): label is string => Boolean(label))));

  if (uniqueLabels.length === 0) {
    return;
  }

  const existing = await prisma.attendeeType.findMany({
    where: { organizationId },
    select: { label: true },
  });
  const existingLower = new Set(existing.map((type) => type.label.toLowerCase()));
  const newLabels = uniqueLabels.filter((label) => !existingLower.has(label.toLowerCase()));

  if (newLabels.length === 0) {
    return;
  }

  await prisma.attendeeType.createMany({
    data: newLabels.map((label) => ({ organizationId, label })),
    skipDuplicates: true,
  });
}

export const confirmAttendeeImport = asyncHandler(async (request, response) => {
  const organizationId = request.auth!.organizationId as string;
  const body = confirmAttendeeImportSchema.parse(request.body);
  const { mapping, rows } = body;

  if (mapping.fullName === undefined && mapping.firstName === undefined) {
    throw new ApiError(400, "Map a Name column (either a combined full name, or a first name) before importing");
  }

  if (rows.length > env.ATTENDEE_IMPORT_MAX_ROWS) {
    throw new ApiError(
      413,
      `This file has ${rows.length} rows, which exceeds the limit of ${env.ATTENDEE_IMPORT_MAX_ROWS}.`,
    );
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      requireAttendeeEmail: true,
      requireAttendeePhone: true,
      requireAttendeeNumber: true,
    },
  });

  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  const existingAttendees = await prisma.attendee.findMany({
    where: { organizationId, deletedAt: null },
    select: { firstName: true, surname: true },
  });
  const existingNames = new Set(
    existingAttendees.map((attendee) => `${attendee.firstName}|${attendee.surname}`.toLowerCase()),
  );

  const skipped: Array<{ row: number; reason: string }> = [];
  const seenNamesInFile = new Set<string>();
  const toCreate: Array<{
    organizationId: string;
    firstName: string;
    surname: string;
    organizationName: string | undefined;
    attendeeType: string | undefined;
    email: string | undefined;
    phone: string | undefined;
    attendeeNumber: number | undefined;
    qrToken: string;
  }> = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // +1 for 1-indexing, +1 for the header row
    const rawEmail = cell(row, mapping.email).toLowerCase();
    const email = rawEmail || undefined;

    if (!email && organization.requireAttendeeEmail) {
      skipped.push({ row: rowNumber, reason: "Missing email" });
      return;
    }

    if (email && !emailPattern.test(email)) {
      skipped.push({ row: rowNumber, reason: `Invalid email: ${email}` });
      return;
    }

    const phone = cell(row, mapping.phone) || undefined;

    if (!phone && organization.requireAttendeePhone) {
      skipped.push({ row: rowNumber, reason: "Missing phone" });
      return;
    }

    let firstName = "";
    let surname = "";

    if (mapping.firstName !== undefined) {
      firstName = cell(row, mapping.firstName);
      surname = mapping.surname !== undefined ? cell(row, mapping.surname) : firstName;
    } else {
      const split = splitFullName(cell(row, mapping.fullName));
      firstName = split.firstName;
      surname = split.surname;
    }

    if (!firstName) {
      skipped.push({ row: rowNumber, reason: "Missing name" });
      return;
    }

    const nameKey = `${firstName}|${surname || firstName}`.toLowerCase();

    if (existingNames.has(nameKey)) {
      skipped.push({ row: rowNumber, reason: `Duplicate name (already an attendee): ${firstName} ${surname}` });
      return;
    }

    if (seenNamesInFile.has(nameKey)) {
      skipped.push({ row: rowNumber, reason: `Duplicate name within file: ${firstName} ${surname}` });
      return;
    }

    seenNamesInFile.add(nameKey);

    const attendeeNumberRaw = cell(row, mapping.attendeeNumber);
    const parsedAttendeeNumber = attendeeNumberRaw ? Number.parseInt(attendeeNumberRaw, 10) : NaN;
    const attendeeNumber = Number.isFinite(parsedAttendeeNumber) ? parsedAttendeeNumber : undefined;

    if (attendeeNumber === undefined && organization.requireAttendeeNumber) {
      skipped.push({ row: rowNumber, reason: "Missing attendee number" });
      return;
    }

    toCreate.push({
      organizationId,
      firstName,
      surname: surname || firstName,
      organizationName: cell(row, mapping.organizationName) || undefined,
      attendeeType: cell(row, mapping.attendeeType) || undefined,
      email,
      phone,
      attendeeNumber,
      qrToken: generateQrToken(),
    });
  });

  if (toCreate.length > 0) {
    await prisma.attendee.createMany({
      data: toCreate,
    });

    await registerNewAttendeeTypeLabels(
      organizationId,
      toCreate.map((attendee) => attendee.attendeeType),
    );

    await touchOrganizationActivity(organizationId);
  }

  response.json(
    successResponse({
      created: toCreate.length,
      skippedCount: skipped.length,
      skipped: skipped.slice(0, 50),
    }),
  );
});
