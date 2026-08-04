import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, QrCode, TableProperties } from "lucide-react";
import { useEffect } from "react";
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
import type { EventSeries } from "../types/api";

const seriesSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type SeriesValues = z.infer<typeof seriesSchema>;

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

  const deleteMutation = useMutation({
    mutationFn: async () => unwrapResponse(await api.delete(`/event-series/${id}`)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-series", auth?.activeOrganizationId] });
      navigate("/app/event-series");
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
              to={`/app/event-series/${series.id}/sessions`}
            >
              Sessions
            </Link>
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

          <div className="mt-6 space-y-3">
            {series.sessions.map((session) => (
              <Link
                key={session.id}
                className="block rounded-[8px] bg-[var(--color-surface-soft)] p-4 transition hover:bg-white"
                to={`/app/event-series/${series.id}/sessions/${session.id}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="break-words font-semibold text-slate-900">{session.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {session.description ?? "No description set."}
                    </p>
                  </div>
                  <div className="text-right text-sm text-slate-600">
                    <p>{formatDate(session.sessionDate)}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                      {session._count?.attendance ?? 0} check-ins
                    </p>
                  </div>
                </div>
              </Link>
            ))}

            {series.sessions.length === 0 ? (
              <p className="rounded-[8px] bg-[var(--color-surface-soft)] p-4 text-sm text-slate-500">
                No sessions created yet.
              </p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}

function toDateTimeLocal(value: string) {
  return new Date(value).toISOString().slice(0, 16);
}
