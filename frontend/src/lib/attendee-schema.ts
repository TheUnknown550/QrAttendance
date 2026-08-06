import { useTranslation } from "react-i18next";
import { z } from "zod";

type AttendeeFieldRequirements = {
  requireAttendeeEmail: boolean;
  requireAttendeePhone: boolean;
  requireAttendeeNumber: boolean;
};

export function useAttendeeFormSchema(organization: AttendeeFieldRequirements | undefined) {
  const { t } = useTranslation();

  const requireEmail = organization?.requireAttendeeEmail ?? false;
  const requirePhone = organization?.requireAttendeePhone ?? false;
  const requireNumber = organization?.requireAttendeeNumber ?? false;

  return z.object({
    firstName: z.string().min(1),
    surname: z.string().min(1),
    organizationName: z.string().optional(),
    attendeeType: z.string().optional(),
    email: z
      .string()
      .trim()
      .optional()
      .refine((value) => !requireEmail || Boolean(value), {
        message: t("attendees.emailRequired"),
      })
      .refine((value) => !value || z.email().safeParse(value).success, {
        message: t("attendees.invalidEmail"),
      }),
    phone: z
      .string()
      .optional()
      .refine((value) => !requirePhone || Boolean(value?.trim()), {
        message: t("attendees.phoneRequired"),
      }),
    attendeeNumber: z
      .string()
      .optional()
      .refine((value) => !value || /^\d+$/.test(value.trim()), {
        message: t("attendees.attendeeNumberWholeNumber"),
      })
      .refine((value) => !requireNumber || Boolean(value?.trim()), {
        message: t("attendees.attendeeNumberRequired"),
      }),
  });
}
