import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Eye,
  Heading,
  Image,
  Minus,
  MousePointerClick,
  Palette,
  Plus,
  Save,
  SeparatorHorizontal,
  Settings2,
  Table2,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { FormItemEditor, ImagePicker, InlineText } from "../components/forms/form-item-editor";
import { FormHeader, FormItemsGrid, FormNavigation, FormRenderer, FormThemeFrame } from "../components/forms/form-renderer";
import { FormResponsesPanel } from "../components/forms/form-responses-panel";
import { itemSpanClass, secondaryButtonClass } from "../components/forms/form-theme";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { api, getErrorMessage, unwrapResponse } from "../lib/api";
import { useAuth } from "../lib/auth";
import {
  ALL_SYSTEM_FIELDS,
  FORM_FONTS,
  FORM_HEADER_STYLES,
  FORM_INPUT_STYLES,
  FORM_LAYOUTS,
  FORM_RADII,
  FORM_STATUS_STYLES,
  FORM_THEME_PRESETS,
  FORM_WIDTHS,
  SYSTEM_FIELD_TYPES,
  newKey,
  publicFormUrl,
  resolveFormTheme,
  toEditorItem,
  toFormItem,
  usesCustomOptions,
  type EditorItem,
} from "../lib/forms";
import { cn } from "../lib/utils";
import type {
  AttendeeSystemField,
  EventSeries,
  FormDetail,
  FormFont,
  FormItem,
  FormItemType,
  FormSettings,
  FormStatus,
  FormTheme,
} from "../types/api";

type Tab = "edit" | "settings" | "preview" | "responses";

function toSyncPayload(items: EditorItem[]) {
  return {
    items: items.map((item) => ({
      id: item.id,
      type: item.type,
      systemField: item.systemField,
      label: item.label.trim() || null,
      description: item.description.trim() || null,
      imageUrl: item.imageUrl,
      required: item.required,
      config: item.config,
      options: usesCustomOptions(item)
        ? item.options.map((option) => ({ id: option.id, label: option.label.trim(), imageUrl: option.imageUrl }))
        : [],
    })),
  };
}

/** Converts an ISO date to the value a datetime-local input expects (local time). */
function toLocalInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

type DesignState = {
  title: string;
  description: string;
  eventSeriesId: string;
  status: FormStatus;
  closesAt: string;
  theme: FormTheme;
  settings: FormSettings;
};

function toDesignState(form: FormDetail): DesignState {
  return {
    title: form.title,
    description: form.description ?? "",
    eventSeriesId: form.eventSeriesId ?? "",
    status: form.status,
    closesAt: toLocalInput(form.settings?.closesAt),
    theme: form.theme ?? {},
    settings: form.settings ?? {},
  };
}

export function FormBuilderPage() {
  const { id = "" } = useParams();
  const { t } = useTranslation();

  const formQuery = useQuery({
    queryKey: ["form", id],
    queryFn: async () => unwrapResponse<FormDetail>(await api.get(`/forms/${id}`)),
  });

  if (formQuery.isError) {
    return (
      <Card>
        <p className="text-sm text-rose-700">{getErrorMessage(formQuery.error)}</p>
        <Link className="mt-4 inline-block text-sm font-medium text-amber-700" to="/app/forms">
          {t("forms.builder.backToForms")}
        </Link>
      </Card>
    );
  }

  if (!formQuery.data) {
    return (
      <Card>
        <p className="text-sm text-slate-500">{t("common.loading")}</p>
      </Card>
    );
  }

  return <FormBuilder key={formQuery.data.id} form={formQuery.data} />;
}

/** The editors keep their own copy of the form so unsaved edits survive background refetches. */
function FormBuilder({ form }: { form: FormDetail }) {
  const id = form.id;
  const { t } = useTranslation();
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const tab: Tab = requestedTab === "settings" || requestedTab === "preview" || requestedTab === "responses" ? requestedTab : "edit";
  const [items, setItems] = useState<EditorItem[]>(() => form.items.map(toEditorItem));
  const [itemsDirty, setItemsDirty] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [design, setDesign] = useState<DesignState>(() => toDesignState(form));
  const [designDirty, setDesignDirty] = useState(false);
  const [copied, setCopied] = useState(false);

  const seriesQuery = useQuery({
    queryKey: ["event-series", auth?.activeOrganizationId],
    queryFn: async () => unwrapResponse<EventSeries[]>(await api.get("/event-series")),
  });

  const hasUnsavedChanges = itemsDirty || designDirty;

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedChanges]);

  /** Saves the questions and the design/settings together. */
  const saveMutation = useMutation({
    mutationFn: async ({ publish }: { publish?: boolean }) => {
      let savedItems: FormItem[] | null = null;
      if (itemsDirty) {
        savedItems = unwrapResponse<FormItem[]>(await api.put(`/forms/${id}/items`, toSyncPayload(items)));
      }
      if (designDirty || publish) {
        await api.patch(`/forms/${id}`, {
          title: design.title.trim(),
          description: design.description.trim() || null,
          eventSeriesId: design.eventSeriesId || null,
          status: publish ? "PUBLISHED" : design.status,
          theme: design.theme,
          settings: { ...design.settings, closesAt: design.closesAt ? new Date(design.closesAt).toISOString() : null },
        });
      }
      return { savedItems, publish };
    },
    onSuccess: ({ savedItems, publish }) => {
      if (savedItems) {
        // Keep the same item selected after new items receive their real ids.
        const selectedIndex = items.findIndex((item) => item.key === selectedKey);
        const editorItems = savedItems.map(toEditorItem);
        setItems(editorItems);
        setSelectedKey(selectedIndex >= 0 ? editorItems[selectedIndex]?.key ?? null : null);
        setItemsDirty(false);
      }
      if (publish) setDesign((current) => ({ ...current, status: "PUBLISHED" }));
      setDesignDirty(false);
      queryClient.invalidateQueries({ queryKey: ["form", id] });
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });

  const canSave = hasUnsavedChanges && design.title.trim().length > 0 && !saveMutation.isPending;
  const save = useCallback(() => {
    if (canSave) saveMutation.mutate({});
  }, [canSave, saveMutation]);

  // Ctrl/Cmd + S saves.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [save]);

  const uploadImage = async (file: File) => {
    const body = new FormData();
    body.append("image", file);

    try {
      return unwrapResponse<{ url: string }>(await api.post(`/forms/${id}/images`, body)).url;
    } catch (error) {
      throw new Error(getErrorMessage(error), { cause: error });
    }
  };

  const requiredSystemFields = useMemo(() => new Set(form.requiredSystemFields), [form.requiredSystemFields]);
  const missingSystemFields = ALL_SYSTEM_FIELDS.filter((field) => !items.some((item) => item.systemField === field));

  function changeItems(next: EditorItem[]) {
    setItems(next);
    setItemsDirty(true);
  }

  function changeDesign(patch: Partial<DesignState>) {
    setDesign((current) => ({ ...current, ...patch }));
    setDesignDirty(true);
  }

  function changeTheme(patch: Partial<FormTheme>) {
    setDesign((current) => ({ ...current, theme: { ...current.theme, ...patch } }));
    setDesignDirty(true);
  }

  function insertItem(item: EditorItem) {
    const selectedIndex = items.findIndex((current) => current.key === selectedKey);
    const at = selectedIndex >= 0 ? selectedIndex + 1 : items.length;
    changeItems([...items.slice(0, at), item, ...items.slice(at)]);
    setSelectedKey(item.key);
    window.setTimeout(() => {
      document.getElementById(`editor-item-${item.key}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  function addItem(type: FormItemType) {
    insertItem({
      key: newKey(),
      type,
      systemField: null,
      label: "",
      description: "",
      imageUrl: null,
      required: false,
      config: {},
      options: usesCustomOptions({ type, systemField: null })
        ? [{ key: newKey(), label: t("forms.editor.optionDefault", { n: 1 }), imageUrl: null }]
        : [],
    });
  }

  function addSystemField(field: AttendeeSystemField) {
    insertItem({
      key: newKey(),
      type: SYSTEM_FIELD_TYPES[field],
      systemField: field,
      label: t(`forms.systemFields.${field}`),
      description: "",
      imageUrl: null,
      required: requiredSystemFields.has(field),
      config: {},
      options: [],
    });
  }

  const tabs: Array<{ key: Tab; label: string; icon: typeof Palette }> = [
    { key: "edit", label: t("forms.builder.tabs.edit"), icon: Palette },
    { key: "settings", label: t("forms.builder.tabs.settings"), icon: Settings2 },
    { key: "preview", label: t("forms.builder.tabs.preview"), icon: Eye },
    { key: "responses", label: t("forms.builder.tabs.responses", { count: form.responseCount }), icon: Table2 },
  ];

  const publicUrl = publicFormUrl(form.publicToken);
  const eventSeriesName = seriesQuery.data?.find((series) => series.id === design.eventSeriesId)?.name ?? null;
  const previewForm = {
    title: design.title || form.title,
    description: design.description || null,
    theme: design.theme,
    items: items.map(toFormItem),
    attendeeTypeOptions: form.attendeeTypeOptions,
    eventSeriesName,
  };

  const addBar = (
    <AddBar
      missingSystemFields={missingSystemFields}
      onAdd={addItem}
      onAddSystemField={addSystemField}
    />
  );

  return (
    <div className="space-y-5">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Link className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900" to="/app/forms">
              <ArrowLeft className="size-4" />
              {t("forms.builder.backToForms")}
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="break-words font-display text-2xl font-semibold text-slate-900">{design.title || form.title}</h1>
              <Badge className={FORM_STATUS_STYLES[form.status]}>{t(`forms.status.${form.status}`)}</Badge>
              {hasUnsavedChanges ? <span className="text-xs font-medium text-amber-700">{t("forms.builder.unsaved")}</span> : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {form.status !== "DRAFT" ? (
              <>
                <Button
                  icon={<Copy className="size-4" />}
                  onClick={async () => {
                    await navigator.clipboard.writeText(publicUrl);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 2000);
                  }}
                  type="button"
                  variant="secondary"
                >
                  {copied ? t("forms.list.copied") : t("forms.list.copyLink")}
                </Button>
                <a href={publicUrl} rel="noreferrer" target="_blank">
                  <Button icon={<ExternalLink className="size-4" />} type="button" variant="secondary">
                    {t("forms.list.open")}
                  </Button>
                </a>
              </>
            ) : null}
            <Button
              disabled={!canSave}
              icon={<Save className="size-4" />}
              onClick={save}
              type="button"
              variant={form.status === "DRAFT" ? "secondary" : "primary"}
            >
              {saveMutation.isPending ? t("forms.builder.saving") : hasUnsavedChanges ? t("forms.builder.save") : t("forms.builder.saved")}
            </Button>
            {form.status === "DRAFT" ? (
              <Button
                disabled={saveMutation.isPending || !design.title.trim()}
                onClick={() => saveMutation.mutate({ publish: true })}
                type="button"
              >
                {t("forms.builder.publish")}
              </Button>
            ) : null}
          </div>
        </div>

        {saveMutation.isError ? (
          <p className="rounded-[8px] bg-rose-50 px-3 py-2 text-sm text-rose-700">{getErrorMessage(saveMutation.error)}</p>
        ) : null}

        <div className="flex flex-wrap gap-1 border-t border-[var(--color-border)] pt-3">
          {tabs.map((entry) => (
            <button
              key={entry.key}
              className={cn(
                "inline-flex items-center gap-2 rounded-[8px] px-4 py-2 text-sm font-medium transition",
                tab === entry.key
                  ? "bg-amber-50 text-amber-800"
                  : "text-slate-600 hover:bg-[var(--color-surface-soft)] hover:text-slate-900",
              )}
              onClick={() => setSearchParams(entry.key === "edit" ? {} : { tab: entry.key }, { replace: true })}
              type="button"
            >
              <entry.icon className="size-4" />
              {entry.label}
            </button>
          ))}
        </div>
      </Card>

      {tab === "edit" ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="min-w-0 space-y-3">
            {form.responseCount > 0 ? (
              <p className="rounded-[8px] bg-amber-50 px-4 py-3 text-sm text-amber-800">{t("forms.builder.hasResponsesNote")}</p>
            ) : null}
            <div className="overflow-hidden rounded-[12px] border border-[var(--color-border)] shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 text-xs font-medium text-white">
                <MousePointerClick className="size-3.5" />
                {t("forms.builder.editHint")}
              </div>
              <div onClick={() => setSelectedKey(null)}>
                <FormThemeFrame className="min-h-[640px] pb-16" theme={design.theme}>
                  <FormHeader
                    descriptionSlot={
                      <InlineText
                        multiline
                        onChange={(description) => changeDesign({ description })}
                        placeholder={t("forms.editor.formDescriptionPlaceholder")}
                        value={design.description}
                      />
                    }
                    form={previewForm}
                    titleSlot={
                      <InlineText
                        onChange={(title) => changeDesign({ title })}
                        placeholder={t("forms.editor.formTitlePlaceholder")}
                        value={design.title}
                      />
                    }
                  />

                  <FormItemsGrid>
                    {items.map((item, index) => (
                      <FormItemSlot key={item.key} addBar={selectedKey === item.key ? addBar : null} item={item}>
                        <FormItemEditor
                          attendeeTypeOptions={form.attendeeTypeOptions}
                          index={index}
                          item={item}
                          lockedRequired={Boolean(item.systemField && requiredSystemFields.has(item.systemField))}
                          onChange={(next) => changeItems(items.map((current) => (current.key === item.key ? next : current)))}
                          onDuplicate={() =>
                            insertItem({
                              ...item,
                              key: newKey(),
                              id: undefined,
                              options: item.options.map((option) => ({ ...option, key: newKey(), id: undefined })),
                            })
                          }
                          onMove={(direction) => {
                            const next = [...items];
                            const target = index + direction;
                            [next[index], next[target]] = [next[target], next[index]];
                            changeItems(next);
                          }}
                          onRemove={() => {
                            changeItems(items.filter((current) => current.key !== item.key));
                            if (selectedKey === item.key) setSelectedKey(null);
                          }}
                          onSelect={() => setSelectedKey(item.key)}
                          selected={selectedKey === item.key}
                          total={items.length}
                          uploadImage={uploadImage}
                        />
                      </FormItemSlot>
                    ))}
                  </FormItemsGrid>

                  {selectedKey === null ? addBar : null}

                  <div className="pointer-events-none">
                    <FormNavigation isLastPage pageCount={1} pageIndex={0} />
                  </div>
                </FormThemeFrame>
              </div>
            </div>
            <p className="px-1 text-xs leading-5 text-slate-500">{t("forms.builder.attendeeFieldsHint")}</p>
          </div>

          <DesignPanel onChange={changeTheme} theme={design.theme} uploadImage={uploadImage} />
        </div>
      ) : null}

      {tab === "settings" ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">{t("forms.design.general")}</h2>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">{t("forms.list.formTitle")}</span>
              <Input onChange={(event) => changeDesign({ title: event.target.value })} value={design.title} />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">{t("forms.list.formDescription")}</span>
              <textarea
                className="min-h-28 w-full rounded-[8px] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-200"
                onChange={(event) => changeDesign({ description: event.target.value })}
                value={design.description}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">{t("forms.list.eventSeries")}</span>
              <Select onChange={(event) => changeDesign({ eventSeriesId: event.target.value })} value={design.eventSeriesId}>
                <option value="">{t("forms.list.noEventSeries")}</option>
                {(seriesQuery.data ?? []).map((series) => (
                  <option key={series.id} value={series.id}>
                    {series.name}
                  </option>
                ))}
              </Select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">{t("forms.design.status")}</span>
                <Select onChange={(event) => changeDesign({ status: event.target.value as FormStatus })} value={design.status}>
                  {(["DRAFT", "PUBLISHED", "CLOSED"] as const).map((status) => (
                    <option key={status} value={status}>
                      {t(`forms.status.${status}`)}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  {t("forms.design.closesAt")} <span className="text-slate-400">({t("common.optional")})</span>
                </span>
                <Input onChange={(event) => changeDesign({ closesAt: event.target.value })} type="datetime-local" value={design.closesAt} />
              </label>
            </div>
            <p className="text-xs text-slate-500">{t("forms.design.statusHint")}</p>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">{t("forms.design.afterSubmit")}</h2>
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                checked={Boolean(design.settings.sendQrEmailOnSubmit)}
                className="mt-0.5 size-4 accent-amber-600"
                onChange={(event) => changeDesign({ settings: { ...design.settings, sendQrEmailOnSubmit: event.target.checked } })}
                type="checkbox"
              />
              <span>
                <span className="font-medium text-slate-900">{t("forms.design.sendQrEmail")}</span>
                <span className="block text-xs text-slate-500">{t("forms.design.sendQrEmailHint")}</span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                checked={Boolean(design.settings.showQrOnSuccess)}
                className="mt-0.5 size-4 accent-amber-600"
                onChange={(event) => changeDesign({ settings: { ...design.settings, showQrOnSuccess: event.target.checked } })}
                type="checkbox"
              />
              <span>
                <span className="font-medium text-slate-900">{t("forms.design.showQr")}</span>
                <span className="block text-xs text-slate-500">{t("forms.design.showQrHint")}</span>
              </span>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">{t("forms.design.confirmationMessage")}</span>
              <textarea
                className="min-h-24 w-full rounded-[8px] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-200"
                onChange={(event) => changeDesign({ settings: { ...design.settings, confirmationMessage: event.target.value } })}
                placeholder={t("forms.public.defaultConfirmation")}
                value={design.settings.confirmationMessage ?? ""}
              />
            </label>
          </Card>
        </div>
      ) : null}

      {tab === "preview" ? (
        <div className="overflow-hidden rounded-[10px] shadow-[var(--shadow-card)]">
          <div className="bg-slate-900 px-4 py-2 text-center text-xs font-medium text-white">{t("forms.builder.previewBanner")}</div>
          <FormRenderer form={previewForm} preview />
        </div>
      ) : null}

      {tab === "responses" ? <FormResponsesPanel formId={form.id} formTitle={form.title} /> : null}
    </div>
  );
}

/** Grid cell for one item; the add bar sits under the selected item so new blocks land there. */
function FormItemSlot({ item, addBar, children }: { item: EditorItem; addBar: ReactNode; children: ReactNode }) {
  return (
    <div className={cn(itemSpanClass(item), "flex flex-col gap-3")}>
      <div className="flex-1">{children}</div>
      {addBar}
    </div>
  );
}

/** Themed "add a block" strip shown inside the form canvas. */
function AddBar({
  missingSystemFields,
  onAdd,
  onAddSystemField,
}: {
  missingSystemFields: AttendeeSystemField[];
  onAdd: (type: FormItemType) => void;
  onAddSystemField: (field: AttendeeSystemField) => void;
}) {
  const { t } = useTranslation();
  const buttonClass = cn(secondaryButtonClass, "px-3 py-2 text-xs");
  const entries: Array<{ type: FormItemType; label: string; icon: typeof Plus }> = [
    { type: "SHORT_TEXT", label: t("forms.builder.addQuestion"), icon: Plus },
    { type: "TITLE_TEXT", label: t("forms.builder.addTitle"), icon: Heading },
    { type: "IMAGE", label: t("forms.builder.addImage"), icon: Image },
    { type: "SECTION", label: t("forms.builder.addSection"), icon: SeparatorHorizontal },
    { type: "DIVIDER", label: t("forms.builder.addDivider"), icon: Minus },
  ];

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-[var(--form-radius)] border-2 border-dashed border-[color-mix(in_srgb,var(--form-accent)_45%,transparent)] bg-[color-mix(in_srgb,var(--form-card)_70%,transparent)] p-3"
      onClick={(event) => event.stopPropagation()}
    >
      <span className="mr-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--form-muted)]">{t("forms.builder.add")}</span>
      {entries.map((entry) => (
        <button key={entry.type} className={buttonClass} onClick={() => onAdd(entry.type)} type="button">
          <entry.icon className="size-3.5" />
          {entry.label}
        </button>
      ))}
      {missingSystemFields.length > 0 ? (
        <label className={cn(buttonClass, "relative cursor-pointer border-sky-500/50 text-sky-600")}>
          <UserRound className="size-3.5" />
          {t("forms.builder.attendeeFields")}
          <select
            aria-label={t("forms.builder.attendeeFields")}
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(event) => {
              if (event.target.value) onAddSystemField(event.target.value as AttendeeSystemField);
              event.target.value = "";
            }}
            value=""
          >
            <option value="">{t("forms.builder.attendeeFields")}</option>
            {missingSystemFields.map((field) => (
              <option key={field} value={field}>
                {t(`forms.systemFields.${field}`)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}

function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-t border-[var(--color-border)] pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</h3>
      {children}
    </section>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-[8px] bg-[var(--color-surface-soft)] p-1">
      {options.map((option) => (
        <button
          key={option.value}
          className={cn(
            "flex-1 whitespace-nowrap rounded-[6px] px-1.5 py-1.5 text-xs font-medium transition",
            value === option.value
              ? "bg-[var(--color-surface)] text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900",
          )}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-[8px] border border-[var(--color-border)] p-1.5 pr-2">
      <input
        className="h-8 w-9 shrink-0 cursor-pointer rounded-[6px] border-0 bg-transparent p-0"
        onChange={(event) => onChange(event.target.value)}
        type="color"
        value={value}
      />
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium text-slate-700">{label}</span>
        <span className="block font-mono text-[11px] uppercase text-slate-400">{value}</span>
      </span>
    </label>
  );
}

/** Theme controls; every change shows on the canvas immediately. */
function DesignPanel({
  theme,
  onChange,
  uploadImage,
}: {
  theme: FormTheme;
  onChange: (patch: Partial<FormTheme>) => void;
  uploadImage: (file: File) => Promise<string>;
}) {
  const { t } = useTranslation();
  const resolved = resolveFormTheme(theme);

  return (
    <Card className="space-y-5 p-5 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:self-start xl:overflow-y-auto">
      <div className="flex items-center gap-2">
        <Palette className="size-4 text-amber-600" />
        <h2 className="text-base font-semibold text-slate-900">{t("forms.design.theme")}</h2>
      </div>

      <PanelSection title={t("forms.design.presets")}>
        <div className="grid grid-cols-4 gap-2">
          {FORM_THEME_PRESETS.map((preset) => {
            const look = resolveFormTheme(preset.theme);
            const active =
              look.accent === resolved.accent && look.background === resolved.background && look.card === resolved.card;
            return (
              <button
                key={preset.key}
                className={cn(
                  "group space-y-1 rounded-[8px] p-1 text-center transition",
                  active ? "ring-2 ring-amber-500" : "hover:bg-[var(--color-surface-soft)]",
                )}
                onClick={() => onChange(preset.theme)}
                title={t(`forms.design.presetNames.${preset.key}`)}
                type="button"
              >
                <span
                  className="flex h-12 items-center justify-center rounded-[6px] border border-black/10"
                  style={{ backgroundColor: look.background }}
                >
                  <span
                    className="flex h-7 w-10 items-center justify-center gap-1 rounded-[4px] text-[11px] font-bold shadow-sm"
                    style={{ backgroundColor: look.card, color: look.text, fontFamily: FORM_FONTS[look.font].family }}
                  >
                    Aa
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: look.accent }} />
                  </span>
                </span>
                <span className="block truncate text-[11px] text-slate-500">{t(`forms.design.presetNames.${preset.key}`)}</span>
              </button>
            );
          })}
        </div>
      </PanelSection>

      <PanelSection title={t("forms.design.colors")}>
        <div className="grid grid-cols-2 gap-2">
          <ColorField label={t("forms.design.colorAccent")} onChange={(primaryColor) => onChange({ primaryColor })} value={resolved.accent} />
          <ColorField
            label={t("forms.design.colorBackground")}
            onChange={(backgroundColor) => onChange({ backgroundColor })}
            value={resolved.background}
          />
          <ColorField label={t("forms.design.colorCard")} onChange={(cardColor) => onChange({ cardColor })} value={resolved.card} />
          <ColorField label={t("forms.design.colorText")} onChange={(textColor) => onChange({ textColor })} value={resolved.text} />
        </div>
      </PanelSection>

      <PanelSection title={t("forms.design.layout")}>
        <Segmented
          onChange={(layout) => onChange({ layout })}
          options={FORM_LAYOUTS.map((value) => ({ value, label: t(`forms.design.layouts.${value}`) }))}
          value={resolved.layout}
        />
        <p className="text-xs text-slate-500">{t(`forms.design.layoutHints.${resolved.layout}`)}</p>
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-slate-600">{t("forms.design.width")}</span>
          <Segmented
            onChange={(width) => onChange({ width })}
            options={FORM_WIDTHS.map((value) => ({ value, label: t(`forms.design.widths.${value}`) }))}
            value={resolved.width}
          />
        </div>
      </PanelSection>

      <PanelSection title={t("forms.design.logo")}>
        <ImagePicker compact onChange={(logoUrl) => onChange({ logoUrl })} uploadImage={uploadImage} value={theme.logoUrl ?? null} />
        {theme.logoUrl ? (
          <>
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-slate-600">{t("forms.design.logoPosition")}</span>
              <Segmented
                onChange={(logoAlign) => onChange({ logoAlign })}
                options={[
                  { value: "left" as const, label: t("forms.editor.alignLeft") },
                  { value: "center" as const, label: t("forms.editor.alignCenter") },
                  { value: "right" as const, label: t("forms.editor.alignRight") },
                ]}
                value={resolved.logoAlign}
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-slate-600">{t("forms.design.logoSize")}</span>
              <Segmented
                onChange={(logoSize) => onChange({ logoSize })}
                options={[
                  { value: "small" as const, label: t("forms.editor.sizeSmall") },
                  { value: "medium" as const, label: t("forms.editor.sizeMedium") },
                  { value: "large" as const, label: t("forms.editor.sizeLarge") },
                ]}
                value={resolved.logoSize}
              />
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-500">{t("forms.design.logoHint")}</p>
        )}
      </PanelSection>

      <PanelSection title={t("forms.design.header")}>
        <Segmented
          onChange={(headerStyle) => onChange({ headerStyle })}
          options={FORM_HEADER_STYLES.map((value) => ({ value, label: t(`forms.design.headerStyles.${value}`) }))}
          value={resolved.headerStyle}
        />
        <Segmented
          onChange={(headerAlign) => onChange({ headerAlign })}
          options={[
            { value: "left" as const, label: t("forms.editor.alignLeft") },
            { value: "center" as const, label: t("forms.editor.alignCenter") },
          ]}
          value={resolved.headerAlign}
        />
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-slate-600">{t("forms.design.headerImage")}</span>
          <ImagePicker
            compact
            onChange={(headerImageUrl) => onChange({ headerImageUrl })}
            uploadImage={uploadImage}
            value={theme.headerImageUrl ?? null}
          />
          <p className="text-xs text-slate-500">{t("forms.design.headerImageHint")}</p>
        </div>
      </PanelSection>

      <PanelSection title={t("forms.design.backgroundImage")}>
        <ImagePicker
          compact
          onChange={(backgroundImageUrl) => onChange({ backgroundImageUrl })}
          uploadImage={uploadImage}
          value={theme.backgroundImageUrl ?? null}
        />
      </PanelSection>

      <PanelSection title={t("forms.design.typography")}>
        <Select onChange={(event) => onChange({ font: event.target.value as FormFont })} value={resolved.font}>
          {(Object.keys(FORM_FONTS) as FormFont[]).map((font) => (
            <option key={font} value={font}>
              {FORM_FONTS[font].label}
            </option>
          ))}
        </Select>
      </PanelSection>

      <PanelSection title={t("forms.design.shape")}>
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-slate-600">{t("forms.design.corners")}</span>
          <Segmented
            onChange={(radius) => onChange({ radius })}
            options={FORM_RADII.map((value) => ({ value, label: t(`forms.design.radii.${value}`) }))}
            value={resolved.radius}
          />
        </div>
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-slate-600">{t("forms.design.inputs")}</span>
          <Segmented
            onChange={(inputStyle) => onChange({ inputStyle })}
            options={FORM_INPUT_STYLES.map((value) => ({ value, label: t(`forms.design.inputStyles.${value}`) }))}
            value={resolved.inputStyle}
          />
        </div>
      </PanelSection>
    </Card>
  );
}
