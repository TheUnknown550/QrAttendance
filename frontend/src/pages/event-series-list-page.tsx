import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ChevronDown, Plus, Radio, Sheet, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { api, getErrorMessage, unwrapResponse } from "../lib/api";
import { useAuth } from "../lib/auth";
import { cn, formatDate } from "../lib/utils";
import type { EventSeries, EventSession } from "../types/api";

const createSeriesSchema = z.object({
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

type CreateSeriesValues = z.infer<typeof createSeriesSchema>;
type SessionFormValues = z.infer<typeof sessionSchema>;

function calcPanelStyle(trigger: HTMLElement): CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const vw = window.innerWidth;
  const w = Math.min(vw - 32, 352);
  const left = Math.max(16, Math.min(rect.right - w, vw - w - 16));
  return { position: "fixed", top: rect.bottom + 8, left, width: w, zIndex: 50 };
}

export function EventSeriesListPage() {
  const queryClient = useQueryClient();
  const { auth } = useAuth();
  const [selectedSeriesId, setSelectedSeriesId] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const seriesQuery = useQuery({
    queryKey: ["event-series", auth?.activeOrganizationId],
    queryFn: async () => unwrapResponse<EventSeries[]>(await api.get("/event-series")),
  });

  const series = seriesQuery.data ?? [];
  const selectedSeries = series.find((s) => s.id === selectedSeriesId);

  useEffect(() => {
    if (!selectedSeriesId && series.length > 0) {
      setSelectedSeriesId(series[0].id);
    }
  }, [series, selectedSeriesId]);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function handleToggle() {
    if (!dropdownOpen && triggerRef.current) {
      setPanelStyle(calcPanelStyle(triggerRef.current));
    }
    setDropdownOpen((o) => !o);
  }

  const seriesForm = useForm<CreateSeriesValues>({ resolver: zodResolver(createSeriesSchema) });
  const createSeriesMutation = useMutation({
    mutationFn: async (values: CreateSeriesValues) =>
      unwrapResponse<EventSeries>(
        await api.post("/event-series", {
          ...values,
          startDate: values.startDate ? new Date(values.startDate).toISOString() : "",
          endDate: values.endDate ? new Date(values.endDate).toISOString() : "",
        }),
      ),
    onSuccess: (created) => {
      seriesForm.reset();
      setShowNewEventForm(false);
      queryClient.invalidateQueries({ queryKey: ["event-series", auth?.activeOrganizationId] });
      setSelectedSeriesId(created.id);
    },
  });

  const sessionForm = useForm<SessionFormValues>({ resolver: zodResolver(sessionSchema) });
  const createSessionMutation = useMutation({
    mutationFn: async (values: SessionFormValues) =>
      unwrapResponse<EventSession>(
        await api.post(`/event-series/${selectedSeriesId}/sessions`, {
          ...values,
          sessionDate: new Date(values.sessionDate).toISOString(),
        }),
      ),
    onSuccess: () => {
      sessionForm.reset();
      queryClient.invalidateQueries({ queryKey: ["event-series", auth?.activeOrganizationId] });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Event Series</p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-slate-900">Sessions</h1>
            <p className="mt-2 text-sm text-slate-500">
              Select an event below, then add and manage its sessions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedSeries ? (
              <Link to={`/app/reports/event-series/${selectedSeries.id}`}>
                <Button icon={<Sheet className="size-4" />} variant="secondary">
                  Report
                </Button>
              </Link>
            ) : null}

            <div ref={dropdownRef}>
              <div ref={triggerRef}>
                <Button
                  icon={<ChevronDown className={cn("size-4 transition", dropdownOpen && "rotate-180")} />}
                  onClick={handleToggle}
                  type="button"
                  variant="secondary"
                >
                  <span className="max-w-[200px] truncate">
                    {selectedSeries ? selectedSeries.name : seriesQuery.isLoading ? "Loading..." : "Select event"}
                  </span>
                </Button>
              </div>

              {dropdownOpen ? (
                <div
                  className="overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-[var(--color-panel)] shadow-[var(--shadow-panel)]"
                  style={panelStyle}
                >
                  <div className="border-b border-[var(--color-border)] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Switch event</p>
                  </div>

                  <div className="max-h-64 overflow-y-auto p-2">
                    {series.map((s) => (
                      <button
                        key={s.id}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-[8px] px-3 py-3 text-left text-sm transition",
                          s.id === selectedSeriesId
                            ? "bg-[var(--color-surface-soft)] text-slate-900"
                            : "text-slate-600 hover:bg-[var(--color-surface-soft)] hover:text-slate-900",
                        )}
                        onClick={() => {
                          setSelectedSeriesId(s.id);
                          setDropdownOpen(false);
                        }}
                        type="button"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{s.name}</span>
                          <span className="block text-xs text-slate-500">{s.sessions.length} sessions</span>
                        </span>
                        {s.id === selectedSeriesId ? (
                          <span className="shrink-0 text-xs font-semibold text-emerald-700">Active</span>
                        ) : null}
                      </button>
                    ))}

                    {series.length === 0 ? (
                      <div className="px-3 py-6 text-center text-sm text-slate-500">No events yet.</div>
                    ) : null}
                  </div>

                  <div className="border-t border-[var(--color-border)] p-3">
                    <Button
                      className="w-full justify-start"
                      icon={<Plus className="size-4" />}
                      onClick={() => {
                        setDropdownOpen(false);
                        setShowNewEventForm(true);
                      }}
                      type="button"
                      variant="secondary"
                    >
                      Create new event
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {showNewEventForm ? (
          <div className="mt-6 rounded-[8px] border border-[var(--color-border)] p-5">
            <div className="mb-5 flex items-center justify-between">
              <p className="font-semibold text-slate-900">New event series</p>
              <button
                className="text-slate-400 hover:text-slate-600"
                onClick={() => setShowNewEventForm(false)}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>
            <form
              className="space-y-4"
              onSubmit={seriesForm.handleSubmit((v) => createSeriesMutation.mutate(v))}
            >
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Event name</span>
                <Input placeholder="AI Workshop Series" {...seriesForm.register("name")} />
                {seriesForm.formState.errors.name ? (
                  <p className="mt-2 text-xs text-rose-500">{seriesForm.formState.errors.name.message}</p>
                ) : null}
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Description</span>
                <Input
                  placeholder="Internal recurring training program"
                  {...seriesForm.register("description")}
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-600">Start date</span>
                  <Input type="datetime-local" {...seriesForm.register("startDate")} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-600">End date</span>
                  <Input type="datetime-local" {...seriesForm.register("endDate")} />
                </label>
              </div>
              {createSeriesMutation.isError ? (
                <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {getErrorMessage(createSeriesMutation.error)}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <Button icon={<Plus className="size-4" />} type="submit">
                  {createSeriesMutation.isPending ? "Creating..." : "Create event"}
                </Button>
                <Button
                  onClick={() => setShowNewEventForm(false)}
                  type="button"
                  variant="ghost"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        ) : null}
      </Card>

      {selectedSeries ? (
        <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <Card>
            <p className="text-sm font-semibold text-slate-900">Add session</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">{selectedSeries.name}</h2>
            <form
              className="mt-6 space-y-4"
              onSubmit={sessionForm.handleSubmit((v) => createSessionMutation.mutate(v))}
            >
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Session title</span>
                <Input placeholder="Session 1" {...sessionForm.register("title")} />
                {sessionForm.formState.errors.title ? (
                  <p className="mt-2 text-xs text-rose-500">
                    {sessionForm.formState.errors.title.message}
                  </p>
                ) : null}
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Description</span>
                <Input
                  placeholder="Intro to AI workflows"
                  {...sessionForm.register("description")}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">
                  Session date and time
                </span>
                <Input type="datetime-local" {...sessionForm.register("sessionDate")} />
                {sessionForm.formState.errors.sessionDate ? (
                  <p className="mt-2 text-xs text-rose-500">
                    {sessionForm.formState.errors.sessionDate.message}
                  </p>
                ) : null}
              </label>
              {createSessionMutation.isError ? (
                <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {getErrorMessage(createSessionMutation.error)}
                </p>
              ) : null}
              <Button className="w-full" type="submit">
                {createSessionMutation.isPending ? "Adding..." : "Add session"}
              </Button>
            </form>
          </Card>

          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Sessions</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {selectedSeries.sessions.length} scheduled
                </h2>
              </div>
              <Link to="/app/scanner">
                <Button icon={<Radio className="size-4" />}>Scanner</Button>
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {selectedSeries.sessions.map((session) => (
                <Link
                  key={session.id}
                  className="block rounded-[8px] bg-[var(--color-surface-soft)] p-4 transition hover:bg-white"
                  to={`/app/event-series/${selectedSeries.id}/sessions/${session.id}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{session.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {session.description ?? "No description."}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-700">{formatDate(session.sessionDate)}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                        {session._count?.attendance ?? 0} check-ins
                      </p>
                    </div>
                  </div>
                </Link>
              ))}

              {selectedSeries.sessions.length === 0 ? (
                <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-8 text-center">
                  <CalendarDays className="mx-auto size-8 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-600">No sessions yet</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Use the form on the left to add your first session.
                  </p>
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      ) : !seriesQuery.isLoading ? (
        <Card>
          <div className="py-12 text-center">
            <CalendarDays className="mx-auto size-10 text-slate-300" />
            <p className="mt-4 text-lg font-semibold text-slate-900">No events yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Create your first event series to start managing sessions.
            </p>
            <Button
              className="mt-6"
              icon={<Plus className="size-4" />}
              onClick={() => setShowNewEventForm(true)}
              type="button"
            >
              Create event
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
