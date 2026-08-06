import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api, getErrorMessage, unwrapResponse } from "../../lib/api";
import type {
  ConfirmAttendeeImportResult,
  ImportColumnMapping,
  ImportTargetField,
  OrganizationDetail,
  ParseAttendeeImportResult,
} from "../../types/api";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Select } from "../ui/select";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Step = "upload" | "map" | "summary";

const FIELD_ORDER: ImportTargetField[] = [
  "fullName",
  "firstName",
  "surname",
  "email",
  "organizationName",
  "attendeeType",
  "phone",
  "attendeeNumber",
];

function resetState() {
  return {
    step: "upload" as Step,
    parseResult: null as ParseAttendeeImportResult | null,
    mapping: {} as ImportColumnMapping,
    nameMode: "combined" as "combined" | "split",
  };
}

export function BulkImportModal({ open, onClose }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [state, setState] = useState(resetState);
  const { step, parseResult, mapping, nameMode } = state;

  const organizationQuery = useQuery({
    queryKey: ["organization-current"],
    queryFn: async () => unwrapResponse<OrganizationDetail>(await api.get("/organizations/current")),
  });
  const organization = organizationQuery.data;

  const REQUIRED_FIELDS: ImportTargetField[] = [
    ...(organization?.requireAttendeeEmail ? (["email"] as const) : []),
    ...(organization?.requireAttendeePhone ? (["phone"] as const) : []),
    ...(organization?.requireAttendeeNumber ? (["attendeeNumber"] as const) : []),
  ];

  const FIELD_LABELS: Record<ImportTargetField, string> = {
    fullName: t("bulkImportModal.fields.fullName"),
    firstName: t("bulkImportModal.fields.firstName"),
    surname: t("bulkImportModal.fields.surname"),
    organizationName: t("bulkImportModal.fields.organizationName"),
    attendeeType: t("bulkImportModal.fields.attendeeType"),
    email: t("bulkImportModal.fields.email"),
    phone: t("bulkImportModal.fields.phone"),
    attendeeNumber: t("bulkImportModal.fields.attendeeNumber"),
  };

  function close() {
    onClose();
    setState(resetState());
  }

  const parseMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return unwrapResponse<ParseAttendeeImportResult>(await api.post("/attendees/import/parse", formData));
    },
    onSuccess: (result) => {
      const hasSplitNames = result.suggestedMapping.firstName !== undefined;
      setState((current) => ({
        ...current,
        step: "map",
        parseResult: result,
        mapping: result.suggestedMapping,
        nameMode: hasSplitNames ? "split" : "combined",
      }));
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!parseResult) {
        throw new Error("No file parsed");
      }

      return unwrapResponse<ConfirmAttendeeImportResult>(
        await api.post("/attendees/import/confirm", {
          rows: parseResult.rows,
          mapping,
        }),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendees"] });
      queryClient.invalidateQueries({ queryKey: ["attendees-summary"] });
      setState((current) => ({ ...current, step: "summary" }));
    },
  });

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      parseMutation.mutate(file);
    }
  }

  function setFieldMapping(field: ImportTargetField, columnIndex: string) {
    setState((current) => ({
      ...current,
      mapping: {
        ...current.mapping,
        [field]: columnIndex === "" ? undefined : Number(columnIndex),
      },
    }));
  }

  const nameFieldsToShow: ImportTargetField[] = nameMode === "combined" ? ["fullName"] : ["firstName", "surname"];
  const visibleFields = FIELD_ORDER.filter(
    (field) => !["fullName", "firstName", "surname"].includes(field) || nameFieldsToShow.includes(field),
  );

  const canImport = nameMode === "combined" ? mapping.fullName !== undefined : mapping.firstName !== undefined;
  const missingRequired = REQUIRED_FIELDS.filter((field) => mapping[field] === undefined);

  return (
    <Dialog className="max-w-3xl" onClose={close} open={open} title={t("bulkImportModal.title")}>
      {step === "upload" ? (
        <div className="space-y-5">
          <p className="text-sm text-slate-500">{t("bulkImportModal.uploadDescription")}</p>

          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-[10px] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-soft)] px-6 py-12 text-center transition hover:border-amber-400 hover:bg-white">
            <FileSpreadsheet className="size-8 text-amber-600" />
            <span className="text-sm font-medium text-slate-700">
              {parseMutation.isPending ? t("bulkImportModal.readingFile") : t("bulkImportModal.clickToChoose")}
            </span>
            <span className="text-xs text-slate-400">
              {t("bulkImportModal.maxSize", { size: (5 * 1024 * 1024) / (1024 * 1024) })}
            </span>
            <input
              accept=".csv,.xlsx,.xls"
              className="hidden"
              disabled={parseMutation.isPending}
              onChange={handleFileChange}
              type="file"
            />
          </label>

          {parseMutation.isError ? (
            <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getErrorMessage(parseMutation.error)}
            </p>
          ) : null}
        </div>
      ) : null}

      {step === "map" && parseResult ? (
        <div className="space-y-5">
          <p className="text-sm text-slate-500">
            {t("bulkImportModal.foundRows", {
              rows: parseResult.totalRows,
              columns: parseResult.headers.length,
            })}
          </p>

          <div className="flex gap-2 rounded-[8px] bg-[var(--color-surface-soft)] p-1 text-sm">
            <button
              className={`flex-1 rounded-[6px] px-3 py-2 font-medium transition ${nameMode === "combined" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
              onClick={() => setState((current) => ({ ...current, nameMode: "combined" }))}
              type="button"
            >
              {t("bulkImportModal.singleFullNameColumn")}
            </button>
            <button
              className={`flex-1 rounded-[6px] px-3 py-2 font-medium transition ${nameMode === "split" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
              onClick={() => setState((current) => ({ ...current, nameMode: "split" }))}
              type="button"
            >
              {t("bulkImportModal.separateNameSurnameColumns")}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {visibleFields.map((field) => (
              <label className="block" key={field}>
                <span className="mb-2 block text-sm font-medium text-slate-600">
                  {FIELD_LABELS[field]}
                  {REQUIRED_FIELDS.includes(field) ? <span className="text-rose-500"> *</span> : null}
                  {field === "firstName" ? <span className="text-rose-500"> *</span> : null}
                </span>
                <Select
                  onChange={(event) => setFieldMapping(field, event.target.value)}
                  value={mapping[field] ?? ""}
                >
                  <option value="">{t("bulkImportModal.notImported")}</option>
                  {parseResult.headers.map((header, index) => (
                    <option key={index} value={index}>
                      {header || t("bulkImportModal.columnN", { number: index + 1 })}
                    </option>
                  ))}
                </Select>
              </label>
            ))}
          </div>

          {parseResult.previewRows.length > 0 ? (
            <div className="overflow-x-auto rounded-[8px] border border-[var(--color-border)]">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-[var(--color-surface-soft)] uppercase tracking-wide text-slate-500">
                  <tr>
                    {parseResult.headers.map((header, index) => (
                      <th className="whitespace-nowrap px-3 py-2" key={index}>
                        {header || t("bulkImportModal.columnN", { number: index + 1 })}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {parseResult.previewRows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((value, cellIndex) => (
                        <td className="max-w-[160px] truncate whitespace-nowrap px-3 py-2 text-slate-600" key={cellIndex}>
                          {value || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {!canImport || missingRequired.length > 0 ? (
            <p className="rounded-[8px] bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {t("bulkImportModal.mapRequiredFields")}
            </p>
          ) : null}

          {confirmMutation.isError ? (
            <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getErrorMessage(confirmMutation.error)}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button
              disabled={!canImport || missingRequired.length > 0 || confirmMutation.isPending}
              icon={<Upload className="size-4" />}
              onClick={() => confirmMutation.mutate()}
              type="button"
            >
              {confirmMutation.isPending
                ? t("bulkImportModal.importing")
                : t("bulkImportModal.importRows", { count: parseResult.totalRows })}
            </Button>
            <Button onClick={() => setState(resetState())} type="button" variant="ghost">
              {t("bulkImportModal.chooseDifferentFile")}
            </Button>
          </div>
        </div>
      ) : null}

      {step === "summary" && confirmMutation.data ? (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-semibold">
                {t("bulkImportModal.imported", { count: confirmMutation.data.created })}
              </p>
              {confirmMutation.data.skippedCount > 0 ? (
                <p className="mt-1 text-emerald-700">
                  {t("bulkImportModal.skipped", { count: confirmMutation.data.skippedCount })}
                </p>
              ) : null}
            </div>
          </div>

          {confirmMutation.data.skipped.length > 0 ? (
            <div className="max-h-56 overflow-y-auto rounded-[8px] border border-[var(--color-border)]">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-[var(--color-surface-soft)] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">{t("bulkImportModal.row")}</th>
                    <th className="px-3 py-2">{t("bulkImportModal.reason")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {confirmMutation.data.skipped.map((entry, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-slate-600">{entry.row}</td>
                      <td className="px-3 py-2 text-slate-600">{entry.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <Button className="w-full" onClick={close} type="button">
            {t("bulkImportModal.done")}
          </Button>
        </div>
      ) : null}
    </Dialog>
  );
}
