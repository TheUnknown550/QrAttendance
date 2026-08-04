import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useParams } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { api, unwrapResponse } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatDate, formatPercentage, resolveMediaUrl } from "../lib/utils";
import type { SeriesReport } from "../types/api";

export function AttendanceReportPage() {
  const { id = "" } = useParams();
  const { auth } = useAuth();

  const reportQuery = useQuery({
    queryKey: ["series-report", auth?.activeOrganizationId, id],
    queryFn: async () => unwrapResponse<SeriesReport>(await api.get(`/reports/event-series/${id}`)),
  });

  async function downloadReport(downloadUrl: string, fileName: string, contentType: string) {
    const response = await api.get(downloadUrl, {
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: contentType });
    const objectUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(objectUrl);
  }

  if (!reportQuery.data) {
    return <Card>Loading report...</Card>;
  }

  const report = reportQuery.data;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-sm font-semibold text-slate-900">Attendance report</p>
          <h1 className="mt-2 break-words font-display text-4xl font-semibold text-slate-900">{report.series.name}</h1>
          <div className="mt-5 flex flex-wrap gap-3">
            <Badge>{report.sessions.length} sessions</Badge>
            <Badge>{report.items.length} attendees</Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            icon={<Download className="size-4" />}
            onClick={() =>
              downloadReport(
                `/reports/event-series/${id}/export.csv`,
                `${report.series.name}.csv`,
                "text/csv",
              )
            }
            variant="secondary"
          >
            Export CSV
          </Button>
          <Button
            icon={<Download className="size-4" />}
            onClick={() =>
              downloadReport(
                `/reports/event-series/${id}/export.xlsx`,
                `${report.series.name}.xlsx`,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              )
            }
          >
            Export Excel
          </Button>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-[10px] bg-[var(--color-surface-soft)]">
        <div className="space-y-4 p-4 md:hidden">
          {report.items.map((item) => (
            <div
              key={item.attendeeId}
              className="rounded-[8px] bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <img
                  alt={item.name}
                  className="size-12 rounded-[8px] object-cover ring-1 ring-[var(--color-border)]"
                  src={
                    resolveMediaUrl(item.profileImageUrl) ??
                    "https://placehold.co/120x120/f7f5f0/334155?text=QR"
                  }
                />
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{item.name}</p>
                  <p className="truncate text-sm text-slate-500">{item.email}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge>{item.attendedSessions}/{item.totalSessions}</Badge>
                <Badge>{formatPercentage(item.attendancePercentage)}</Badge>
              </div>

              <div className="mt-4 space-y-2">
                {item.sessionAttendance.map((session) => {
                  const sessionInfo = report.sessions.find((entry) => entry.id === session.sessionId);

                  return (
                    <div
                      key={session.sessionId}
                      className="flex items-center justify-between gap-3 rounded-[8px] bg-[var(--color-surface-soft)] px-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {sessionInfo?.title ?? "Session"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {sessionInfo?.sessionDate ? formatDate(sessionInfo.sessionDate) : ""}
                        </p>
                      </div>
                      <span
                        className={
                          session.attended
                            ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                            : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                        }
                      >
                        {session.attended ? "Joined" : "Missed"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full border-collapse text-left">
            <thead className="bg-[var(--color-surface-soft)] text-xs uppercase tracking-[0.22em] text-slate-500">
              <tr>
                <th className="sticky left-0 z-20 min-w-[280px] bg-[var(--color-surface-soft)] px-5 py-4">Attendee</th>
                <th className="min-w-[110px] px-4 py-4">Attended</th>
                <th className="min-w-[110px] px-4 py-4">Total</th>
                <th className="min-w-[140px] px-4 py-4">Attendance %</th>
                {report.sessions.map((session) => (
                  <th key={session.id} className="min-w-[180px] px-4 py-4">
                    <div className="space-y-1">
                        <p className="whitespace-normal break-words text-slate-700">{session.title}</p>
                      <p className="normal-case tracking-normal text-slate-400">
                        {formatDate(session.sessionDate)}
                      </p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--color-border)]">
              {report.items.map((item) => (
                <tr key={item.attendeeId} className="bg-white align-top">
                  <td className="sticky left-0 z-10 bg-white px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        alt={item.name}
                        className="size-12 rounded-[8px] object-cover ring-1 ring-[var(--color-border)]"
                        src={
                          resolveMediaUrl(item.profileImageUrl) ??
                          "https://placehold.co/120x120/f7f5f0/334155?text=QR"
                        }
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{item.name}</p>
                        <p className="truncate text-sm text-slate-500">{item.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{item.attendedSessions}</td>
                  <td className="px-4 py-4 text-slate-700">{item.totalSessions}</td>
                  <td className="px-4 py-4 font-semibold text-amber-700">
                    {formatPercentage(item.attendancePercentage)}
                  </td>
                  {item.sessionAttendance.map((session) => (
                    <td key={session.sessionId} className="px-4 py-4">
                      <div
                        className={
                          session.attended
                            ? "rounded-[8px] bg-emerald-50 px-3 py-2"
                            : "rounded-[8px] bg-[var(--color-surface-soft)] px-3 py-2"
                        }
                      >
                        <p
                          className={
                            session.attended
                              ? "text-sm font-semibold text-emerald-700"
                              : "text-sm font-semibold text-slate-600"
                          }
                        >
                          {session.attended ? "Joined" : "Missed"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {session.checkedInAt ? formatDate(session.checkedInAt) : "No check-in"}
                        </p>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
