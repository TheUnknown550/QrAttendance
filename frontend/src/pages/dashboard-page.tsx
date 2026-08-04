import { useQuery } from "@tanstack/react-query";
import { CalendarRange, ChevronRight, Percent, QrCode, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { api, unwrapResponse } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatAttendeeOrgType, formatDate, formatPercentage, resolveMediaUrl } from "../lib/utils";
import type { EventSeries, PaginatedResult, SeriesReport } from "../types/api";

export function DashboardPage() {
  const { t } = useTranslation();
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
          <p className="text-sm font-semibold text-slate-500">{t("dashboard.eyebrow")}</p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-slate-900">{t("dashboard.title")}</h1>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">{t("dashboard.leadSeries")}</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                {seriesList[0]?.name ?? t("dashboard.noSeries")}
              </h2>
            </div>
            {seriesList[0] ? <Badge>{t("dashboard.sessionsCount", { count: seriesList[0].sessions.length })}</Badge> : null}
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
                {t("dashboard.open")}
                <ChevronRight className="size-4" />
              </Link>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-500">{t("dashboard.createFirstSeries")}</p>
          )}
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t("dashboard.stats.attendees"), value: attendeeCount, icon: Users },
          { label: t("dashboard.stats.series"), value: seriesList.length, icon: CalendarRange },
          {
            label: t("dashboard.stats.sessions"),
            value: seriesList.reduce((total, item) => total + item.sessions.length, 0),
            icon: QrCode,
          },
          { label: t("dashboard.stats.attendance"), value: formatPercentage(averageAttendance || 0), icon: Percent },
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

      <section>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">{t("dashboard.topAttendance")}</h2>
            {primarySeriesId ? (
              <Link to={`/app/reports/event-series/${primarySeriesId}`}>
                <Button variant="secondary">{t("dashboard.report")}</Button>
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
                      alt={`${item.firstName} ${item.surname}`}
                      className="size-11 rounded-[12px] object-cover ring-1 ring-[var(--color-border)]"
                      src={resolveMediaUrl(item.profileImageUrl) ?? "https://placehold.co/120x120/f7f5f0/334155?text=QR"}
                    />
                    <div>
                      <p className="font-medium text-slate-900">{item.firstName} {item.surname}</p>
                      <p className="text-xs text-slate-500">{formatAttendeeOrgType(item.organizationName, item.attendeeType)}</p>
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
            {reportItems.length === 0 ? <p className="text-sm text-slate-500">{t("dashboard.noReportData")}</p> : null}
          </div>
        </Card>
      </section>
    </div>
  );
}
