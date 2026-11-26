import {
  AlignLeft,
  Calendar,
  Camera,
  CheckSquare,
  ChevronDownSquare,
  CircleDot,
  Hash,
  Heading,
  Image,
  Mail,
  Minus,
  Phone,
  SeparatorHorizontal,
  Type,
  type LucideIcon,
} from "lucide-react";
import type {
  AttendeeSystemField,
  FormFont,
  FormHeaderStyle,
  FormInputStyle,
  FormItem,
  FormItemConfig,
  FormItemType,
  FormLayout,
  FormRadius,
  FormStatus,
  FormTheme,
  FormWidth,
} from "../types/api";

export const CONTENT_ITEM_TYPES: FormItemType[] = ["TITLE_TEXT", "IMAGE", "DIVIDER", "SECTION"];
export const CHOICE_ITEM_TYPES: FormItemType[] = ["MULTIPLE_CHOICE", "DROPDOWN", "CHECKBOXES"];
export const QUESTION_ITEM_TYPES: FormItemType[] = [
  "SHORT_TEXT",
  "PARAGRAPH",
  "MULTIPLE_CHOICE",
  "CHECKBOXES",
  "DROPDOWN",
  "NUMBER",
  "DATE",
  "EMAIL",
  "PHONE",
  "PHOTO",
];

export const ALL_SYSTEM_FIELDS: AttendeeSystemField[] = [
  "FIRST_NAME",
  "SURNAME",
  "EMAIL",
  "PHONE",
  "ORGANIZATION_NAME",
  "ATTENDEE_TYPE",
  "ATTENDEE_NUMBER",
  "PROFILE_PHOTO",
];

export const SYSTEM_FIELD_TYPES: Record<AttendeeSystemField, FormItemType> = {
  FIRST_NAME: "SHORT_TEXT",
  SURNAME: "SHORT_TEXT",
  EMAIL: "EMAIL",
  PHONE: "PHONE",
  ORGANIZATION_NAME: "SHORT_TEXT",
  ATTENDEE_TYPE: "DROPDOWN",
  ATTENDEE_NUMBER: "NUMBER",
  PROFILE_PHOTO: "PHOTO",
};

export const ITEM_TYPE_ICONS: Record<FormItemType, LucideIcon> = {
  TITLE_TEXT: Heading,
  IMAGE: Image,
  DIVIDER: Minus,
  SECTION: SeparatorHorizontal,
  SHORT_TEXT: Type,
  PARAGRAPH: AlignLeft,
  MULTIPLE_CHOICE: CircleDot,
  DROPDOWN: ChevronDownSquare,
  CHECKBOXES: CheckSquare,
  NUMBER: Hash,
  DATE: Calendar,
  EMAIL: Mail,
  PHONE: Phone,
  PHOTO: Camera,
};

export const DEFAULT_FORM_ACCENT = "#d97706";
export const DEFAULT_FORM_BACKGROUND = "#fff7ed";
export const DEFAULT_FORM_CARD = "#ffffff";
export const DEFAULT_FORM_TEXT = "#1f2937";

/** Fonts with Thai glyphs (except DM Sans, which falls back to the system Thai font). */
export const FORM_FONTS: Record<FormFont, { label: string; family: string; google: string | null }> = {
  "dm-sans": { label: "DM Sans", family: '"DM Sans", "Segoe UI", "Noto Sans Thai", sans-serif', google: null },
  prompt: { label: "Prompt", family: '"Prompt", sans-serif', google: "Prompt:wght@400;500;600;700" },
  sarabun: { label: "Sarabun", family: '"Sarabun", sans-serif', google: "Sarabun:wght@400;500;600;700" },
  kanit: { label: "Kanit", family: '"Kanit", sans-serif', google: "Kanit:wght@400;500;600;700" },
  "ibm-plex-thai": {
    label: "IBM Plex Sans Thai",
    family: '"IBM Plex Sans Thai", sans-serif',
    google: "IBM+Plex+Sans+Thai:wght@400;500;600;700",
  },
  "noto-serif-thai": { label: "Noto Serif Thai", family: '"Noto Serif Thai", serif', google: "Noto+Serif+Thai:wght@400;500;600;700" },
  "chakra-petch": { label: "Chakra Petch", family: '"Chakra Petch", sans-serif', google: "Chakra+Petch:wght@400;500;600;700" },
};

export const FORM_LAYOUTS: FormLayout[] = ["cards", "single", "minimal"];
export const FORM_RADII: FormRadius[] = ["none", "small", "medium", "large"];
export const FORM_WIDTHS: FormWidth[] = ["narrow", "medium", "wide"];
export const FORM_HEADER_STYLES: FormHeaderStyle[] = ["banner", "cover", "simple"];
export const FORM_INPUT_STYLES: FormInputStyle[] = ["outline", "filled", "underline"];

export type ResolvedFormTheme = {
  accent: string;
  background: string;
  card: string;
  text: string;
  backgroundImageUrl: string | null;
  headerImageUrl: string | null;
  logoUrl: string | null;
  logoAlign: "left" | "center" | "right";
  logoSize: "small" | "medium" | "large";
  font: FormFont;
  layout: FormLayout;
  radius: FormRadius;
  width: FormWidth;
  headerStyle: FormHeaderStyle;
  headerAlign: "left" | "center";
  inputStyle: FormInputStyle;
};

/** Fills in defaults so older forms (saved with only colors) still render the same. */
export function resolveFormTheme(theme: FormTheme | null | undefined): ResolvedFormTheme {
  return {
    accent: theme?.primaryColor || DEFAULT_FORM_ACCENT,
    background: theme?.backgroundColor || DEFAULT_FORM_BACKGROUND,
    card: theme?.cardColor || DEFAULT_FORM_CARD,
    text: theme?.textColor || DEFAULT_FORM_TEXT,
    backgroundImageUrl: theme?.backgroundImageUrl ?? null,
    headerImageUrl: theme?.headerImageUrl ?? null,
    logoUrl: theme?.logoUrl ?? null,
    logoAlign: theme?.logoAlign ?? "left",
    logoSize: theme?.logoSize ?? "medium",
    font: theme?.font && theme.font in FORM_FONTS ? theme.font : "dm-sans",
    layout: theme?.layout ?? "cards",
    radius: theme?.radius ?? "medium",
    width: theme?.width ?? "medium",
    headerStyle: theme?.headerStyle ?? "banner",
    headerAlign: theme?.headerAlign ?? "left",
    inputStyle: theme?.inputStyle ?? "outline",
  };
}

function luminance(hex: string) {
  const value = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return 1;
  const [r, g, b] = [0, 2, 4].map((start) => {
    const channel = parseInt(value.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function isDarkColor(hex: string) {
  return luminance(hex) < 0.35;
}

/** Black or white, whichever reads better on the given color. */
export function readableOn(hex: string) {
  return luminance(hex) > 0.45 ? "#111827" : "#ffffff";
}

export const FORM_THEME_PRESETS: Array<{ key: string; theme: FormTheme }> = [
  {
    key: "warm",
    theme: { primaryColor: "#d97706", backgroundColor: "#fff7ed", cardColor: "#ffffff", textColor: "#1f2937", font: "dm-sans", layout: "cards", radius: "medium", inputStyle: "outline", headerStyle: "banner" },
  },
  {
    key: "ocean",
    theme: { primaryColor: "#0284c7", backgroundColor: "#e0f2fe", cardColor: "#ffffff", textColor: "#0f172a", font: "prompt", layout: "cards", radius: "large", inputStyle: "filled", headerStyle: "cover" },
  },
  {
    key: "forest",
    theme: { primaryColor: "#15803d", backgroundColor: "#ecfdf5", cardColor: "#ffffff", textColor: "#14291d", font: "sarabun", layout: "single", radius: "medium", inputStyle: "outline", headerStyle: "banner" },
  },
  {
    key: "blossom",
    theme: { primaryColor: "#db2777", backgroundColor: "#fdf2f8", cardColor: "#ffffff", textColor: "#3b0a24", font: "kanit", layout: "cards", radius: "large", inputStyle: "filled", headerStyle: "cover" },
  },
  {
    key: "midnight",
    theme: { primaryColor: "#a78bfa", backgroundColor: "#0b1020", cardColor: "#151b2e", textColor: "#e5e7eb", font: "ibm-plex-thai", layout: "cards", radius: "medium", inputStyle: "filled", headerStyle: "cover" },
  },
  {
    key: "paper",
    theme: { primaryColor: "#111827", backgroundColor: "#ffffff", cardColor: "#ffffff", textColor: "#111827", font: "noto-serif-thai", layout: "minimal", radius: "none", inputStyle: "underline", headerStyle: "simple" },
  },
  {
    key: "tech",
    theme: { primaryColor: "#22d3ee", backgroundColor: "#020617", cardColor: "#0f172a", textColor: "#e2e8f0", font: "chakra-petch", layout: "single", radius: "small", inputStyle: "outline", headerStyle: "banner" },
  },
  {
    key: "sunset",
    theme: { primaryColor: "#ea580c", backgroundColor: "#fde68a", cardColor: "#fffbeb", textColor: "#431407", font: "prompt", layout: "cards", radius: "large", inputStyle: "outline", headerStyle: "cover" },
  },
];

export function isQuestion(type: FormItemType) {
  return !CONTENT_ITEM_TYPES.includes(type);
}

/** Choice questions whose options are edited in the builder (attendee type uses the org's type list). */
export function usesCustomOptions(item: Pick<FormItem, "type" | "systemField">) {
  return CHOICE_ITEM_TYPES.includes(item.type) && item.systemField !== "ATTENDEE_TYPE";
}

export function publicFormUrl(publicToken: string) {
  return `${window.location.origin}/f/${publicToken}`;
}

export const FORM_STATUS_STYLES: Record<FormStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  PUBLISHED: "bg-emerald-50 text-emerald-700",
  CLOSED: "bg-rose-50 text-rose-700",
};

/** Temporary client-side key for items and choices that are not saved yet. */
export function newKey() {
  return Math.random().toString(36).slice(2, 10);
}

export type EditorOption = {
  key: string;
  id?: string;
  label: string;
  imageUrl: string | null;
};

/** A form item while it is being edited (new items have a temporary key and no id yet). */
export type EditorItem = {
  key: string;
  id?: string;
  type: FormItemType;
  systemField: AttendeeSystemField | null;
  label: string;
  description: string;
  imageUrl: string | null;
  required: boolean;
  config: FormItemConfig;
  options: EditorOption[];
};

export function toEditorItem(item: FormItem): EditorItem {
  return {
    key: item.id,
    id: item.id,
    type: item.type,
    systemField: item.systemField,
    label: item.label ?? "",
    description: item.description ?? "",
    imageUrl: item.imageUrl,
    required: item.required,
    config: item.config ?? {},
    options: item.options.map((option) => ({ key: option.id, id: option.id, label: option.label, imageUrl: option.imageUrl })),
  };
}

export function toFormItem(item: EditorItem): FormItem {
  return {
    id: item.key,
    type: item.type,
    systemField: item.systemField,
    label: item.label || null,
    description: item.description || null,
    imageUrl: item.imageUrl,
    required: item.required,
    config: item.config,
    options: item.options.map((option) => ({ id: option.key, label: option.label, imageUrl: option.imageUrl })),
  };
}
