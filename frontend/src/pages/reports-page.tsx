import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Sheet } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { api, getErrorMessage, unwrapResponse } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatDate } from "../lib/utils";
import type { EventSeries } from "../types/api";

export function ReportsPage() {
  const { auth } = useAuth();

  const seriesQuery = useQuery({
    queryKey: ["event-series", auth?.activeOrganizationId],
    queryFn: async () => unwrapResponse<EventSeries[]>(await api.get("/event-series")),
  });

  const series = seriesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Reports</p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-slate-900">Attendance reports</h1>
            <p className="mt-2 text-sm text-slate-500">
              Pick an event series to view and export its attendance report.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-slate-900">Event series</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">{series.length} available</h2>

        {seriesQuery.isError ? (
          <p className="mt-6 rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {getErrorMessage(seriesQuery.error)}
          </p>
        ) : null}

        <div className="mt-6 space-y-3">
          {series.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] bg-[var(--color-surface-soft)] p-4"
            >
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-slate-900">{item.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {(item._count?.sessions ?? item.sessions?.length ?? 0)} sessions
                  {item.startDate ? ` · Starts ${formatDate(item.startDate)}` : ""}
                </p>
              </div>
              <Link to={`/app/reports/event-series/${item.id}`}>
                <Button icon={<Sheet className="size-4" />} variant="secondary">
                  View report
                </Button>
              </Link>
            </div>
          ))}

          {!seriesQuery.isLoading && series.length === 0 ? (
            <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-8 text-center">
              <CalendarDays className="mx-auto size-8 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-600">No event series yet</p>
              <p className="mt-1 text-sm text-slate-400">
                Create an event series first, then come back to view its report.
              </p>
              <Link className="mt-6 inline-block" to="/app/event-series">
                <Button>Go to Event Series</Button>
              </Link>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
