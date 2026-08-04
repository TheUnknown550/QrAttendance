export type ImportTargetField =
  | "fullName"
  | "firstName"
  | "surname"
  | "organizationName"
  | "attendeeType"
  | "email"
  | "phone"
  | "attendeeNumber";

export const IMPORT_TARGET_FIELDS: ImportTargetField[] = [
  "fullName",
  "firstName",
  "surname",
  "organizationName",
  "attendeeType",
  "email",
  "phone",
  "attendeeNumber",
];

const ALIASES: Record<ImportTargetField, string[]> = {
  attendeeNumber: ["number", "no", "no.", "seq", "sequence", "attendeenumber", "ลำดับ", "เลขที่"],
  email: ["email", "emailaddress", "e-mail", "mail", "อีเมล", "อีเมล์", "อีเมลล์"],
  phone: [
    "phone",
    "phonenumber",
    "tel",
    "telephone",
    "mobile",
    "cell",
    "cellphone",
    "contactnumber",
    "เบอร์โทร",
    "เบอร์โทรศัพท์",
    "โทรศัพท์",
    "เบอร์",
  ],
  attendeeType: ["type", "attendeetype", "category", "role", "ticket type", "ประเภท", "กลุ่ม"],
  organizationName: [
    "organization",
    "organisation",
    "company",
    "department",
    "dept",
    "affiliation",
    "หน่วยงาน",
    "องค์กร",
    "บริษัท",
    "สังกัด",
  ],
  surname: ["surname", "lastname", "familyname", "นามสกุล"],
  firstName: ["firstname", "givenname", "ชื่อต้น", "ชื่อจริง"],
  fullName: [
    "name",
    "fullname",
    "attendeename",
    "ชื่อ",
    "ชื่อสกุล",
    "ชื่อ-สกุล",
    "ชื่อนามสกุล",
    "ชื่อ-นามสกุล",
  ],
};

// Prefer more specific fields before the generic combined-name fallback.
const MATCH_PRIORITY: ImportTargetField[] = [
  "email",
  "phone",
  "attendeeNumber",
  "attendeeType",
  "organizationName",
  "surname",
  "firstName",
  "fullName",
];

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\s\-_./]+/g, "")
    .trim();
}

export function suggestColumnMapping(headers: string[]) {
  const normalizedHeaders = headers.map((header) => normalizeHeader(header));
  const mapping: Partial<Record<ImportTargetField, number>> = {};
  const claimedColumns = new Set<number>();

  for (const field of MATCH_PRIORITY) {
    const aliases = ALIASES[field].map((alias) => normalizeHeader(alias));

    let bestColumnIndex: number | null = null;

    for (let columnIndex = 0; columnIndex < normalizedHeaders.length; columnIndex += 1) {
      if (claimedColumns.has(columnIndex)) {
        continue;
      }

      const header = normalizedHeaders[columnIndex];
      if (!header) {
        continue;
      }

      const isMatch = aliases.some((alias) => {
        if (header === alias) {
          return true;
        }

        // Substring containment is only reliable for longer aliases; short ones
        // (e.g. "no") risk false positives against unrelated headers.
        if (alias.length <= 3 || header.length <= 3) {
          return false;
        }

        return header.includes(alias) || alias.includes(header);
      });

      if (isMatch) {
        bestColumnIndex = columnIndex;
        break;
      }
    }

    // If we already have separate first/surname columns, don't also suggest a combined fullName column.
    if (field === "fullName" && (mapping.firstName !== undefined || mapping.surname !== undefined)) {
      continue;
    }

    if (bestColumnIndex !== null) {
      mapping[field] = bestColumnIndex;
      claimedColumns.add(bestColumnIndex);
    }
  }

  return mapping;
}
