import { AttendeeSystemField, FormItemType, FormStatus } from "@prisma/client";
import { z } from "zod";

// Only images this app stored itself may be referenced from a form.
const uploadedImageUrl = z
  .string()
  .trim()
  .max(500)
  .regex(/^\/uploads\/forms\/[a-z0-9-]+\/[a-z0-9-]+\.webp$/i, "Invalid image URL");

const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-f]{6}$/i, "Color must be a hex value like #d97706");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value ? value : null));

export const formThemeSchema = z
  .object({
    headerImageUrl: uploadedImageUrl.nullish(),
    backgroundImageUrl: uploadedImageUrl.nullish(),
    primaryColor: hexColor.nullish(),
    backgroundColor: hexColor.nullish(),
    cardColor: hexColor.nullish(),
    textColor: hexColor.nullish(),
    font: z
      .enum(["dm-sans", "prompt", "sarabun", "kanit", "ibm-plex-thai", "noto-serif-thai", "chakra-petch"])
      .nullish(),
    layout: z.enum(["cards", "single", "minimal"]).nullish(),
    radius: z.enum(["none", "small", "medium", "large"]).nullish(),
    width: z.enum(["narrow", "medium", "wide"]).nullish(),
    headerStyle: z.enum(["banner", "cover", "simple"]).nullish(),
    headerAlign: z.enum(["left", "center"]).nullish(),
    inputStyle: z.enum(["outline", "filled", "underline"]).nullish(),
  })
  .strip();

export const formSettingsSchema = z
  .object({
    confirmationMessage: z.string().trim().max(2000).nullish(),
    sendQrEmailOnSubmit: z.boolean().optional(),
    showQrOnSuccess: z.boolean().optional(),
    closesAt: z.iso.datetime({ offset: true }).nullish(),
  })
  .strip();

export const createFormSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: optionalText(5000),
  eventSeriesId: z.uuid().nullish(),
  language: z.enum(["en", "th"]).optional(),
});

export const updateFormSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: optionalText(5000).optional(),
  eventSeriesId: z.uuid().nullish(),
  status: z.enum(FormStatus).optional(),
  theme: formThemeSchema.optional(),
  settings: formSettingsSchema.optional(),
});

const itemConfigSchema = z
  .object({
    placeholder: z.string().trim().max(200).nullish(),
    min: z.number().nullish(),
    max: z.number().nullish(),
    imageSize: z.enum(["small", "medium", "full"]).nullish(),
    align: z.enum(["left", "center"]).nullish(),
    width: z.enum(["full", "half"]).nullish(),
    columns: z.union([z.literal(1), z.literal(2), z.literal(3)]).nullish(),
  })
  .strip();

const itemOptionSchema = z.object({
  id: z.uuid().optional(),
  label: z.string().trim().min(1).max(300),
  imageUrl: uploadedImageUrl.nullish(),
});

export const syncItemSchema = z.object({
  id: z.uuid().optional(),
  type: z.enum(FormItemType),
  systemField: z.enum(AttendeeSystemField).nullish(),
  label: optionalText(500),
  description: optionalText(5000),
  imageUrl: uploadedImageUrl.nullish(),
  required: z.boolean().default(false),
  config: itemConfigSchema.nullish(),
  options: z.array(itemOptionSchema).max(100).default([]),
});

export const syncItemsSchema = z.object({
  items: z.array(syncItemSchema).min(1).max(200),
});

export type SyncItemInput = z.infer<typeof syncItemSchema>;

const answerValueSchema = z.union([
  z.string().max(5000),
  z.number(),
  z.array(z.string().max(100)).max(100),
  z.null(),
]);

export const submitFormSchema = z.object({
  answers: z.record(z.string(), answerValueSchema),
});

export type FormTheme = z.infer<typeof formThemeSchema>;
export type FormSettings = z.infer<typeof formSettingsSchema>;
