import XLSX from "xlsx";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { successResponse } from "../../utils/api-response";
import { asyncHandler } from "../../utils/async-handler";

async function buildAttendanceReport(seriesId: string, organizationId: string) {
  const series = await prisma.eventSeries.findFirst({
    where: {
      id: seriesId,
      organizationId,
    },
    include: {
      sessions: {
        orderBy: {
          sessionDate: "asc",
        },
      },
    },
  });

  if (!series) {
    throw new ApiError(404, "Event series not found");
  }

  const attendees = await prisma.attendee.findMany({
    where: {
      organizationId,
    },
    include: {
      attendance: {
        where: {
          eventSession: {
            eventSeriesId: seriesId,
          },
        },
      },
    },
    orderBy: [
      {
        attendeeNumber: {
          sort: "asc",
          nulls: "last",
        },
      },
      {
        name: "asc",
      },
    ],
  });

  const totalSessions = series.sessions.length;

  const items = attendees.map((attendee) => {
    const attendanceBySessionId = new Map(
      attendee.attendance.map((record) => [record.eventSessionId, record]),
    );
    const attendedSessions = attendee.attendance.length;
    const attendancePercentage = totalSessions === 0 ? 0 : (attendedSessions / totalSessions) * 100;

    return {
      attendeeId: attendee.id,
      profileImageUrl: attendee.profileImageUrl,
      name: attendee.name,
      email: attendee.email,
      attendedSessions,
      totalSessions,
      attendancePercentage: Number(attendancePercentage.toFixed(2)),
      sessionAttendance: series.sessions.map((session) => {
        const record = attendanceBySessionId.get(session.id);

        return {
          sessionId: session.id,
          title: session.title,
          sessionDate: session.sessionDate,
          attended: Boolean(record),
          checkedInAt: record?.checkedInAt ?? null,
        };
      }),
    };
  });

  return {
    series: {
      id: series.id,
      name: series.name,
      description: series.description,
    },
    sessions: series.sessions,
    items,
  };
}

function buildReportRowsForExport(report: Awaited<ReturnType<typeof buildAttendanceReport>>) {
  return report.items.map((item) => {
    const sessionColumns = Object.fromEntries(
      item.sessionAttendance.map((session) => [
        `${session.title} (${new Date(session.sessionDate).toLocaleDateString("en-US")})`,
        session.attended ? "Joined" : "Did not join",
      ]),
    );

    return {
      attendeeName: item.name,
      email: item.email,
      attendedCount: item.attendedSessions,
      totalSessions: item.totalSessions,
      attendancePercentage: item.attendancePercentage,
      ...sessionColumns,
    };
  });
}

function ensureExportRowLimit(totalRows: number) {
  if (totalRows > env.REPORT_EXPORT_MAX_ROWS) {
    throw new ApiError(
      413,
      `Report export is limited to ${env.REPORT_EXPORT_MAX_ROWS} attendees. Narrow the dataset before exporting.`,
    );
  }
}

function toCsvCell(value: unknown) {
  const stringValue = value == null ? "" : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function streamCsv(response: Parameters<typeof exportSeriesReportCsv>[1], rows: Record<string, unknown>[]) {
  const headers = Object.keys(rows[0] ?? {});
  response.setHeader("Content-Type", "text/csv; charset=utf-8");
  response.write(`${headers.map(toCsvCell).join(",")}\n`);

  for (const row of rows) {
    response.write(`${headers.map((header) => toCsvCell(row[header])).join(",")}\n`);
  }

  response.end();
}

export const getSeriesReport = asyncHandler(async (request, response) => {
  const seriesId = request.params.id as string;
  const organizationId = request.auth!.organizationId as string;
  const report = await buildAttendanceReport(seriesId, organizationId);
  response.json(successResponse(report));
});

export const exportSeriesReportCsv = asyncHandler(async (request, response) => {
  const seriesId = request.params.id as string;
  const organizationId = request.auth!.organizationId as string;
  const report = await buildAttendanceReport(seriesId, organizationId);
  ensureExportRowLimit(report.items.length);
  const rows = buildReportRowsForExport(report);

  response.setHeader(
    "Content-Disposition",
    `attachment; filename="${report.series.name.toLowerCase().replace(/\s+/g, "-")}-attendance-report.csv"`,
  );
  streamCsv(response, rows);
});

export const exportSeriesReportExcel = asyncHandler(async (request, response) => {
  const seriesId = request.params.id as string;
  const organizationId = request.auth!.organizationId as string;
  const report = await buildAttendanceReport(seriesId, organizationId);
  ensureExportRowLimit(report.items.length);

  const workbook = XLSX.utils.book_new();
  const attendanceSheet = XLSX.utils.json_to_sheet(buildReportRowsForExport(report));
  const sessionsSheet = XLSX.utils.json_to_sheet(
    report.sessions.map((session, index) => ({
      order: index + 1,
      title: session.title,
      sessionDate: session.sessionDate,
      description: session.description ?? "",
    })),
  );

  XLSX.utils.book_append_sheet(workbook, attendanceSheet, "Attendance Matrix");
  XLSX.utils.book_append_sheet(workbook, sessionsSheet, "Sessions");

  const workbookBuffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  response.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  response.setHeader(
    "Content-Disposition",
    `attachment; filename="${report.series.name.toLowerCase().replace(/\s+/g, "-")}-attendance-report.xlsx"`,
  );
  response.send(workbookBuffer);
});
