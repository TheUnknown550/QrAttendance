import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Pencil, Plus, QrCode, Tags, TableProperties, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
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

function useSettingsToggles(): Array<{
  key: keyof EventSeriesSettings;
  label: string;
  description: string;
}> {
  const { t } = useTranslation();

  return [
    {
      key: "requireCheckInApproval",
      label: t("eventSeries.settings.requireCheckInApproval.label"),
      description: t("eventSeries.settings.requireCheckInApproval.description"),
    },
    {
      key: "showOrganizationName",
      label: t("eventSeries.settings.showOrganizationName.label"),
      description: t("eventSeries.settings.showOrganizationName.description"),
    },
    {
      key: "showAttendeeType",
      label: t("eventSeries.settings.showAttendeeType.label"),
      description: t("eventSeries.settings.showAttendeeType.description"),
    },
    {
      key: "showPhone",
      label: t("eventSeries.settings.showPhone.label"),
      description: t("eventSeries.settings.showPhone.description"),
    },
    {
      key: "showEmail",
      label: t("eventSeries.settings.showEmail.label"),
      description: t("eventSeries.settings.showEmail.description"),
    },
    {
      key: "showAttendeeNumber",
      label: t("eventSeries.settings.showAttendeeNumber.label"),
      description: t("eventSeries.settings.showAttendeeNumber.description"),
    },
    {
      key: "requireCheckInPhoto",
      label: t("eventSeries.settings.requireCheckInPhoto.label"),
      description: t("eventSeries.settings.requireCheckInPhoto.description"),
    },
  ];
}

export function EventSeriesDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { auth } = useAuth();
  const settingsToggles = useSettingsToggles();

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
      requireCheckInPhoto: series.requireCheckInPhoto,
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
    return <Card>{t("eventSeries.detail.loading")}</Card>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-slate-900">{t("eventSeries.detail.eyebrow")}</p>
            <h1 className="mt-2 break-words font-display text-4xl font-semibold text-slate-900">{series.name}</h1>
            <p className="mt-4 text-base leading-7 text-slate-500">
              {series.description ?? t("eventSeries.detail.noDescription")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Badge>{t("eventSeries.sessionsCount", { count: series.sessions.length })}</Badge>
              <Badge>{series.startDate ? formatDate(series.startDate) : t("eventSeries.detail.noStartDate")}</Badge>
              <Badge>{series.endDate ? formatDate(series.endDate) : t("eventSeries.detail.noEndDate")}</Badge>
            </div>
          </div>

          <div className="grid gap-3">
            <Link
              className="rounded-[8px] bg-[var(--color-surface-soft)] px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-white"
              to={`/app/reports/event-series/${series.id}`}
            >
              {t("dashboard.report")}
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <Card>
          <form className="space-y-4" onSubmit={handleSubmit((values) => updateMutation.mutate(values))}>
            <div>
              <p className="text-sm font-semibold text-slate-900">{t("eventSeries.detail.editSeries")}</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">{t("eventSeries.detail.details")}</h2>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">{t("eventSeries.seriesName")}</span>
              <Input {...register("name")} />
              {errors.name ? <p className="mt-2 text-xs text-rose-500">{errors.name.message}</p> : null}
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">{t("eventSeries.description")}</span>
              <Input {...register("description")} />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">{t("eventSeries.startDate")}</span>
                <Input type="datetime-local" {...register("startDate")} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">{t("eventSeries.endDate")}</span>
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
              <Button type="submit">{updateMutation.isPending ? t("eventSeries.detail.saving") : t("eventSeries.detail.saveChanges")}</Button>
              <Button
                onClick={() => {
                  if (window.confirm(t("eventSeries.detail.confirmDeleteSeries", { name: series.name }))) {
                    deleteMutation.mutate();
                  }
                }}
                type="button"
                variant="danger"
              >
                {deleteMutation.isPending ? t("eventSeries.detail.deleting") : t("eventSeries.detail.deleteSeries")}
              </Button>
            </div>
          </form>
          <div className="mt-6 space-y-4">
            {[
              {
                title: t("eventSeries.detail.features.scannerReady.title"),
                description: t("eventSeries.detail.features.scannerReady.description"),
                icon: QrCode,
              },
              {
                title: t("eventSeries.detail.features.sessionBased.title"),
                description: t("eventSeries.detail.features.sessionBased.description"),
                icon: CalendarClock,
              },
              {
                title: t("eventSeries.detail.features.reportExport.title"),
                description: t("eventSeries.detail.features.reportExport.description"),
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
              <p className="text-sm font-semibold text-slate-900">{t("eventSeries.detail.sessions")}</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">{t("eventSeries.detail.schedule")}</h2>
            </div>
            <Link className="text-sm font-medium text-amber-700 hover:text-amber-800" to="/app/scanner">
              {t("appShell.openScanner")}
            </Link>
          </div>

          <form
            className="mt-6 grid gap-4 rounded-[8px] border border-[var(--color-border)] p-4 md:grid-cols-[1fr_1fr_auto]"
            onSubmit={sessionForm.handleSubmit((values) => createSessionMutation.mutate(values))}
          >
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">{t("eventSeries.sessionTitle")}</span>
              <Input placeholder="Session 1" {...sessionForm.register("title")} />
              {sessionForm.formState.errors.title ? (
                <p className="mt-2 text-xs text-rose-500">{sessionForm.formState.errors.title.message}</p>
              ) : null}
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">{t("eventSeries.dateAndTime")}</span>
              <Input type="datetime-local" {...sessionForm.register("sessionDate")} />
              {sessionForm.formState.errors.sessionDate ? (
                <p className="mt-2 text-xs text-rose-500">{sessionForm.formState.errors.sessionDate.message}</p>
              ) : null}
            </label>
            <div className="flex items-end">
              <Button className="w-full md:w-auto" icon={<Plus className="size-4" />} type="submit">
                {createSessionMutation.isPending ? t("eventSeries.detail.addingSession") : t("eventSeries.detail.addSession")}
              </Button>
            </div>
            <label className="block md:col-span-3">
              <span className="mb-2 block text-sm font-medium text-slate-600">{t("eventSeries.descriptionOptional")}</span>
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
                      <span className="mb-2 block text-sm font-medium text-slate-600">{t("eventSeries.sessionTitle")}</span>
                      <Input {...editSessionForm.register("title")} />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-600">{t("eventSeries.description")}</span>
                      <Input {...editSessionForm.register("description")} />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-600">{t("eventSeries.sessionDateAndTime")}</span>
                      <Input type="datetime-local" {...editSessionForm.register("sessionDate")} />
                    </label>
                    {updateSessionMutation.isError ? (
                      <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {getErrorMessage(updateSessionMutation.error)}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-3">
                      <Button type="submit">
                        {updateSessionMutation.isPending ? t("eventSeries.detail.saving") : t("eventSeries.detail.saveSession")}
                      </Button>
                      <Button
                        icon={<X className="size-4" />}
                        onClick={() => setEditingSessionId(null)}
                        type="button"
                        variant="ghost"
                      >
                        {t("common.cancel")}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <Link className="min-w-0 flex-1" to={`/app/event-series/${series.id}/sessions/${session.id}`}>
                      <h3 className="break-words font-semibold text-slate-900">{session.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {session.description ?? t("eventSeries.detail.noDescriptionSet")}
                      </p>
                    </Link>
                    <div className="text-right text-sm text-slate-600">
                      <p>{formatDate(session.sessionDate)}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                        {t("eventSeries.detail.checkInsCount", { count: session._count?.attendance ?? 0 })}
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
                      {t("common.edit")}
                    </Button>
                    <Button
                      icon={<Trash2 className="size-4" />}
                      onClick={() => {
                        if (window.confirm(t("eventSeries.detail.confirmDeleteSession", { title: session.title }))) {
                          deleteSessionMutation.mutate(session.id);
                        }
                      }}
                      type="button"
                      variant="danger"
                    >
                      {deleteSessionMutation.isPending ? t("eventSeries.detail.deleting") : t("common.delete")}
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}

            {series.sessions.length === 0 ? (
              <p className="rounded-[8px] bg-[var(--color-surface-soft)] p-4 text-sm text-slate-500">
                {t("eventSeries.detail.noSessionsYet")}
              </p>
            ) : null}
          </div>
        </Card>
      </div>

      <Card>
        <div>
          <p className="text-sm font-semibold text-slate-900">{t("eventSeries.detail.manageEvent")}</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{t("eventSeries.detail.eventSettings")}</h2>
          <p className="mt-2 text-sm text-slate-500">
            {t("eventSeries.detail.eventSettingsHint")}{" "}
            <strong>{series.name}</strong>.
          </p>

          <Link to="/app/settings/attendee-types">
            <Button className="mt-4" icon={<Tags className="size-4" />} type="button" variant="secondary">
              {t("eventSeries.detail.manageAttendeeTypes")}
            </Button>
          </Link>
        </div>

        {settings ? (
          <div className="mt-6 space-y-3">
            {settingsToggles
              .filter((toggle) => toggle.key !== "requireCheckInPhoto")
              .map((toggle) => (
                <div key={toggle.key}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-[8px] bg-[var(--color-surface-soft)] p-4 transition hover:bg-white">
                    <input
                      checked={settings[toggle.key]}
                      className="mt-0.5 size-4 shrink-0 rounded border-[var(--color-border)] text-amber-600 focus:ring-amber-500/40"
                      onChange={(event) => {
                        settingsMutation.reset();
                        setSettings((current) => {
                          if (!current) return current;
                          const next = { ...current, [toggle.key]: event.target.checked };
                          if (toggle.key === "requireCheckInApproval" && !event.target.checked) {
                            next.requireCheckInPhoto = false;
                          }
                          return next;
                        });
                      }}
                      type="checkbox"
                    />
                    <span>
                      <span className="block text-sm font-medium text-slate-900">{toggle.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">{toggle.description}</span>
                    </span>
                  </label>

                  {toggle.key === "requireCheckInApproval"
                    ? (() => {
                        const photoToggle = settingsToggles.find((item) => item.key === "requireCheckInPhoto");
                        if (!photoToggle) return null;
                        const locked = !settings.requireCheckInApproval;
                        return (
                          <label
                            className={
                              locked
                                ? "ml-6 mt-2 flex cursor-not-allowed items-start gap-3 rounded-[8px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4 opacity-60"
                                : "ml-6 mt-2 flex cursor-pointer items-start gap-3 rounded-[8px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4 transition hover:bg-white"
                            }
                          >
                            <input
                              checked={settings.requireCheckInPhoto}
                              className="mt-0.5 size-4 shrink-0 rounded border-[var(--color-border)] text-amber-600 focus:ring-amber-500/40 disabled:cursor-not-allowed"
                              disabled={locked}
                              onChange={(event) => {
                                settingsMutation.reset();
                                setSettings((current) =>
                                  current ? { ...current, requireCheckInPhoto: event.target.checked } : current,
                                );
                              }}
                              type="checkbox"
                            />
                            <span>
                              <span className="block text-sm font-medium text-slate-900">{photoToggle.label}</span>
                              <span className="mt-1 block text-xs leading-5 text-slate-500">
                                {photoToggle.description}
                              </span>
                              {locked ? (
                                <span className="mt-1 block text-xs font-medium text-amber-700">
                                  {t("eventSeries.settings.requireCheckInPhoto.locked")}
                                </span>
                              ) : null}
                            </span>
                          </label>
                        );
                      })()
                    : null}
                </div>
              ))}

            {settingsMutation.isError ? (
              <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {getErrorMessage(settingsMutation.error)}
              </p>
            ) : null}

            {settingsMutation.isSuccess ? (
              <p className="rounded-[8px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {t("eventSeries.detail.settingsSaved")}
              </p>
            ) : null}

            <Button onClick={() => settingsMutation.mutate()} type="button">
              {settingsMutation.isPending ? t("eventSeries.detail.saving") : t("eventSeries.detail.saveEventSettings")}
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
