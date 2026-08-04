import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Mail, Plus, Search, Upload, Users } from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { z } from "zod";
import { BulkImportModal } from "../components/attendees/bulk-import-modal";
import { SendQrEmailsModal } from "../components/attendees/send-qr-emails-modal";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { api, getErrorMessage, unwrapResponse } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatAttendeeOrgType, resolveMediaUrl } from "../lib/utils";
import type { Attendee, PaginatedResult } from "../types/api";

function normalizeAttendeeResult(data: PaginatedResult<Attendee> | Attendee[] | undefined) {
  if (Array.isArray(data)) {
    return {
      items: data,
      pagination: {
        page: 1,
        pageSize: data.length,
        total: data.length,
        totalPages: 1,
      },
    };
  }

  return data ?? null;
}

export function AttendeesPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { auth } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [imageInputKey, setImageInputKey] = useState(0);
  const [sendQrEmailsOpen, setSendQrEmailsOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [qrEmailsToast, setQrEmailsToast] = useState("");
  const deferredSearch = useDeferredValue(search);

  const attendeeSchema = z.object({
    firstName: z.string().min(1),
    surname: z.string().min(1),
    organizationName: z.string().optional(),
    attendeeType: z.string().optional(),
    email: z.email(),
    phone: z.string().optional(),
    attendeeNumber: z
      .string()
      .optional()
      .refine((value) => !value || /^\d+$/.test(value.trim()), {
        message: t("attendees.attendeeNumberWholeNumber"),
      }),
  });

  type AttendeeFormValues = z.infer<typeof attendeeSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AttendeeFormValues>({
    resolver: zodResolver(attendeeSchema),
  });

  const attendeesQuery = useQuery({
    queryKey: ["attendees", auth?.activeOrganizationId, deferredSearch, page],
    queryFn: async () =>
      unwrapResponse<PaginatedResult<Attendee>>(
        await api.get("/attendees", {
          params: {
            search: deferredSearch || undefined,
            page,
            pageSize: 12,
          },
        }),
      ),
  });

  const mutation = useMutation({
    mutationFn: async (values: AttendeeFormValues) =>
      unwrapResponse<Attendee>(
        await api.post(
          "/attendees",
          (() => {
            const formData = new FormData();
            formData.append("firstName", values.firstName);
            formData.append("surname", values.surname);
            if (values.organizationName) {
              formData.append("organizationName", values.organizationName);
            }
            if (values.attendeeType) {
              formData.append("attendeeType", values.attendeeType);
            }
            formData.append("email", values.email);
            if (values.phone) {
              formData.append("phone", values.phone);
            }
            if (values.attendeeNumber && values.attendeeNumber.trim()) {
              formData.append("attendeeNumber", values.attendeeNumber.trim());
            }
            if (profileImageFile) {
              formData.append("profileImage", profileImageFile);
            }
            return formData;
          })(),
        ),
      ),
    onSuccess: () => {
      reset();
      setSearch("");
      setPage(1);
      setProfileImageFile(null);
      setImageInputKey((value) => value + 1);
      queryClient.invalidateQueries({ queryKey: ["attendees"] });
      queryClient.invalidateQueries({ queryKey: ["attendees-summary"] });
    },
  });

  const attendeeResult = normalizeAttendeeResult(attendeesQuery.data as PaginatedResult<Attendee> | Attendee[] | undefined);
  const attendees = attendeeResult?.items ?? [];
  const pagination = attendeeResult?.pagination;

  useEffect(() => {
    if (page > 1 && pagination && page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination]);

  useEffect(() => {
    if (!qrEmailsToast) {
      return;
    }

    const timeout = window.setTimeout(() => setQrEmailsToast(""), 4500);
    return () => window.clearTimeout(timeout);
  }, [qrEmailsToast]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
      <Card>
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
            <Users className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{t("attendees.eyebrow")}</p>
            <p className="text-sm text-slate-500">{t("attendees.createProfile")}</p>
          </div>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">{t("attendees.name")}</span>
            <Input placeholder="Alex" {...register("firstName")} />
            {errors.firstName ? <p className="mt-2 text-xs text-rose-500">{errors.firstName.message}</p> : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">{t("attendees.surname")}</span>
            <Input placeholder="Morgan" {...register("surname")} />
            {errors.surname ? <p className="mt-2 text-xs text-rose-500">{errors.surname.message}</p> : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">{t("attendees.organizationNameOptional")}</span>
            <Input placeholder="Acme Corp" {...register("organizationName")} />
            {errors.organizationName ? (
              <p className="mt-2 text-xs text-rose-500">{errors.organizationName.message}</p>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">{t("attendees.typeOfAttendeeOptional")}</span>
            <Input placeholder="Guest" {...register("attendeeType")} />
            {errors.attendeeType ? (
              <p className="mt-2 text-xs text-rose-500">{errors.attendeeType.message}</p>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">{t("auth.login.email")}</span>
            <Input placeholder="alex@example.com" {...register("email")} />
            {errors.email ? <p className="mt-2 text-xs text-rose-500">{errors.email.message}</p> : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">{t("attendees.phone")}</span>
            <Input placeholder="555-0101" {...register("phone")} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">{t("attendees.attendeeNumber")}</span>
            <Input
              inputMode="numeric"
              placeholder={t("attendees.attendeeNumberPlaceholder")}
              type="number"
              min={0}
              {...register("attendeeNumber")}
            />
            {errors.attendeeNumber ? (
              <p className="mt-2 text-xs text-rose-500">{errors.attendeeNumber.message}</p>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">{t("attendees.photo")}</span>
            <Input
              key={imageInputKey}
              accept="image/*"
              onChange={(event) => setProfileImageFile(event.target.files?.[0] ?? null)}
              type="file"
            />
            {profileImageFile ? (
              <p className="mt-2 text-xs text-slate-500">{t("attendees.selected", { name: profileImageFile.name })}</p>
            ) : null}
          </label>

          {mutation.isError ? (
            <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getErrorMessage(mutation.error)}
            </p>
          ) : null}

          <Button className="w-full" icon={<Plus className="size-4" />} type="submit">
            {mutation.isPending ? t("attendees.creating") : t("attendees.createAttendee")}
          </Button>
        </form>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">{t("attendees.directory")}</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">{pagination?.total ?? 0}</h2>
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <Button
              className="w-full sm:w-auto"
              icon={<Upload className="size-4" />}
              onClick={() => setBulkImportOpen(true)}
              type="button"
              variant="secondary"
            >
              {t("attendees.bulkImport")}
            </Button>

            <Button
              className="w-full sm:w-auto"
              icon={<Mail className="size-4" />}
              onClick={() => setSendQrEmailsOpen(true)}
              type="button"
            >
              {t("attendees.sendQrEmails")}
            </Button>

            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-3.5 size-4 text-slate-400" />
              <Input
                className="pl-11"
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder={t("attendees.searchPlaceholder")}
                value={search}
              />
            </div>
          </div>
        </div>

        {qrEmailsToast ? (
          <div className="mt-4 rounded-[8px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {qrEmailsToast}
          </div>
        ) : null}

        <SendQrEmailsModal
          onClose={() => setSendQrEmailsOpen(false)}
          onSent={(recipientCount) =>
            setQrEmailsToast(t("attendees.sendingQrCodesToast", { count: recipientCount }))
          }
          open={sendQrEmailsOpen}
          totalAttendees={pagination?.total ?? 0}
        />

        <BulkImportModal onClose={() => setBulkImportOpen(false)} open={bulkImportOpen} />

        <div className="mt-6 hidden overflow-hidden rounded-[10px] bg-[var(--color-surface-soft)] md:block">
          <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_140px] border-b border-[var(--color-border)] px-5 py-3 text-xs uppercase tracking-[0.22em] text-slate-500">
            <span>{t("session.attendee")}</span>
            <span>{t("attendees.contact")}</span>
            <span className="text-right">{t("attendees.actions")}</span>
          </div>

          <div className="divide-y divide-[var(--color-border)] [content-visibility:auto]">
            {attendeesQuery.isError ? (
              <p className="p-5 text-sm text-rose-700">{getErrorMessage(attendeesQuery.error)}</p>
            ) : null}

            {attendees.map((attendee) => (
              <div
                key={attendee.id}
                className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_140px] items-center gap-4 bg-white px-5 py-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <img
                    alt={`${attendee.firstName} ${attendee.surname}`}
                    className="size-12 rounded-[8px] object-cover ring-1 ring-[var(--color-border)]"
                    src={
                      resolveMediaUrl(attendee.profileImageUrl) ??
                      "https://placehold.co/120x120/f7f5f0/334155?text=QR"
                    }
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {attendee.attendeeNumber != null ? (
                        <span className="mr-2 inline-flex items-center rounded-[6px] bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          #{attendee.attendeeNumber}
                        </span>
                      ) : null}
                      {attendee.firstName} {attendee.surname}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {formatAttendeeOrgType(attendee.organizationName, attendee.attendeeType)}
                    </p>
                    <p className="truncate text-sm text-slate-500">{attendee.email}</p>
                  </div>
                </div>

                <div className="min-w-0 text-sm text-slate-500">
                  <p className="truncate">{attendee.phone ?? t("session.noPhone")}</p>
                  <p className="truncate text-xs uppercase tracking-[0.16em] text-slate-400">
                    {t("attendees.qrTokenReady")}
                  </p>
                </div>

                <div className="text-right">
                  <Link
                    className="inline-flex rounded-[8px] bg-[var(--color-surface-soft)] px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-white"
                    to={`/app/attendees/${attendee.id}`}
                  >
                    {t("attendees.open")}
                  </Link>
                </div>
              </div>
            ))}

            {!attendeesQuery.isError && attendees.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">{t("attendees.noAttendeesMatch")}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 space-y-3 md:hidden">
          {attendeesQuery.isError ? (
            <p className="rounded-[8px] bg-rose-50 p-5 text-sm text-rose-700">
              {getErrorMessage(attendeesQuery.error)}
            </p>
          ) : null}

          {attendees.map((attendee) => (
            <div
              key={attendee.id}
              className="rounded-[8px] bg-[var(--color-surface-soft)] p-4"
            >
              <div className="flex items-center gap-3">
                <img
                  alt={`${attendee.firstName} ${attendee.surname}`}
                  className="size-12 rounded-[8px] object-cover ring-1 ring-[var(--color-border)]"
                  src={
                    resolveMediaUrl(attendee.profileImageUrl) ??
                    "https://placehold.co/120x120/f7f5f0/334155?text=QR"
                  }
                />
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">
                    {attendee.attendeeNumber != null ? (
                      <span className="mr-2 inline-flex items-center rounded-[6px] bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        #{attendee.attendeeNumber}
                      </span>
                    ) : null}
                    {attendee.firstName} {attendee.surname}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {formatAttendeeOrgType(attendee.organizationName, attendee.attendeeType)}
                  </p>
                  <p className="truncate text-sm text-slate-500">{attendee.email}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-600">{attendee.phone ?? t("session.noPhone")}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t("attendees.qrReady")}</p>
                </div>
                <Link
                  className="inline-flex rounded-[8px] bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-[var(--color-surface-soft)]"
                  to={`/app/attendees/${attendee.id}`}
                >
                  {t("attendees.open")}
                </Link>
              </div>
            </div>
          ))}

          {!attendeesQuery.isError && attendees.length === 0 ? (
            <p className="rounded-[8px] bg-[var(--color-surface-soft)] p-5 text-sm text-slate-500">
              {t("attendees.noAttendeesMatch")}
            </p>
          ) : null}
        </div>

        {pagination && pagination.totalPages > 1 ? (
          <div className="mt-6 flex items-center justify-between gap-3 rounded-[8px] bg-[var(--color-surface-soft)] px-4 py-3">
            <p className="text-sm text-slate-500">
              {t("attendees.pageOf", { page: pagination.page, totalPages: pagination.totalPages })}
            </p>
            <div className="flex items-center gap-2">
              <Button
                disabled={pagination.page <= 1 || attendeesQuery.isFetching}
                icon={<ChevronLeft className="size-4" />}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                type="button"
                variant="ghost"
              >
                {t("attendees.previous")}
              </Button>
              <Button
                disabled={pagination.page >= pagination.totalPages || attendeesQuery.isFetching}
                icon={<ChevronRight className="size-4" />}
                onClick={() => setPage((current) => current + 1)}
                type="button"
                variant="secondary"
              >
                {t("attendees.next")}
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
