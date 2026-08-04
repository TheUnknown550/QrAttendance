import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Pencil, Plus, QrCode, TableProperties, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { api, getErrorMessage, unwrapResponse } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatDate } from "../lib/utils";
import type { EventSeries, EventSeriesSettings, EventSession } from "../types/api";

const seriesSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const sessionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  sessionDate: z.string().min(1),
});

type SeriesValues = z.infer<typeof seriesSchema>;
type SessionFormValues = z.infer<typeof sessionSchema>;

const SETTINGS_TOGGLES: Array<{
  key: keyof EventSeriesSettings;
  label: string;
  description: string;
}> = [
  {
    key: "requireCheckInApproval",
    label: "Require approval before check-in",
    description: "Scanning shows the attendee's info and waits for a tap on \"Check in\" to confirm. Turn off to check attendees in the instant their QR code is scanned.",
  },
  {
    key: "showOrganizationName",
    label: "Show organization name",
    description: "Display the attendee's organization on the scanner and session roster.",
  },
  {
    key: "showAttendeeType",
    label: "Show type of attendee",
    description: "Display the attendee's type (e.g. VIP, Guest) on the scanner and session roster.",
  },
  {
    key: "showPhone",
    label: "Show phone number",
    description: "Display the attendee's phone number on the scanner and session roster.",
  },
  {
    key: "showEmail",
    label: "Show email address",
    description: "Display the attendee's email on the scanner and session roster.",
  },
  {
    key: "showAttendeeNumber",
    label: "Show attendee number",
    description: "Display the attendee's ticket number badge on the scanner and session roster.",
  },
];

export function EventSeriesDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { auth } = useAuth();

  const seriesQuery = useQuery({
    queryKey: ["event-series", auth?.activeOrganizationId, id],
    queryFn: async () => unwrapResponse<EventSeries>(await api.get(`/event-series/${id}`)),
  });

  const series = seriesQuery.data;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SeriesValues>({
    resolver: zodResolver(seriesSchema),
  });

  const [settings, setSettings] = useState<EventSeriesSettings | null>(null);

  useEffect(() => {
    if (!series) {
      return;
    }

    reset({
      name: series.name,
      description: series.description ?? "",
      startDate: series.startDate ? toDateTimeLocal(series.startDate) : "",
      endDate: series.endDate ? toDateTimeLocal(series.endDate) : "",
    });

    setSettings({
      requireCheckInApproval: series.requireCheckInApproval,
      showOrganizationName: series.showOrganizationName,
      showAttendeeType: series.showAttendeeType,
      showPhone: series.showPhone,
      showEmail: series.showEmail,
      showAttendeeNumber: series.showAttendeeNumber,
    });
  }, [reset, series]);

  const updateMutation = useMutation({
    mutationFn: async (values: SeriesValues) =>
      unwrapResponse<EventSeries>(
        await api.patch(`/event-series/${id}`, {
          ...values,
          startDate: values.startDate ? new Date(values.startDate).toISOString() : "",
          endDate: values.endDate ? new Date(values.endDate).toISOString() : "",
        }),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-series", auth?.activeOrganizationId] });
      queryClient.invalidateQueries({ queryKey: ["event-series", auth?.activeOrganizationId, id] });
    },
  });

  const settingsMutation = useMutation({
    mutationFn: async () => {
      if (!series || !settings) {
        throw new Error("Event series not loaded");
      }

      return unwrapResponse<EventSeries>(
        await api.patch(`/event-series/${id}`, {
          name: series.name,
          description: series.description ?? "",
          startDate: series.startDate ?? "",
          endDate: series.endDate ?? "",
          ...settings,
        }),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-series", auth?.activeOrganizationId] });
      queryClient.invalidateQueries({ queryKey: ["event-series", auth?.activeOrganizationId, id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => unwrapResponse(await api.delete(`/event-series/${id}`)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-series", auth?.activeOrganizationId] });
      navigate("/app/event-series");
    },
  });

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const sessionForm = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
  });
  const editSessionForm = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
  });

  const createSessionMutation = useMutation({
    mutationFn: async (values: SessionFormValues) =>
      unwrapResponse<EventSession>(
        await api.post(`/event-series/${id}/sessions`, {
          ...values,
          sessionDate: new Date(values.sessionDate).toISOString(),
        }),
      ),
    onSuccess: () => {
      sessionForm.reset();
      queryClient.invalidateQueries({ queryKey: ["event-series", auth?.activeOrganizationId, id] });
      queryClient.invalidateQueries({ queryKey: ["event-series", auth?.activeOrganizationId] });
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ sessionId, values }: { sessionId: string; values: SessionFormValues }) =>
      unwrapResponse<EventSession>(
        await api.patch(`/event-series/${id}/sessions/${sessionId}`, {
          ...values,
          sessionDate: new Date(values.sessionDate).toISOString(),
        }),
      ),
    onSuccess: () => {
      setEditingSessionId(null);
      queryClient.invalidateQueries({ queryKey: ["event-series", auth?.activeOrganizationId, id] });
      queryClient.invalidateQueries({ queryKey: ["event-series", auth?.activeOrganizationId] });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) =>
      unwrapResponse(await api.delete(`/event-series/${id}/sessions/${sessionId}`)),
    onSuccess: () => {
      if (editingSessionId) {
        setEditingSessionId(null);
      }
      queryClient.invalidateQueries({ queryKey: ["event-series", auth?.activeOrganizationId, id] });
      queryClient.invalidateQueries({ queryKey: ["event-series", auth?.activeOrganizationId] });
    },
  });

  if (!series) {
    return <Card>Loading event series...</Card>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-slate-900">Series</p>
            <h1 className="mt-2 break-words font-display text-4xl font-semibold text-slate-900">{series.name}</h1>
            <p className="mt-4 text-base leading-7 text-slate-500">
              {series.description ?? "No description set for this program."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Badge>{series.sessions.length} sessions</Badge>
              <Badge>{series.startDate ? formatDate(series.startDate) : "No start date"}</Badge>
              <Badge>{series.endDate ? formatDate(series.endDate) : "No end date"}</Badge>
            </div>
          </div>

          <div className="grid gap-3">
            <Link
              className="rounded-[8px] bg-[var(--color-surface-soft)] px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-white"
              to={`/app/reports/event-series/${series.id}`}
            >
              Report
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <Card>
          <form className="space-y-4" onSubmit={handleSubmit((values) => updateMutation.mutate(values))}>
            <div>
              <p className="text-sm font-semibold text-slate-900">Edit series</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Details</h2>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Series name</span>
              <Input {...register("name")} />
              {errors.name ? <p className="mt-2 text-xs text-rose-500">{errors.name.message}</p> : null}
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Description</span>
              <Input {...register("description")} />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Start date</span>
                <Input type="datetime-local" {...register("startDate")} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">End date</span>
                <Input type="datetime-local" {...register("endDate")} />
              </label>
            </div>
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
              <Button
                onClick={() => {
                  if (window.confirm(`Delete ${series.name} and all its sessions and attendance records?`)) {
                    deleteMutation.mutate();
                  }
                }}
                type="button"
                variant="danger"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete series"}
              </Button>
            </div>
          </form>
          <div className="mt-6 space-y-4">
            {[
              {
                title: "Scanner-ready",
                description: "Use any session in this series with the live browser QR scanner.",
                icon: QrCode,
              },
              {
                title: "Session-based attendance",
                description: "Every check-in is stored per attendee and per event session.",
                icon: CalendarClock,
              },
              {
                title: "Report export",
                description: "Export attendance percentage and counts as CSV any time.",
                icon: TableProperties,
              },
            ].map((item) => (
              <div key={item.title} className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
                    <item.icon className="size-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">{item.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Sessions</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Schedule</h2>
            </div>
            <Link className="text-sm font-medium text-amber-700 hover:text-amber-800" to="/app/scanner">
              Open scanner
            </Link>
          </div>

          <form
            className="mt-6 grid gap-4 rounded-[8px] border border-[var(--color-border)] p-4 md:grid-cols-[1fr_1fr_auto]"
            onSubmit={sessionForm.handleSubmit((values) => createSessionMutation.mutate(values))}
          >
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Session title</span>
              <Input placeholder="Session 1" {...sessionForm.register("title")} />
              {sessionForm.formState.errors.title ? (
                <p className="mt-2 text-xs text-rose-500">{sessionForm.formState.errors.title.message}</p>
              ) : null}
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Date and time</span>
              <Input type="datetime-local" {...sessionForm.register("sessionDate")} />
              {sessionForm.formState.errors.sessionDate ? (
                <p className="mt-2 text-xs text-rose-500">{sessionForm.formState.errors.sessionDate.message}</p>
              ) : null}
            </label>
            <div className="flex items-end">
              <Button className="w-full md:w-auto" icon={<Plus className="size-4" />} type="submit">
                {createSessionMutation.isPending ? "Adding..." : "Add session"}
              </Button>
            </div>
            <label className="block md:col-span-3">
              <span className="mb-2 block text-sm font-medium text-slate-600">Description (optional)</span>
              <Input placeholder="Intro to AI workflows" {...sessionForm.register("description")} />
            </label>
            {createSessionMutation.isError ? (
              <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700 md:col-span-3">
                {getErrorMessage(createSessionMutation.error)}
              </p>
            ) : null}
          </form>

          <div className="mt-6 space-y-3">
            {series.sessions.map((session) => (
              <div key={session.id} className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                {editingSessionId === session.id ? (
                  <form
                    className="space-y-4"
                    onSubmit={editSessionForm.handleSubmit((values) =>
                      updateSessionMutation.mutate({ sessionId: session.id, values }),
                    )}
                  >
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-600">Session title</span>
                      <Input {...editSessionForm.register("title")} />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-600">Description</span>
                      <Input {...editSessionForm.register("description")} />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-600">Session date and time</span>
                      <Input type="datetime-local" {...editSessionForm.register("sessionDate")} />
                    </label>
                    {updateSessionMutation.isError ? (
                      <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {getErrorMessage(updateSessionMutation.error)}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-3">
                      <Button type="submit">
                        {updateSessionMutation.isPending ? "Saving..." : "Save session"}
                      </Button>
                      <Button
                        icon={<X className="size-4" />}
                        onClick={() => setEditingSessionId(null)}
                        type="button"
                        variant="ghost"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <Link className="min-w-0 flex-1" to={`/app/event-series/${series.id}/sessions/${session.id}`}>
                      <h3 className="break-words font-semibold text-slate-900">{session.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {session.description ?? "No description set."}
                      </p>
                    </Link>
                    <div className="text-right text-sm text-slate-600">
                      <p>{formatDate(session.sessionDate)}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                        {session._count?.attendance ?? 0} check-ins
                      </p>
                    </div>
                  </div>
                )}

                {editingSessionId !== session.id ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      icon={<Pencil className="size-4" />}
                      onClick={() => {
                        editSessionForm.reset({
                          title: session.title,
                          description: session.description ?? "",
                          sessionDate: toDateTimeLocal(session.sessionDate),
                        });
                        setEditingSessionId(session.id);
                      }}
                      type="button"
                      variant="secondary"
                    >
                      Edit
                    </Button>
                    <Button
                      icon={<Trash2 className="size-4" />}
                      onClick={() => {
                        if (window.confirm(`Delete ${session.title} and all of its attendance records?`)) {
                          deleteSessionMutation.mutate(session.id);
                        }
                      }}
                      type="button"
                      variant="danger"
                    >
                      {deleteSessionMutation.isPending ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}

            {series.sessions.length === 0 ? (
              <p className="rounded-[8px] bg-[var(--color-surface-soft)] p-4 text-sm text-slate-500">
                No sessions created yet.
              </p>
            ) : null}
          </div>
        </Card>
      </div>

      <Card>
        <div>
          <p className="text-sm font-semibold text-slate-900">Manage event</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Event settings</h2>
          <p className="mt-2 text-sm text-slate-500">
            Controls how check-in works and what attendee details show up on the scanner and session roster for{" "}
            <strong>{series.name}</strong>.
          </p>
        </div>

        {settings ? (
          <div className="mt-6 space-y-3">
            {SETTINGS_TOGGLES.map((toggle) => (
              <label
                className="flex cursor-pointer items-start gap-3 rounded-[8px] bg-[var(--color-surface-soft)] p-4 transition hover:bg-white"
                key={toggle.key}
              >
                <input
                  checked={settings[toggle.key]}
                  className="mt-0.5 size-4 shrink-0 rounded border-[var(--color-border)] text-amber-600 focus:ring-amber-500/40"
                  onChange={(event) => {
                    settingsMutation.reset();
                    setSettings((current) => (current ? { ...current, [toggle.key]: event.target.checked } : current));
                  }}
                  type="checkbox"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-900">{toggle.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{toggle.description}</span>
                </span>
              </label>
            ))}

            {settingsMutation.isError ? (
              <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {getErrorMessage(settingsMutation.error)}
              </p>
            ) : null}

            {settingsMutation.isSuccess ? (
              <p className="rounded-[8px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Event settings saved.
              </p>
            ) : null}

            <Button onClick={() => settingsMutation.mutate()} type="button">
              {settingsMutation.isPending ? "Saving..." : "Save event settings"}
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function toDateTimeLocal(value: string) {
  return new Date(value).toISOString().slice(0, 16);
}
