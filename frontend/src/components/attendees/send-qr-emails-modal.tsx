import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { api, getErrorMessage, unwrapResponse } from "../../lib/api";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Input } from "../ui/input";

type SendQrEmailsResult = {
  recipientCount: number;
};

interface Props {
  open: boolean;
  onClose: () => void;
  /** Total recipients when sending to everyone (no attendeeIds). */
  totalAttendees: number;
  /** Restrict the send to specific attendees (e.g. a single attendee from their detail page). */
  attendeeIds?: string[];
  /** Overrides the button/description wording, e.g. an attendee's name for a single send. */
  recipientLabel?: string;
  onSent?: (recipientCount: number) => void;
}

export function SendQrEmailsModal({
  open,
  onClose,
  totalAttendees,
  attendeeIds,
  recipientLabel,
  onSent,
}: Props) {
  const { t } = useTranslation();
  const recipientCount = attendeeIds ? attendeeIds.length : totalAttendees;

  const sendQrEmailsSchema = z.object({
    eventName: z.string().trim().min(1, t("sendQrEmailsModal.eventNameRequired")),
    eventDate: z.string().optional(),
    eventLocation: z.string().optional(),
    message: z.string().optional(),
  });

  type SendQrEmailsValues = z.infer<typeof sendQrEmailsSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SendQrEmailsValues>({
    resolver: zodResolver(sendQrEmailsSchema),
  });

  const mutation = useMutation({
    mutationFn: async (values: SendQrEmailsValues) =>
      unwrapResponse<SendQrEmailsResult>(
        await api.post("/attendees/send-qr-emails", { ...values, attendeeIds }),
      ),
    onSuccess: (result) => {
      reset();
      onSent?.(result.recipientCount);
      onClose();
    },
  });

  useEffect(() => {
    if (open) {
      mutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const buttonLabel = recipientLabel
    ? t("sendQrEmailsModal.sendToName", { name: recipientLabel })
    : t("sendQrEmailsModal.sendToCount", { count: recipientCount });

  return (
    <Dialog onClose={onClose} open={open} title={t("sendQrEmailsModal.title")}>
      <form className="space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <p className="text-sm text-slate-500">
          {recipientLabel
            ? t("sendQrEmailsModal.descriptionSingle", { name: recipientLabel })
            : t("sendQrEmailsModal.descriptionAll")}
        </p>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-600">{t("sendQrEmailsModal.eventName")}</span>
          <Input placeholder="Product Launch Night" {...register("eventName")} />
          {errors.eventName ? <p className="mt-2 text-xs text-rose-500">{errors.eventName.message}</p> : null}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-600">{t("sendQrEmailsModal.dateOptional")}</span>
          <Input placeholder="Saturday, 12 September 2026 · 6:00 PM" {...register("eventDate")} />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-600">{t("sendQrEmailsModal.locationOptional")}</span>
          <Input placeholder="The Grand Hall, 123 Main St" {...register("eventLocation")} />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-600">{t("sendQrEmailsModal.customMessageOptional")}</span>
          <textarea
            className="w-full rounded-[8px] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-amber-500/30"
            placeholder="Doors open 30 minutes before start. Please arrive early to avoid queues."
            rows={3}
            {...register("message")}
          />
        </label>

        {mutation.isError ? (
          <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {getErrorMessage(mutation.error)}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button disabled={mutation.isPending || recipientCount === 0} icon={<Mail className="size-4" />} type="submit">
            {mutation.isPending ? t("sendQrEmailsModal.sending") : buttonLabel}
          </Button>
          <Button onClick={onClose} type="button" variant="ghost">
            {t("common.cancel")}
          </Button>
        </div>

        {recipientCount === 0 ? (
          <p className="text-xs text-slate-500">{t("sendQrEmailsModal.addAttendeesFirst")}</p>
        ) : null}
      </form>
    </Dialog>
  );
}
