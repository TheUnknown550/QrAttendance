import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, Search, Trash2, XCircle } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { api, getErrorMessage, unwrapResponse } from "../lib/api";
import { useAuth } from "../lib/auth";
import { cn, formatDate, resolveMediaUrl } from "../lib/utils";
import type { Attendee, EventSession, EventSessionDetail } from "../types/api";

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
  const { auth } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
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

        return [attendee.name, attendee.email, attendee.phone ?? ""].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        );
      })
      .map((attendee) => ({
        attendee,
        attendanceRecord: attendedById.get(attendee.id) ?? null,
      }))
      .sort((left, right) => {
        if (left.attendanceRecord && !right.attendanceRecord) {
          return -1;
        }

        if (!left.attendanceRecord && right.attendanceRecord) {
          return 1;
        }

        const byNumber = compareAttendeeNumber(left.attendee.attendeeNumber, right.attendee.attendeeNumber);
        if (byNumber !== 0) {
          return byNumber;
        }

        return left.attendee.name.localeCompare(right.attendee.name);
      });
  }, [attendedById, deferredSearch, session?.allAttendees]);

  if (!session) {
    return <Card>{sessionQuery.isError ? getErrorMessage(sessionQuery.error) : "Loading session..."}</Card>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-slate-900">Session</p>
            <h1 className="mt-2 break-words font-display text-4xl font-semibold text-slate-900">{session.title}</h1>
            <p className="mt-4 text-base leading-7 text-slate-500">
              {session.description ?? "No description set for this session."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Badge>{formatDate(session.sessionDate)}</Badge>
              <Badge>{session._count?.attendance ?? 0} attendees marked attended</Badge>
              <Badge>Created {formatDate(session.createdAt)}</Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:min-w-[220px]">
            <Link
              className="rounded-[8px] bg-[var(--color-surface-soft)] px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-white"
              to={`/app/event-series/${session.eventSeries.id}`}
            >
              Back to {session.eventSeries.name}
            </Link>
            <Button onClick={() => setIsEditing((value) => !value)} type="button" variant="secondary">
              {isEditing ? "Cancel edit" : "Edit"}
            </Button>
            <Button
              icon={<Trash2 className="size-4" />}
              onClick={() => {
                if (window.confirm(`Delete ${session.title} and all of its attendance records?`)) {
                  deleteMutation.mutate();
                }
              }}
              type="button"
              variant="danger"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
                <CalendarClock className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Details</p>
                <p className="text-sm text-slate-500">Event session overview</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Series</p>
                <p className="mt-2 font-medium text-slate-900">{session.eventSeries.name}</p>
              </div>
              <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Scheduled for</p>
                <p className="mt-2 font-medium text-slate-900">{formatDate(session.sessionDate)}</p>
              </div>
            </div>
          </Card>

          {isEditing ? (
            <Card>
              <p className="text-sm font-semibold text-slate-900">Edit session</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Update details</h2>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit((values) => updateMutation.mutate(values))}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-600">Session title</span>
                  <Input {...register("title")} />
                  {errors.title ? <p className="mt-2 text-xs text-rose-500">{errors.title.message}</p> : null}
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-600">Description</span>
                  <Input {...register("description")} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-600">Session date and time</span>
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
                  <Button type="submit">{updateMutation.isPending ? "Saving..." : "Save changes"}</Button>
                  <Button onClick={() => setIsEditing(false)} type="button" variant="ghost">
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          ) : null}
        </div>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Attendance directory</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">{session.allAttendees.length}</h2>
            </div>

            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-3.5 size-4 text-slate-400" />
              <Input
                className="pl-11"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search attendees"
                value={search}
              />
            </div>
          </div>

          {(markAttendedMutation.isError || markNotAttendedMutation.isError) && !sessionQuery.isLoading ? (
            <p className="mt-6 rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getErrorMessage(markAttendedMutation.error ?? markNotAttendedMutation.error)}
            </p>
          ) : null}

          <div className="mt-6 hidden overflow-hidden rounded-[10px] bg-[var(--color-surface-soft)] md:block">
            <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_160px_160px] border-b border-[var(--color-border)] px-5 py-3 text-xs uppercase tracking-[0.22em] text-slate-500">
              <span>Attendee</span>
              <span>Status</span>
              <span>Last update</span>
              <span className="text-right">Action</span>
            </div>

            <div className="divide-y divide-[var(--color-border)] [content-visibility:auto]">
              {attendeeRows.map(({ attendee, attendanceRecord }) => (
                <AttendeeAttendanceRow
                  attendee={attendee}
                  attendanceRecord={attendanceRecord}
                  isBusy={markAttendedMutation.isPending || markNotAttendedMutation.isPending}
                  key={attendee.id}
                  onToggle={() => {
                    if (attendanceRecord) {
                      markNotAttendedMutation.mutate(attendee.id);
                      return;
                    }

                    markAttendedMutation.mutate(attendee.id);
                  }}
                />
              ))}

              {attendeeRows.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">No attendees match the current search.</p>
              ) : null}
            </div>
          </div>

          <div className="mt-6 space-y-3 md:hidden">
            {attendeeRows.map(({ attendee, attendanceRecord }) => (
              <div key={attendee.id} className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                <div className="flex items-start gap-3">
                  <img
                    alt={attendee.name}
                    className="size-12 rounded-[8px] object-cover ring-1 ring-[var(--color-border)]"
                    src={resolveMediaUrl(attendee.profileImageUrl) ?? "https://placehold.co/120x120/f7f5f0/334155?text=QR"}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{attendee.name}</p>
                    <p className="truncate text-sm text-slate-500">{attendee.email}</p>
                    <p className="mt-2 text-xs text-slate-500">{attendee.phone ?? "No phone"}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      attendanceRecord ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600",
                    )}
                  >
                    {attendanceRecord ? "Attended" : "Not attended"}
                  </span>
                  <Button
                    disabled={markAttendedMutation.isPending || markNotAttendedMutation.isPending}
                    onClick={() => {
                      if (attendanceRecord) {
                        markNotAttendedMutation.mutate(attendee.id);
                        return;
                      }

                      markAttendedMutation.mutate(attendee.id);
                    }}
                    type="button"
                    variant={attendanceRecord ? "ghost" : "secondary"}
                  >
                    {attendanceRecord ? "Mark not attended" : "Mark attended"}
                  </Button>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  {attendanceRecord ? `Marked ${formatDate(attendanceRecord.checkedInAt)}` : "No attendance recorded yet."}
                </p>
              </div>
            ))}

            {attendeeRows.length === 0 ? (
              <p className="rounded-[8px] bg-[var(--color-surface-soft)] p-5 text-sm text-slate-500">
                No attendees match the current search.
              </p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}

function AttendeeAttendanceRow({
  attendee,
  attendanceRecord,
  isBusy,
  onToggle,
}: {
  attendee: Attendee;
  attendanceRecord: EventSessionDetail["attendance"][number] | null;
  isBusy: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_160px_160px] items-center gap-4 bg-white px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <img
          alt={attendee.name}
          className="size-12 rounded-[8px] object-cover ring-1 ring-[var(--color-border)]"
          src={resolveMediaUrl(attendee.profileImageUrl) ?? "https://placehold.co/120x120/f7f5f0/334155?text=QR"}
        />
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{attendee.name}</p>
          <p className="truncate text-sm text-slate-500">{attendee.email}</p>
          <p className="truncate text-xs text-slate-400">{attendee.phone ?? "No phone"}</p>
        </div>
      </div>

      <div>
        <span
          className={cn(
            "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
            attendanceRecord ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600",
          )}
        >
          {attendanceRecord ? "Attended" : "Not attended"}
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
          {attendanceRecord ? "Mark not attended" : "Mark attended"}
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

function compareAttendeeNumber(left: number | null | undefined, right: number | null | undefined) {
  const hasLeft = left != null;
  const hasRight = right != null;

  if (hasLeft && hasRight) {
    return left - right;
  }

  // Attendees without a number sort after those that have one.
  if (hasLeft) {
    return -1;
  }

  if (hasRight) {
    return 1;
  }

  return 0;
}

function toDateTimeLocal(value: string) {
  return new Date(value).toISOString().slice(0, 16);
}
