import { useQuery } from "@tanstack/react-query";
import {
  CalendarRange,
  ChevronRight,
  Percent,
  QrCode,
  ScanLine,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { api, unwrapResponse } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatDate, formatPercentage, resolveMediaUrl } from "../lib/utils";
import type { EventSeries, PaginatedResult, SeriesReport } from "../types/api";

export function DashboardPage() {
  const { auth } = useAuth();
  const attendeesQuery = useQuery({
    queryKey: ["attendees-summary", auth?.activeOrganizationId],
    queryFn: async () =>
      unwrapResponse<PaginatedResult<unknown>>(
        await api.get("/attendees", {
          params: {
            page: 1,
            pageSize: 1,
          },
        }),
      ),
  });

  const seriesQuery = useQuery({
    queryKey: ["event-series", auth?.activeOrganizationId],
    queryFn: async () => unwrapResponse<EventSeries[]>(await api.get("/event-series")),
  });

  const primarySeriesId = seriesQuery.data?.[0]?.id;

  const reportQuery = useQuery({
    queryKey: ["series-report", auth?.activeOrganizationId, primarySeriesId],
    enabled: Boolean(primarySeriesId),
    queryFn: async () =>
      unwrapResponse<SeriesReport>(await api.get(`/reports/event-series/${primarySeriesId}`)),
  });

  const seriesList = seriesQuery.data ?? [];
  const attendeeCount = Array.isArray(attendeesQuery.data)
    ? attendeesQuery.data.length
    : attendeesQuery.data?.pagination?.total ?? 0;
  const reportItems = reportQuery.data?.items ?? [];
  const averageAttendance =
    reportItems.length === 0
      ? 0
      : reportItems.reduce((total, item) => total + item.attendancePercentage, 0) / reportItems.length;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-slate-500">Dashboard</p>
              <h1 className="mt-3 font-display text-4xl font-semibold text-slate-900">Attendance ops</h1>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { to: "/app/scanner", label: "Scan", icon: ScanLine },
                { to: "/app/attendees", label: "Attendees", icon: Users },
                { to: "/app/event-series", label: "Series", icon: CalendarRange },
              ].map((item) => (
                <Link key={item.label} to={item.to}>
                  <div className="rounded-[8px] bg-[var(--color-surface-soft)] px-4 py-4 transition hover:bg-white">
                    <div className="w-fit rounded-[8px] bg-white p-3 text-amber-700">
                      <item.icon className="size-5" />
                    </div>
                    <p className="mt-3 font-semibold text-slate-900">{item.label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Lead series</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                {seriesList[0]?.name ?? "No series"}
              </h2>
            </div>
            {seriesList[0] ? <Badge>{seriesList[0].sessions.length} sessions</Badge> : null}
          </div>

          {seriesList[0] ? (
            <>
              <div className="mt-5 grid gap-3">
                {seriesList[0].sessions.slice(0, 3).map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-[8px] bg-[var(--color-surface-soft)] px-4 py-3"
                  >
                    <p className="font-medium text-slate-800">{session.title}</p>
                    <p className="text-sm text-slate-500">{formatDate(session.sessionDate)}</p>
                  </div>
                ))}
              </div>

              <Link
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-700"
                to={`/app/event-series/${seriesList[0].id}`}
              >
                Open
                <ChevronRight className="size-4" />
              </Link>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Create your first series.</p>
          )}
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Attendees", value: attendeeCount, icon: Users },
          { label: "Series", value: seriesList.length, icon: CalendarRange },
          {
            label: "Sessions",
            value: seriesList.reduce((total, item) => total + item.sessions.length, 0),
            icon: QrCode,
          },
          { label: "Attendance", value: formatPercentage(averageAttendance || 0), icon: Percent },
        ].map((item) => (
          <Card key={item.label} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-4 font-display text-4xl font-semibold text-slate-900">{item.value}</p>
              </div>
              <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
                <item.icon className="size-5" />
              </div>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.74fr_1.26fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">Next</h2>
            <Badge>{seriesList.length > 0 ? "Live" : "Setup"}</Badge>
          </div>

          <div className="mt-5 grid gap-3">
            {[
              { title: "Create series", to: "/app/event-series", icon: CalendarRange },
              { title: "Add attendees", to: "/app/attendees", icon: Users },
              { title: "Open scanner", to: "/app/scanner", icon: ScanLine },
            ].map((item) => (
              <Link
                key={item.title}
                className="flex items-center justify-between rounded-[8px] bg-[var(--color-surface-soft)] px-4 py-4 transition hover:bg-white"
                to={item.to}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-[8px] bg-white p-3 text-amber-700">
                    <item.icon className="size-5" />
                  </div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                </div>
                <ChevronRight className="size-4 text-slate-400" />
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">Top attendance</h2>
            {primarySeriesId ? (
              <Link to={`/app/reports/event-series/${primarySeriesId}`}>
                <Button variant="secondary">Report</Button>
              </Link>
            ) : null}
          </div>

          <div className="mt-5 space-y-3">
            {reportItems
              .slice()
              .sort((left, right) => right.attendancePercentage - left.attendancePercentage)
              .slice(0, 6)
              .map((item) => (
                <div
                  key={item.attendeeId}
                  className="flex items-center justify-between rounded-[8px] bg-[var(--color-surface-soft)] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      alt={item.name}
                      className="size-11 rounded-[12px] object-cover ring-1 ring-[var(--color-border)]"
                      src={resolveMediaUrl(item.profileImageUrl) ?? "https://placehold.co/120x120/f7f5f0/334155?text=QR"}
                    />
                    <div>
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-500">{item.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-amber-700">
                      {formatPercentage(item.attendancePercentage)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.attendedSessions}/{item.totalSessions}
                    </p>
                  </div>
                </div>
              ))}
            {reportItems.length === 0 ? <p className="text-sm text-slate-500">No report data yet.</p> : null}
          </div>
        </Card>
      </section>
    </div>
  );
}
