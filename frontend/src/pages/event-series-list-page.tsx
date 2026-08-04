import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Plus, Settings2, Sheet, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { api, getErrorMessage, unwrapResponse } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatDate } from "../lib/utils";
import type { EventSeries } from "../types/api";

const createSeriesSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type CreateSeriesValues = z.infer<typeof createSeriesSchema>;

export function EventSeriesListPage() {
  const queryClient = useQueryClient();
  const { auth } = useAuth();
  const [showNewEventForm, setShowNewEventForm] = useState(false);

  const seriesQuery = useQuery({
    queryKey: ["event-series", auth?.activeOrganizationId],
    queryFn: async () => unwrapResponse<EventSeries[]>(await api.get("/event-series")),
  });

  const series = seriesQuery.data ?? [];

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
    onSuccess: () => {
      seriesForm.reset();
      setShowNewEventForm(false);
      queryClient.invalidateQueries({ queryKey: ["event-series", auth?.activeOrganizationId] });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Event Series</p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-slate-900">Event Series</h1>
            <p className="mt-2 text-sm text-slate-500">
              Create an event series, then open it to manage its sessions and settings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to="/app/settings/organization">
              <Button icon={<Settings2 className="size-4" />} variant="secondary">
                Org settings
              </Button>
            </Link>
            <Button
              icon={<Plus className="size-4" />}
              onClick={() => setShowNewEventForm((value) => !value)}
              type="button"
            >
              Create series
            </Button>
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
                <Button onClick={() => setShowNewEventForm(false)} type="button" variant="ghost">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        ) : null}
      </Card>

      <Card>
        <p className="text-sm font-semibold text-slate-900">All series</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">{series.length} available</h2>

        <div className="mt-6 space-y-3">
          {series.map((item) => (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] bg-[var(--color-surface-soft)] p-4 transition hover:bg-white"
              key={item.id}
            >
              <Link className="min-w-0 flex-1" to={`/app/event-series/${item.id}`}>
                <h3 className="truncate font-semibold text-slate-900">{item.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {(item._count?.sessions ?? item.sessions?.length ?? 0)} sessions
                  {item.startDate ? ` · Starts ${formatDate(item.startDate)}` : ""}
                </p>
              </Link>
              <Link to={`/app/reports/event-series/${item.id}`}>
                <Button icon={<Sheet className="size-4" />} type="button" variant="secondary">
                  Report
                </Button>
              </Link>
            </div>
          ))}

          {!seriesQuery.isLoading && series.length === 0 ? (
            <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-8 text-center">
              <CalendarDays className="mx-auto size-8 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-600">No events yet</p>
              <p className="mt-1 text-sm text-slate-400">Create your first event series to get started.</p>
              <Button
                className="mt-6"
                icon={<Plus className="size-4" />}
                onClick={() => setShowNewEventForm(true)}
                type="button"
              >
                Create event
              </Button>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
