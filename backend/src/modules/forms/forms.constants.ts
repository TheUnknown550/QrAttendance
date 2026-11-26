import { AttendeeSystemField, FormItemType } from "@prisma/client";

/** Blocks that only display content and never collect an answer. */
export const CONTENT_ITEM_TYPES = new Set<FormItemType>([
  FormItemType.TITLE_TEXT,
  FormItemType.IMAGE,
  FormItemType.DIVIDER,
  FormItemType.SECTION,
]);

/** Question types whose answer is one or more option ids. */
export const CHOICE_ITEM_TYPES = new Set<FormItemType>([
  FormItemType.MULTIPLE_CHOICE,
  FormItemType.DROPDOWN,
  FormItemType.CHECKBOXES,
]);

export function isQuestionType(type: FormItemType) {
  return !CONTENT_ITEM_TYPES.has(type);
}

/**
 * Every attendee field has a fixed input type so its answer can always be
 * copied into the matching `attendees` column.
 */
export const SYSTEM_FIELD_TYPES: Record<AttendeeSystemField, FormItemType> = {
  FIRST_NAME: FormItemType.SHORT_TEXT,
  SURNAME: FormItemType.SHORT_TEXT,
  EMAIL: FormItemType.EMAIL,
  PHONE: FormItemType.PHONE,
  ORGANIZATION_NAME: FormItemType.SHORT_TEXT,
  ATTENDEE_TYPE: FormItemType.DROPDOWN,
  ATTENDEE_NUMBER: FormItemType.NUMBER,
  PROFILE_PHOTO: FormItemType.PHOTO,
};

/** Attendee fields that can never be removed or made optional. */
export const ALWAYS_REQUIRED_SYSTEM_FIELDS = new Set<AttendeeSystemField>([
  AttendeeSystemField.FIRST_NAME,
  AttendeeSystemField.SURNAME,
]);

const SYSTEM_FIELD_LABELS: Record<"en" | "th", Record<AttendeeSystemField, string>> = {
  en: {
    FIRST_NAME: "First name",
    SURNAME: "Surname",
    EMAIL: "Email",
    PHONE: "Phone number",
    ORGANIZATION_NAME: "Organization",
    ATTENDEE_TYPE: "Attendee type",
    ATTENDEE_NUMBER: "Attendee number",
    PROFILE_PHOTO: "Profile photo",
  },
  th: {
    FIRST_NAME: "ชื่อ",
    SURNAME: "นามสกุล",
    EMAIL: "อีเมล",
    PHONE: "เบอร์โทรศัพท์",
    ORGANIZATION_NAME: "หน่วยงาน",
    ATTENDEE_TYPE: "ประเภทผู้เข้าร่วม",
    ATTENDEE_NUMBER: "ลำดับผู้เข้าร่วม",
    PROFILE_PHOTO: "รูปโปรไฟล์",
  },
};

export function getSystemFieldLabel(field: AttendeeSystemField, language: "en" | "th" = "en") {
  return SYSTEM_FIELD_LABELS[language][field];
}

export type OrganizationRequirements = {
  requireAttendeeEmail: boolean;
  requireAttendeePhone: boolean;
  requireAttendeeNumber: boolean;
};

/** Attendee fields the organization's settings make mandatory on every form. */
export function getRequiredSystemFields(organization: OrganizationRequirements) {
  const required = new Set<AttendeeSystemField>(ALWAYS_REQUIRED_SYSTEM_FIELDS);

  if (organization.requireAttendeeEmail) required.add(AttendeeSystemField.EMAIL);
  if (organization.requireAttendeePhone) required.add(AttendeeSystemField.PHONE);
  if (organization.requireAttendeeNumber) required.add(AttendeeSystemField.ATTENDEE_NUMBER);

  return required;
}

/** Attendee fields added to a brand-new form. */
export function getDefaultSystemFields(organization: OrganizationRequirements) {
  const fields: AttendeeSystemField[] = [
    AttendeeSystemField.FIRST_NAME,
    AttendeeSystemField.SURNAME,
    AttendeeSystemField.EMAIL,
    AttendeeSystemField.PHONE,
    AttendeeSystemField.ORGANIZATION_NAME,
    AttendeeSystemField.ATTENDEE_TYPE,
  ];

  if (organization.requireAttendeeNumber) {
    fields.push(AttendeeSystemField.ATTENDEE_NUMBER);
  }

  return fields;
}
