import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Trash2, UserRound } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { api, getErrorMessage, unwrapResponse } from "../../lib/api";
import { cn, formatDate } from "../../lib/utils";
import type { FormResponsesPage } from "../../types/api";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

export function FormResponsesPanel({ formId, formTitle }: { formId: string; formTitle: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const responsesQuery = useQuery({
    queryKey: ["form-responses", formId, page],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      unwrapResponse<FormResponsesPage>(await api.get(`/forms/${formId}/responses`, { params: { page, pageSize: 25 } })),
  });

  const deleteMutation = useMutation({
    mutationFn: async (responseId: string) => api.delete(`/forms/${formId}/responses/${responseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-responses", formId] });
      queryClient.invalidateQueries({ queryKey: ["form", formId] });
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });

  async function exportExcel() {
    setExporting(true);
    setExportError(null);

    try {
      const response = await api.get(`/forms/${formId}/responses/export.xlsx`, { responseType: "blob" });
      const objectUrl = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      );
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${formTitle.replace(/[\\/:*?"<>|]+/g, " ").trim() || "form"} - responses.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      // Blob error bodies need decoding before the message can be shown.
      const data = (error as { response?: { data?: unknown } }).response?.data;
      if (data instanceof Blob) {
        try {
          setExportError(JSON.parse(await data.text()).message ?? getErrorMessage(error));
        } catch {
          setExportError(getErrorMessage(error));
        }
      } else {
        setExportError(getErrorMessage(error));
      }
    } finally {
      setExporting(false);
    }
  }

  const data = responsesQuery.data;
  const columns = data?.columns ?? [];
  const rows = data?.items ?? [];

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t("forms.responses.title")}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("forms.responses.total", { count: data?.pagination.total ?? 0 })}
          </p>
        </div>
        <Button
          disabled={exporting || !data || data.pagination.total === 0}
          icon={<Download className="size-4" />}
          onClick={exportExcel}
          type="button"
        >
          {exporting ? t("forms.responses.exporting") : t("forms.responses.exportExcel")}
        </Button>
      </div>

      {exportError ? <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">{exportError}</p> : null}
      {responsesQuery.isError ? (
        <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">{getErrorMessage(responsesQuery.error)}</p>
      ) : null}

      {data && rows.length === 0 ? (
        <p className="rounded-[8px] bg-[var(--color-surface-soft)] p-6 text-center text-sm text-slate-500">
          {t("forms.responses.empty")}
        </p>
      ) : null}

      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-[8px] border border-[var(--color-border)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--color-surface-soft)] text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("forms.responses.submittedAt")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("forms.responses.attendee")}</th>
                {columns.map((column) => (
                  <th key={column.id} className={cn("min-w-40 px-4 py-3 font-semibold", column.archived && "text-slate-400")}>
                    {column.label}
                    {column.archived ? ` (${t("forms.responses.deletedQuestion")})` : ""}
                  </th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {rows.map((row) => (
                <tr key={row.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(row.submittedAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {row.attendee ? (
                      <div className="space-y-1">
                        <Link
                          className="inline-flex items-center gap-1 font-medium text-amber-700 hover:text-amber-800"
                          to={`/app/attendees/${row.attendee.id}`}
                        >
                          <UserRound className="size-3.5" />
                          {row.attendee.firstName} {row.attendee.surname}
                        </Link>
                        <div>
                          <Badge className={row.matchedExistingAttendee ? "bg-sky-50 text-sky-700" : "bg-emerald-50 text-emerald-700"}>
                            {row.matchedExistingAttendee ? t("forms.responses.existingAttendee") : t("forms.responses.newAttendee")}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400">{t("forms.responses.attendeeRemoved")}</span>
                    )}
                  </td>
                  {columns.map((column) => (
                    <td key={column.id} className="max-w-72 whitespace-pre-line break-words px-4 py-3 text-slate-800">
                      {row.values[column.id] || <span className="text-slate-300">—</span>}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <button
                      aria-label={t("common.delete")}
                      className="rounded-[6px] p-1.5 text-rose-600 hover:bg-rose-50"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (window.confirm(t("forms.responses.confirmDelete"))) deleteMutation.mutate(row.id);
                      }}
                      type="button"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {data && data.pagination.totalPages > 1 ? (
        <div className="flex items-center justify-end gap-3 text-sm text-slate-600">
          <Button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} type="button" variant="secondary">
            {t("common.back")}
          </Button>
          <span>{t("forms.renderer.pageOf", { current: data.pagination.page, total: data.pagination.totalPages })}</span>
          <Button
            disabled={page >= data.pagination.totalPages}
            onClick={() => setPage((current) => current + 1)}
            type="button"
            variant="secondary"
          >
            {t("forms.renderer.next")}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
