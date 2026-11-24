import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Copy, ExternalLink, FileText, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Dialog } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { api, getErrorMessage, unwrapResponse } from "../lib/api";
import { useAuth } from "../lib/auth";
import { FORM_STATUS_STYLES, publicFormUrl } from "../lib/forms";
import { cn, formatDate } from "../lib/utils";
import type { EventSeries, FormSummary } from "../types/api";

export function FormsListPage() {
  const { t, i18n } = useTranslation();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventSeriesId, setEventSeriesId] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formsQuery = useQuery({
    queryKey: ["forms", auth?.activeOrganizationId],
    queryFn: async () => unwrapResponse<FormSummary[]>(await api.get("/forms")),
  });

  const seriesQuery = useQuery({
    queryKey: ["event-series", auth?.activeOrganizationId],
    enabled: createOpen,
    queryFn: async () => unwrapResponse<EventSeries[]>(await api.get("/event-series")),
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      unwrapResponse<FormSummary>(
        await api.post("/forms", {
          title: title.trim(),
          description: description.trim() || null,
          eventSeriesId: eventSeriesId || null,
          language: i18n.language === "en" ? "en" : "th",
        }),
      ),
    onSuccess: (form) => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      navigate(`/app/forms/${form.id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/forms/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["forms"] }),
  });

  const forms = formsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <Card className="p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
              <ClipboardList className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{t("forms.list.eyebrow")}</p>
              <h1 className="mt-2 font-display text-3xl font-semibold text-slate-900">{t("forms.list.title")}</h1>
            </div>
          </div>
          <Button icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)} type="button">
            {t("forms.list.newForm")}
          </Button>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-slate-500">{t("forms.list.description")}</p>
      </Card>

      {formsQuery.isError ? (
        <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">{getErrorMessage(formsQuery.error)}</p>
      ) : null}

      {!formsQuery.isLoading && forms.length === 0 ? (
        <Card className="text-center">
          <FileText className="mx-auto size-10 text-slate-400" />
          <p className="mt-3 font-semibold text-slate-900">{t("forms.list.emptyTitle")}</p>
          <p className="mt-1 text-sm text-slate-500">{t("forms.list.emptyBody")}</p>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {forms.map((form) => (
          <Card key={form.id} className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link className="break-words text-lg font-semibold text-slate-900 hover:text-amber-700" to={`/app/forms/${form.id}`}>
                  {form.title}
                </Link>
                <p className="mt-1 text-xs text-slate-500">
                  {form.eventSeries ? `${form.eventSeries.name} · ` : ""}
                  {t("forms.list.updated", { date: formatDate(form.updatedAt) })}
                </p>
              </div>
              <Badge className={cn("shrink-0", FORM_STATUS_STYLES[form.status])}>{t(`forms.status.${form.status}`)}</Badge>
            </div>

            {form.description ? <p className="line-clamp-2 text-sm text-slate-600">{form.description}</p> : null}

            <p className="text-sm text-slate-700">
              <span className="text-2xl font-semibold text-slate-900">{form.responseCount}</span>{" "}
              {t("forms.list.responses", { count: form.responseCount })}
            </p>

            <div className="mt-auto flex flex-wrap gap-2">
              <Link to={`/app/forms/${form.id}`}>
                <Button type="button" variant="secondary">{t("forms.list.edit")}</Button>
              </Link>
              <Link to={`/app/forms/${form.id}?tab=responses`}>
                <Button type="button" variant="secondary">{t("forms.list.viewResponses")}</Button>
              </Link>
              {form.status !== "DRAFT" ? (
                <>
                  <Button
                    icon={<Copy className="size-4" />}
                    onClick={async () => {
                      await navigator.clipboard.writeText(publicFormUrl(form.publicToken));
                      setCopiedId(form.id);
                      window.setTimeout(() => setCopiedId(null), 2000);
                    }}
                    type="button"
                    variant="ghost"
                  >
                    {copiedId === form.id ? t("forms.list.copied") : t("forms.list.copyLink")}
                  </Button>
                  <a href={publicFormUrl(form.publicToken)} rel="noreferrer" target="_blank">
                    <Button icon={<ExternalLink className="size-4" />} type="button" variant="ghost">
                      {t("forms.list.open")}
                    </Button>
                  </a>
                </>
              ) : null}
              <Button
                disabled={deleteMutation.isPending}
                icon={<Trash2 className="size-4" />}
                onClick={() => {
                  if (window.confirm(t("forms.list.confirmDelete", { title: form.title, count: form.responseCount }))) {
                    deleteMutation.mutate(form.id);
                  }
                }}
                type="button"
                variant="danger"
              >
                {t("common.delete")}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog onClose={() => setCreateOpen(false)} open={createOpen} title={t("forms.list.createTitle")}>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (title.trim()) createMutation.mutate();
          }}
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">{t("forms.list.formTitle")}</span>
            <Input autoFocus onChange={(event) => setTitle(event.target.value)} placeholder={t("forms.list.formTitlePlaceholder")} value={title} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">
              {t("forms.list.formDescription")} <span className="text-slate-400">({t("common.optional")})</span>
            </span>
            <textarea
              className="min-h-24 w-full rounded-[8px] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-200"
              onChange={(event) => setDescription(event.target.value)}
              value={description}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">
              {t("forms.list.eventSeries")} <span className="text-slate-400">({t("common.optional")})</span>
            </span>
            <Select onChange={(event) => setEventSeriesId(event.target.value)} value={eventSeriesId}>
              <option value="">{t("forms.list.noEventSeries")}</option>
              {(seriesQuery.data ?? []).map((series) => (
                <option key={series.id} value={series.id}>
                  {series.name}
                </option>
              ))}
            </Select>
            <span className="block text-xs text-slate-500">{t("forms.list.eventSeriesHint")}</span>
          </label>
          <p className="rounded-[8px] bg-amber-50 px-4 py-3 text-sm text-amber-800">{t("forms.list.attendeeFieldsNote")}</p>
          {createMutation.isError ? (
            <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">{getErrorMessage(createMutation.error)}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button onClick={() => setCreateOpen(false)} type="button" variant="ghost">
              {t("common.cancel")}
            </Button>
            <Button disabled={!title.trim() || createMutation.isPending} type="submit">
              {createMutation.isPending ? t("forms.list.creating") : t("forms.list.create")}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
