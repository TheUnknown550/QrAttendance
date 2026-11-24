import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarClock,
  CheckCircle2,
  Radio,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { PhotoCaptureOverlay } from "../components/scanner/photo-capture-overlay";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { api, getErrorMessage, unwrapResponse } from "../lib/api";
import { useAuth } from "../lib/auth";
import { cn, formatAttendeeOrgType, formatDate, resolveMediaUrl } from "../lib/utils";
import type { Attendee, EventSeriesSettings, EventSession, EventSessionDetail } from "../types/api";

type SortField = "name" | "status" | "updatedAt";
type SortDirection = "asc" | "desc";

function SortableHeaderButton({
  active,
  direction,
  label,
  onClick,
}: {
  active: boolean;
  direction: SortDirection;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex items-center gap-1 transition hover:text-slate-700",
        active ? "text-slate-700" : "text-slate-500",
      )}
      onClick={onClick}
      type="button"
    >
      {label}
      {active ? (
        direction === "asc" ? (
          <ArrowUp className="size-3" />
        ) : (
          <ArrowDown className="size-3" />
        )
      ) : (
        <ArrowUpDown className="size-3 opacity-40" />
      )}
    </button>
  );
}

function attendeeTooltip(
  t: (key: string, options?: Record<string, unknown>) => string,
  attendee: Attendee,
  settings: EventSeriesSettings,
) {
  const lines = [`${attendee.firstName} ${attendee.surname}`];

  if (settings.showOrganizationName && attendee.organizationName) {
    lines.push(attendee.organizationName);
  }

  if (settings.showAttendeeType && attendee.attendeeType) {
    lines.push(attendee.attendeeType);
  }

  if (settings.showEmail) {
    lines.push(attendee.email ?? t("scanner.noEmail"));
  }

  if (settings.showPhone) {
    lines.push(attendee.phone ?? t("session.noPhone"));
  }

  if (settings.showAttendeeNumber && attendee.attendeeNumber != null) {
    lines.push(t("scanner.ticketNumber", { number: attendee.attendeeNumber }));
  }

  return lines.join("\n");
}

function AttendeeRosterMeta({ attendee, settings }: { attendee: Attendee; settings: EventSeriesSettings }) {
  const { t } = useTranslation();
  const orgAndType = formatAttendeeOrgType(
    settings.showOrganizationName ? attendee.organizationName : undefined,
    settings.showAttendeeType ? attendee.attendeeType : undefined,
  );

  return (
    <>
      {settings.showOrganizationName || settings.showAttendeeType ? (
        <p className="truncate text-xs text-slate-500">{orgAndType}</p>
      ) : null}
      {settings.showEmail ? (
        <p className="truncate text-sm text-slate-500">{attendee.email ?? t("scanner.noEmail")}</p>
      ) : null}
      {settings.showPhone ? (
        <p className="truncate text-xs text-slate-500">{attendee.phone ?? t("session.noPhone")}</p>
      ) : null}
      {settings.showAttendeeNumber && attendee.attendeeNumber != null ? (
        <p className="truncate text-xs text-slate-500">{t("scanner.ticketNumber", { number: attendee.attendeeNumber })}</p>
      ) : null}
    </>
  );
}

const sessionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  sessionDate: z.string().min(1),
});

type SessionFormValues = z.infer<typeof sessionSchema>;

export function SessionDetailPage() {
  const { id = "", sessionId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { auth } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sort, setSort] = useState<{ field: SortField; direction: SortDirection }>({
    field: "name",
    direction: "asc",
  });
  const [photoCaptureAttendeeId, setPhotoCaptureAttendeeId] = useState<string | null>(null);

  function toggleSort(field: SortField) {
    setSort((current) =>
      current.field === field
        ? { field, direction: current.direction === "asc" ? "desc" : "asc" }
        : { field, direction: "asc" },
    );
  }
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
  });

  const sessionQuery = useQuery({
    queryKey: ["event-session", auth?.activeOrganizationId, id, sessionId],
    queryFn: async () => unwrapResponse<EventSessionDetail>(await api.get(`/event-series/${id}/sessions/${sessionId}`)),
  });

  const session = sessionQuery.data;

  useEffect(() => {
    if (!session) {
      return;
    }

    reset({
      title: session.title,
      description: session.description ?? "",
      sessionDate: toDateTimeLocal(session.sessionDate),
    });
  }, [reset, session]);

  const updateMutation = useMutation({
    mutationFn: async (values: SessionFormValues) =>
      unwrapResponse<EventSession>(
        await api.patch(`/event-series/${id}/sessions/${sessionId}`, {
          ...values,
          sessionDate: new Date(values.sessionDate).toISOString(),
        }),
      ),
    onSuccess: () => {
      setIsEditing(false);
      invalidateSessionQueries(queryClient, auth?.activeOrganizationId, id, sessionId);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => unwrapResponse(await api.delete(`/event-series/${id}/sessions/${sessionId}`)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-series", auth?.activeOrganizationId] });
      queryClient.invalidateQueries({ queryKey: ["event-series", auth?.activeOrganizationId, id] });
      navigate(`/app/event-series/${id}`);
    },
  });

  const markAttendedMutation = useMutation({
    mutationFn: async (attendeeId: string) =>
      unwrapResponse(
        await api.post(`/event-series/${id}/sessions/${sessionId}/attendance`, {
          attendeeId,
        }),
      ),
    onSuccess: () => {
      invalidateSessionQueries(queryClient, auth?.activeOrganizationId, id, sessionId);
    },
  });

  const markAttendedWithPhotoMutation = useMutation({
    mutationFn: async ({ attendeeId, photo }: { attendeeId: string; photo: Blob }) => {
      const formData = new FormData();
      formData.append("attendeeId", attendeeId);
      formData.append("photo", photo, "check-in.jpg");
      return unwrapResponse(
        await api.post(`/event-series/${id}/sessions/${sessionId}/attendance`, formData),
      );
    },
    onSuccess: () => {
      setPhotoCaptureAttendeeId(null);
      invalidateSessionQueries(queryClient, auth?.activeOrganizationId, id, sessionId);
    },
  });

  function handleMarkAttended(attendeeId: string) {
    if (session?.eventSeries.requireCheckInPhoto) {
      markAttendedWithPhotoMutation.reset();
      setPhotoCaptureAttendeeId(attendeeId);
      return;
    }

    markAttendedMutation.mutate(attendeeId);
  }

  const markNotAttendedMutation = useMutation({
    mutationFn: async (attendeeId: string) =>
      unwrapResponse(await api.delete(`/event-series/${id}/sessions/${sessionId}/attendance/${attendeeId}`)),
    onSuccess: () => {
      invalidateSessionQueries(queryClient, auth?.activeOrganizationId, id, sessionId);
    },
  });

  const attendedById = useMemo(
    () =>
      new Map(
        (session?.attendance ?? []).map((record) => [record.attendeeId, record]),
      ),
    [session?.attendance],
  );

  const attendeeRows = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();
    const attendees = session?.allAttendees ?? [];

    return attendees
      .filter((attendee) => {
        if (!normalizedSearch) {
          return true;
        }

        return [
          attendee.firstName,
          attendee.surname,
          attendee.organizationName ?? "",
          attendee.attendeeType ?? "",
          attendee.email ?? "",
          attendee.phone ?? "",
        ].some((value) => value.toLowerCase().includes(normalizedSearch));
      })
      .map((attendee) => ({
        attendee,
        attendanceRecord: attendedById.get(attendee.id) ?? null,
      }))
      .sort((left, right) => {
        const directionMultiplier = sort.direction === "asc" ? 1 : -1;

        if (sort.field === "name") {
          const byFirstName = left.attendee.firstName.localeCompare(right.attendee.firstName);
          if (byFirstName !== 0) {
            return byFirstName * directionMultiplier;
          }
          return left.attendee.surname.localeCompare(right.attendee.surname) * directionMultiplier;
        }

        if (sort.field === "status") {
          const leftAttended = left.attendanceRecord ? 1 : 0;
          const rightAttended = right.attendanceRecord ? 1 : 0;
          if (leftAttended !== rightAttended) {
            return (rightAttended - leftAttended) * directionMultiplier;
          }
        } else {
          const leftTime = left.attendanceRecord ? new Date(left.attendanceRecord.checkedInAt).getTime() : null;
          const rightTime = right.attendanceRecord ? new Date(right.attendanceRecord.checkedInAt).getTime() : null;
          if (leftTime == null && rightTime != null) {
            return 1;
          }
          if (leftTime != null && rightTime == null) {
            return -1;
          }
          if (leftTime != null && rightTime != null && leftTime !== rightTime) {
            return (leftTime - rightTime) * directionMultiplier;
          }
        }

        const byFirstName = left.attendee.firstName.localeCompare(right.attendee.firstName);
        if (byFirstName !== 0) {
          return byFirstName;
        }
        return left.attendee.surname.localeCompare(right.attendee.surname);
      });
  }, [attendedById, deferredSearch, session?.allAttendees, sort]);

  if (!session) {
    return <Card>{sessionQuery.isError ? getErrorMessage(sessionQuery.error) : t("session.loading")}</Card>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-slate-900">{t("session.eyebrow")}</p>
            <h1 className="mt-2 break-words font-display text-4xl font-semibold text-slate-900">{session.title}</h1>
            <p className="mt-4 text-base leading-7 text-slate-500">
              {session.description ?? t("session.noDescription")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Badge>{formatDate(session.sessionDate)}</Badge>
              <Badge>{t("session.attendeesMarkedAttended", { count: session._count?.attendance ?? 0 })}</Badge>
              <Badge>{t("session.created", { date: formatDate(session.createdAt) })}</Badge>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
                <CalendarClock className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{t("eventSeries.detail.details")}</p>
                <p className="text-sm text-slate-500">{t("session.overview")}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{t("eventSeries.detail.eyebrow")}</p>
                <p className="mt-2 font-medium text-slate-900">{session.eventSeries.name}</p>
              </div>
              <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{t("session.scheduledFor")}</p>
                <p className="mt-2 font-medium text-slate-900">{formatDate(session.sessionDate)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:min-w-[220px]">
            <Link
              className="rounded-[8px] bg-[var(--color-surface-soft)] px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-white"
              to={`/app/event-series/${session.eventSeries.id}`}
            >
              {t("session.backTo", { name: session.eventSeries.name })}
            </Link>
            <Link to={`/app/scanner?session=${sessionId}`}>
              <Button className="w-full" icon={<Radio className="size-4" />}>
                {t("appShell.openScanner")}
              </Button>
            </Link>
            <Button onClick={() => setIsEditing((value) => !value)} type="button" variant="secondary">
              {isEditing ? t("session.cancelEdit") : t("common.edit")}
            </Button>
            <Button
              icon={<Trash2 className="size-4" />}
              onClick={() => {
                if (window.confirm(t("session.confirmDelete", { title: session.title }))) {
                  deleteMutation.mutate();
                }
              }}
              type="button"
              variant="danger"
            >
              {deleteMutation.isPending ? t("eventSeries.detail.deleting") : t("common.delete")}
            </Button>
          </div>
        </div>
      </Card>

      {isEditing ? (
        <Card>
          <p className="text-sm font-semibold text-slate-900">{t("session.editSession")}</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{t("session.updateDetails")}</h2>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit((values) => updateMutation.mutate(values))}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">{t("eventSeries.sessionTitle")}</span>
              <Input autoComplete="off" {...register("title")} />
              {errors.title ? <p className="mt-2 text-xs text-rose-500">{errors.title.message}</p> : null}
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">{t("eventSeries.description")}</span>
              <Input {...register("description")} />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">{t("eventSeries.sessionDateAndTime")}</span>
              <Input type="datetime-local" {...register("sessionDate")} />
              {errors.sessionDate ? <p className="mt-2 text-xs text-rose-500">{errors.sessionDate.message}</p> : null}
            </label>
            {updateMutation.isError ? (
              <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {getErrorMessage(updateMutation.error)}
              </p>
            ) : null}
            {deleteMutation.isError ? (
              <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {getErrorMessage(deleteMutation.error)}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button type="submit">{updateMutation.isPending ? t("eventSeries.detail.saving") : t("eventSeries.detail.saveChanges")}</Button>
              <Button onClick={() => setIsEditing(false)} type="button" variant="ghost">
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">{t("session.attendanceDirectory")}</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">{session.allAttendees.length}</h2>
          </div>

            <div className="flex w-full flex-wrap gap-3 sm:w-auto">
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-4 top-3.5 size-4 text-slate-400" />
                <Input
                  className="pl-11"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("session.searchAttendees")}
                  value={search}
                />
              </div>

              <Select
                className="w-full sm:w-auto"
                onChange={(event) => {
                  const [field, direction] = event.target.value.split(":") as [SortField, SortDirection];
                  setSort({ field, direction });
                }}
                value={`${sort.field}:${sort.direction}`}
              >
                <option value="name:asc">{t("session.sort.nameAsc")}</option>
                <option value="name:desc">{t("session.sort.nameDesc")}</option>
                <option value="status:asc">{t("session.sort.statusAttendedFirst")}</option>
                <option value="status:desc">{t("session.sort.statusNotAttendedFirst")}</option>
                <option value="updatedAt:desc">{t("session.sort.updatedNewestFirst")}</option>
                <option value="updatedAt:asc">{t("session.sort.updatedOldestFirst")}</option>
              </Select>
            </div>
          </div>

          {(markAttendedMutation.isError ||
            markNotAttendedMutation.isError ||
            markAttendedWithPhotoMutation.isError) &&
          !sessionQuery.isLoading ? (
            <p className="mt-6 rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getErrorMessage(
                markAttendedMutation.error ?? markNotAttendedMutation.error ?? markAttendedWithPhotoMutation.error,
              )}
            </p>
          ) : null}

          <div className="mt-6 hidden overflow-hidden rounded-[10px] bg-[var(--color-surface-soft)] md:block">
            <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_160px_160px] border-b border-[var(--color-border)] px-5 py-3 text-xs uppercase tracking-[0.22em] text-slate-500">
              <SortableHeaderButton
                active={sort.field === "name"}
                direction={sort.direction}
                label={t("session.attendee")}
                onClick={() => toggleSort("name")}
              />
              <SortableHeaderButton
                active={sort.field === "status"}
                direction={sort.direction}
                label={t("session.status")}
                onClick={() => toggleSort("status")}
              />
              <SortableHeaderButton
                active={sort.field === "updatedAt"}
                direction={sort.direction}
                label={t("session.lastUpdate")}
                onClick={() => toggleSort("updatedAt")}
              />
              <span className="text-right">{t("session.action")}</span>
            </div>

            <div className="divide-y divide-[var(--color-border)] [content-visibility:auto]">
              {attendeeRows.map(({ attendee, attendanceRecord }) => (
                <AttendeeAttendanceRow
                  attendee={attendee}
                  attendanceRecord={attendanceRecord}
                  isBusy={markAttendedMutation.isPending || markNotAttendedMutation.isPending}
                  key={attendee.id}
                  settings={session.eventSeries}
                  onToggle={() => {
                    if (attendanceRecord) {
                      markNotAttendedMutation.mutate(attendee.id);
                      return;
                    }

                    handleMarkAttended(attendee.id);
                  }}
                />
              ))}

              {attendeeRows.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">{t("session.noAttendeesMatch")}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-6 space-y-3 md:hidden">
            {attendeeRows.map(({ attendee, attendanceRecord }) => (
              <div key={attendee.id} className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                <div className="flex items-start gap-3" title={attendeeTooltip(t, attendee, session.eventSeries)}>
                  <img
                    alt={`${attendee.firstName} ${attendee.surname}`}
                    className="size-12 rounded-[8px] object-cover ring-1 ring-[var(--color-border)]"
                    src={resolveMediaUrl(attendee.profileImageUrl) ?? "https://placehold.co/120x120/f7f5f0/334155?text=QR"}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{attendee.firstName} {attendee.surname}</p>
                    <AttendeeRosterMeta attendee={attendee} settings={session.eventSeries} />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      attendanceRecord ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600",
                    )}
                  >
                    {attendanceRecord ? t("session.attended") : t("session.notAttended")}
                  </span>
                  <Button
                    disabled={markAttendedMutation.isPending || markNotAttendedMutation.isPending}
                    onClick={() => {
                      if (attendanceRecord) {
                        markNotAttendedMutation.mutate(attendee.id);
                        return;
                      }

                      handleMarkAttended(attendee.id);
                    }}
                    type="button"
                    variant={attendanceRecord ? "ghost" : "secondary"}
                  >
                    {attendanceRecord ? t("session.markNotAttended") : t("session.markAttended")}
                  </Button>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  {attendanceRecord ? t("session.marked", { date: formatDate(attendanceRecord.checkedInAt) }) : t("session.noAttendanceRecorded")}
                </p>
              </div>
            ))}

            {attendeeRows.length === 0 ? (
              <p className="rounded-[8px] bg-[var(--color-surface-soft)] p-5 text-sm text-slate-500">
                {t("session.noAttendeesMatch")}
              </p>
            ) : null}
          </div>
        </Card>

      {photoCaptureAttendeeId ? (
        <PhotoCaptureOverlay
          isSubmitting={markAttendedWithPhotoMutation.isPending}
          onCancel={() => setPhotoCaptureAttendeeId(null)}
          onConfirm={(photo) => markAttendedWithPhotoMutation.mutate({ attendeeId: photoCaptureAttendeeId, photo })}
          submitError={
            markAttendedWithPhotoMutation.isError ? getErrorMessage(markAttendedWithPhotoMutation.error) : ""
          }
        />
      ) : null}
    </div>
  );
}

function AttendeeAttendanceRow({
  attendee,
  attendanceRecord,
  isBusy,
  onToggle,
  settings,
}: {
  attendee: Attendee;
  attendanceRecord: EventSessionDetail["attendance"][number] | null;
  isBusy: boolean;
  onToggle: () => void;
  settings: EventSeriesSettings;
}) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_160px_160px] items-center gap-4 bg-white px-5 py-4">
      <div className="flex min-w-0 items-center gap-3" title={attendeeTooltip(t, attendee, settings)}>
        <img
          alt={`${attendee.firstName} ${attendee.surname}`}
          className="size-12 rounded-[8px] object-cover ring-1 ring-[var(--color-border)]"
          src={resolveMediaUrl(attendee.profileImageUrl) ?? "https://placehold.co/120x120/f7f5f0/334155?text=QR"}
        />
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{attendee.firstName} {attendee.surname}</p>
          <AttendeeRosterMeta attendee={attendee} settings={settings} />
        </div>
      </div>

      <div>
        <span
          className={cn(
            "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
            attendanceRecord ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600",
          )}
        >
          {attendanceRecord ? t("session.attended") : t("session.notAttended")}
        </span>
      </div>

      <p className="text-sm text-slate-500">
        {attendanceRecord ? formatDate(attendanceRecord.checkedInAt) : "-"}
      </p>

      <div className="text-right">
        <Button
          disabled={isBusy}
          icon={attendanceRecord ? <XCircle className="size-4" /> : <CheckCircle2 className="size-4" />}
          onClick={onToggle}
          type="button"
          variant={attendanceRecord ? "ghost" : "secondary"}
        >
          {attendanceRecord ? t("session.markNotAttended") : t("session.markAttended")}
        </Button>
      </div>
    </div>
  );
}

function invalidateSessionQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  activeOrganizationId: string | null | undefined,
  eventSeriesId: string,
  sessionId: string,
) {
  queryClient.invalidateQueries({ queryKey: ["event-series", activeOrganizationId] });
  queryClient.invalidateQueries({ queryKey: ["event-series", activeOrganizationId, eventSeriesId] });
  queryClient.invalidateQueries({ queryKey: ["event-session", activeOrganizationId, eventSeriesId, sessionId] });
}

function toDateTimeLocal(value: string) {
  return new Date(value).toISOString().slice(0, 16);
}
