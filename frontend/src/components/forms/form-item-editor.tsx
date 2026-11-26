import {
  AlignCenter,
  AlignLeft,
  ArrowDown,
  ArrowUp,
  Columns2,
  Copy,
  ImagePlus,
  Lock,
  Plus,
  RectangleHorizontal,
  SlidersHorizontal,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  ITEM_TYPE_ICONS,
  QUESTION_ITEM_TYPES,
  isQuestion,
  newKey,
  toFormItem,
  usesCustomOptions,
  type EditorItem,
} from "../../lib/forms";
import { cn, resolveMediaUrl } from "../../lib/utils";
import type { FormItemConfig, FormItemType } from "../../types/api";
import { Button } from "../ui/button";
import { FormCard, FormItemView, ItemImage, QuestionInput } from "./form-renderer";
import { OPTION_COLUMNS_CLASS, choiceRowClass, inputClass, useFormTheme } from "./form-theme";

type UploadImage = (file: File) => Promise<string>;

/** Image upload control for the admin side panel (uses the app's own styling). */
export function ImagePicker({
  value,
  onChange,
  uploadImage,
  compact,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  uploadImage: UploadImage;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preview = resolveMediaUrl(value);

  return (
    <div className="space-y-2">
      <input
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setUploading(true);
          setError(null);
          try {
            onChange(await uploadImage(file));
          } catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : String(uploadError));
          } finally {
            setUploading(false);
          }
        }}
        ref={inputRef}
        type="file"
      />
      {preview ? (
        <div className="relative inline-block">
          <img alt="" className={cn("rounded-[8px] object-contain", compact ? "max-h-24" : "max-h-56")} src={preview} />
          <button
            aria-label={t("forms.editor.removeImage")}
            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
            onClick={() => onChange(null)}
            type="button"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : null}
      <Button
        disabled={uploading}
        icon={<ImagePlus className="size-4" />}
        onClick={() => inputRef.current?.click()}
        type="button"
        variant="secondary"
      >
        {uploading ? t("forms.editor.uploading") : preview ? t("forms.editor.replaceImage") : t("forms.editor.addImage")}
      </Button>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

/**
 * Text that looks like the finished form but can be typed into. It inherits the
 * font, size and color of where it sits, and grows with its content.
 */
export function InlineText({
  value,
  onChange,
  placeholder,
  multiline,
  className,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      autoFocus={autoFocus}
      className={cn(
        "block w-full resize-none overflow-hidden border-0 border-b border-dashed border-transparent bg-transparent p-0 pb-0.5 [color:inherit] outline-none transition placeholder:text-current placeholder:opacity-45 hover:border-[color-mix(in_srgb,currentColor_35%,transparent)] focus:border-solid focus:border-[var(--form-accent)]",
        className,
      )}
      onChange={(event) => onChange(multiline ? event.target.value : event.target.value.replace(/\n/g, " "))}
      onKeyDown={(event) => {
        if (!multiline && event.key === "Enter") event.preventDefault();
      }}
      placeholder={placeholder}
      ref={ref}
      rows={1}
      value={value}
    />
  );
}

/** A label wrapping a hidden file input, so clicking it opens the file picker. */
function UploadTrigger({
  uploadImage,
  onUploaded,
  className,
  label,
  children,
}: {
  uploadImage: UploadImage;
  onUploaded: (url: string) => void;
  className?: string;
  label: string;
  children: (uploading: boolean) => ReactNode;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <label aria-label={label} className={cn("cursor-pointer", uploading && "pointer-events-none opacity-60", className)} title={label}>
        <input
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          disabled={uploading}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            setUploading(true);
            setError(null);
            try {
              onUploaded(await uploadImage(file));
            } catch (uploadError) {
              setError(uploadError instanceof Error ? uploadError.message : String(uploadError));
            } finally {
              setUploading(false);
            }
          }}
          type="file"
        />
        {children(uploading)}
      </label>
      {error ? <span className="basis-full text-xs text-rose-500">{error}</span> : null}
    </>
  );
}

const toolButtonBase =
  "inline-flex items-center gap-1.5 rounded-[6px] p-2 text-xs font-medium transition hover:bg-[var(--form-subtle)] hover:text-[var(--form-text)]";

function ToolButton({
  label,
  onClick,
  disabled,
  active,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        toolButtonBase,
        "disabled:opacity-30",
        danger && "hover:bg-rose-500/10 hover:text-rose-500",
        active && "bg-[var(--form-subtle)] text-[var(--form-accent)]",
      )}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

/** Image with a remove button, as it will appear in the form. */
function EditableImage({ src, size, align, onRemove }: { src: string; size?: string | null; align?: string | null; onRemove: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="group/image relative">
      <ItemImage align={align} alt="" size={size} src={src} />
      <button
        aria-label={t("forms.editor.removeImage")}
        className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-80 transition hover:bg-black/80 group-hover/image:opacity-100"
        onClick={onRemove}
        type="button"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

type FormItemEditorProps = {
  item: EditorItem;
  index: number;
  total: number;
  selected: boolean;
  lockedRequired: boolean;
  attendeeTypeOptions: string[];
  onSelect: () => void;
  onChange: (item: EditorItem) => void;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  uploadImage: UploadImage;
};

/**
 * One block on the editing canvas. Unselected, it is drawn exactly like the public
 * form; selected, the same block becomes editable in place with a toolbar below.
 */
export function FormItemEditor(props: FormItemEditorProps) {
  const { item, selected, onSelect, lockedRequired } = props;
  const { t } = useTranslation();
  const Icon = ITEM_TYPE_ICONS[item.type];
  const chipLabel = item.systemField
    ? t("forms.editor.attendeeField", { field: t(`forms.systemFields.${item.systemField}`) })
    : t(`forms.types.${item.type}`);

  return (
    <div
      className={cn(
        "group/item relative h-full rounded-[var(--form-radius)] outline-offset-4 transition",
        selected
          ? "outline-2 outline-[var(--form-accent)]"
          : "cursor-pointer hover:outline-2 hover:outline-dashed hover:outline-[color-mix(in_srgb,var(--form-accent)_60%,transparent)]",
      )}
      id={`editor-item-${item.key}`}
      onClick={(event) => {
        event.stopPropagation();
        if (!selected) onSelect();
      }}
      onKeyDown={(event) => {
        if (!selected && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onSelect();
        }
      }}
      role={selected ? undefined : "button"}
      tabIndex={selected ? undefined : 0}
    >
      <span
        className={cn(
          "pointer-events-none absolute -top-3 left-4 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold shadow-sm transition",
          item.systemField ? "bg-sky-600 text-white" : "bg-[var(--form-accent)] text-[var(--form-on-accent)]",
          selected ? "opacity-100" : "opacity-0 group-hover/item:opacity-100",
        )}
      >
        {item.systemField ? <UserRound className="size-3" /> : <Icon className="size-3" />}
        {chipLabel}
        {lockedRequired ? <Lock className="size-3" /> : null}
      </span>

      {selected ? (
        <SelectedItemEditor {...props} />
      ) : (
        <div className="pointer-events-none h-full">
          <FormItemView attendeeTypeOptions={props.attendeeTypeOptions} disabled item={toFormItem(item)} />
        </div>
      )}
    </div>
  );
}

function SelectedItemEditor({
  item,
  index,
  total,
  lockedRequired,
  attendeeTypeOptions,
  onChange,
  onMove,
  onDuplicate,
  onRemove,
  uploadImage,
}: FormItemEditorProps) {
  const { t } = useTranslation();
  const theme = useFormTheme();
  const [showMore, setShowMore] = useState(false);
  const isSystem = Boolean(item.systemField);
  const question = isQuestion(item.type);
  const update = (patch: Partial<EditorItem>) => onChange({ ...item, ...patch });
  const updateConfig = (patch: Partial<FormItemConfig>) => update({ config: { ...item.config, ...patch } });
  const align = item.config.align;
  const supportsImage = item.type === "IMAGE" || item.type === "TITLE_TEXT" || question;
  const hasMoreOptions = question && ["SHORT_TEXT", "PARAGRAPH", "NUMBER", "EMAIL", "PHONE"].includes(item.type);
  const choiceList = item.type === "MULTIPLE_CHOICE" || item.type === "CHECKBOXES";
  const smallField = cn(inputClass(theme), "py-2 text-xs");

  const toolbar = (
    <div className="mt-5 flex flex-wrap items-center gap-1 border-t border-[var(--form-border)] pt-3 text-[var(--form-muted)]">
      {question && !isSystem ? (
        <select
          aria-label={t("forms.editor.questionType")}
          className="mr-1 rounded-[var(--form-control-radius)] border border-[var(--form-border)] bg-[var(--form-card)] px-3 py-2 text-xs font-medium text-[var(--form-text)] outline-none focus:border-[var(--form-accent)]"
          onChange={(event) => {
            const type = event.target.value as FormItemType;
            const next: Partial<EditorItem> = { type };
            if (usesCustomOptions({ type, systemField: null }) && item.options.length === 0) {
              next.options = [{ key: newKey(), label: t("forms.editor.optionDefault", { n: 1 }), imageUrl: null }];
            }
            update(next);
          }}
          value={item.type}
        >
          {QUESTION_ITEM_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`forms.types.${type}`)}
            </option>
          ))}
        </select>
      ) : null}

      {supportsImage ? (
        <UploadTrigger
          className={toolButtonBase}
          label={item.imageUrl ? t("forms.editor.replaceImage") : t("forms.editor.addImage")}
          onUploaded={(imageUrl) => update({ imageUrl })}
          uploadImage={uploadImage}
        >
          {(uploading) => (
            <>
              <ImagePlus className="size-4" />
              <span className="hidden sm:inline">{uploading ? t("forms.editor.uploading") : t("forms.editor.image")}</span>
            </>
          )}
        </UploadTrigger>
      ) : null}

      {item.imageUrl ? (
        <select
          aria-label={t("forms.editor.imageSize")}
          className="rounded-[6px] bg-transparent px-2 py-2 text-xs font-medium outline-none hover:bg-[var(--form-subtle)]"
          onChange={(event) => updateConfig({ imageSize: event.target.value as FormItemConfig["imageSize"] })}
          title={t("forms.editor.imageSize")}
          value={item.config.imageSize ?? (question ? "medium" : "full")}
        >
          <option value="small">{t("forms.editor.sizeSmall")}</option>
          <option value="medium">{t("forms.editor.sizeMedium")}</option>
          <option value="full">{t("forms.editor.sizeFull")}</option>
        </select>
      ) : null}

      {item.type === "TITLE_TEXT" || item.type === "IMAGE" || item.imageUrl ? (
        <ToolButton
          active={align === "center"}
          label={align === "center" ? t("forms.editor.alignLeft") : t("forms.editor.alignCenter")}
          onClick={() => updateConfig({ align: align === "center" ? "left" : "center" })}
        >
          {align === "center" ? <AlignCenter className="size-4" /> : <AlignLeft className="size-4" />}
        </ToolButton>
      ) : null}

      {question ? (
        <ToolButton
          active={item.config.width === "half"}
          label={item.config.width === "half" ? t("forms.editor.fullWidth") : t("forms.editor.halfWidth")}
          onClick={() => updateConfig({ width: item.config.width === "half" ? "full" : "half" })}
        >
          {item.config.width === "half" ? <Columns2 className="size-4" /> : <RectangleHorizontal className="size-4" />}
          <span className="hidden sm:inline">
            {item.config.width === "half" ? t("forms.editor.halfWidthShort") : t("forms.editor.fullWidthShort")}
          </span>
        </ToolButton>
      ) : null}

      {choiceList ? (
        <select
          aria-label={t("forms.editor.columns")}
          className="rounded-[6px] bg-transparent px-2 py-2 text-xs font-medium outline-none hover:bg-[var(--form-subtle)]"
          onChange={(event) => updateConfig({ columns: Number(event.target.value) as 1 | 2 | 3 })}
          title={t("forms.editor.columns")}
          value={item.config.columns ?? 1}
        >
          {[1, 2, 3].map((count) => (
            <option key={count} value={count}>
              {t("forms.editor.columnsCount", { count })}
            </option>
          ))}
        </select>
      ) : null}

      {hasMoreOptions ? (
        <ToolButton active={showMore} label={t("forms.editor.moreOptions")} onClick={() => setShowMore((current) => !current)}>
          <SlidersHorizontal className="size-4" />
        </ToolButton>
      ) : null}

      <div className="ml-auto flex items-center gap-1">
        <ToolButton disabled={index === 0} label={t("forms.editor.moveUp")} onClick={() => onMove(-1)}>
          <ArrowUp className="size-4" />
        </ToolButton>
        <ToolButton disabled={index === total - 1} label={t("forms.editor.moveDown")} onClick={() => onMove(1)}>
          <ArrowDown className="size-4" />
        </ToolButton>
        {!isSystem ? (
          <ToolButton label={t("forms.editor.duplicate")} onClick={onDuplicate}>
            <Copy className="size-4" />
          </ToolButton>
        ) : null}
        <ToolButton
          danger
          disabled={lockedRequired}
          label={lockedRequired ? t("forms.editor.cannotRemove") : t("common.delete")}
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </ToolButton>

        {question ? (
          <label
            className={cn(
              "ml-2 flex items-center gap-2 border-l border-[var(--form-border)] pl-3 text-xs font-medium text-[var(--form-text)]",
              lockedRequired ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            )}
            title={lockedRequired ? t("forms.editor.alwaysRequired") : undefined}
          >
            {t("forms.editor.required")}
            <button
              aria-checked={item.required}
              className={cn(
                "relative h-5 w-9 rounded-full transition",
                item.required ? "bg-[var(--form-accent)]" : "bg-[var(--form-border)]",
              )}
              disabled={lockedRequired}
              onClick={() => update({ required: !item.required })}
              role="switch"
              type="button"
            >
              <span
                className={cn(
                  "absolute top-0.5 size-4 rounded-full bg-white shadow transition-all",
                  item.required ? "left-[18px]" : "left-0.5",
                )}
              />
            </button>
          </label>
        ) : null}
      </div>

      {showMore && hasMoreOptions ? (
        <div className="mt-2 grid basis-full gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-xs sm:col-span-1">
            <span>{t("forms.editor.placeholder")}</span>
            <input
              className={smallField}
              onChange={(event) => updateConfig({ placeholder: event.target.value || null })}
              placeholder={t("forms.renderer.yourAnswer")}
              value={item.config.placeholder ?? ""}
            />
          </label>
          {item.type === "NUMBER" ? (
            <>
              <label className="space-y-1 text-xs">
                <span>{t("forms.editor.min")}</span>
                <input
                  className={smallField}
                  onChange={(event) => updateConfig({ min: event.target.value === "" ? null : Number(event.target.value) })}
                  type="number"
                  value={item.config.min ?? ""}
                />
              </label>
              <label className="space-y-1 text-xs">
                <span>{t("forms.editor.max")}</span>
                <input
                  className={smallField}
                  onChange={(event) => updateConfig({ max: event.target.value === "" ? null : Number(event.target.value) })}
                  type="number"
                  value={item.config.max ?? ""}
                />
              </label>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  const image = item.imageUrl ? (
    <EditableImage
      align={align}
      onRemove={() => update({ imageUrl: null })}
      size={item.config.imageSize ?? (question ? "medium" : "full")}
      src={item.imageUrl}
    />
  ) : null;

  if (item.type === "DIVIDER") {
    return (
      <FormCard>
        <hr className="my-2 border-t-2 border-[color-mix(in_srgb,var(--form-accent)_35%,transparent)]" />
        <p className="text-xs text-[var(--form-muted)]">{t("forms.editor.dividerHint")}</p>
        {toolbar}
      </FormCard>
    );
  }

  if (item.type === "SECTION") {
    return (
      <FormCard accentTop>
        <InlineText
          autoFocus={!item.label}
          className="text-xl font-semibold"
          onChange={(label) => update({ label })}
          placeholder={t("forms.editor.sectionPlaceholder")}
          value={item.label}
        />
        <InlineText
          className="mt-2 text-sm text-[var(--form-muted)]"
          multiline
          onChange={(description) => update({ description })}
          placeholder={t("forms.editor.descriptionPlaceholder")}
          value={item.description}
        />
        {toolbar}
      </FormCard>
    );
  }

  if (item.type === "TITLE_TEXT") {
    return (
      <FormCard className={align === "center" ? "text-center" : undefined}>
        <InlineText
          autoFocus={!item.label}
          className="text-lg font-semibold"
          onChange={(label) => update({ label })}
          placeholder={t("forms.editor.titlePlaceholder")}
          value={item.label}
        />
        <InlineText
          className="mt-2 text-sm leading-6 text-[var(--form-muted)]"
          multiline
          onChange={(description) => update({ description })}
          placeholder={t("forms.editor.bodyPlaceholder")}
          value={item.description}
        />
        {image ? <div className="mt-4">{image}</div> : null}
        {toolbar}
      </FormCard>
    );
  }

  if (item.type === "IMAGE") {
    return (
      <FormCard className="space-y-3">
        <InlineText
          className={cn("font-semibold", align === "center" && "text-center")}
          onChange={(label) => update({ label })}
          placeholder={t("forms.editor.imageTitlePlaceholder")}
          value={item.label}
        />
        {image ?? (
          <UploadTrigger
            className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-[var(--form-control-radius)] border-2 border-dashed border-[var(--form-border)] text-sm text-[var(--form-muted)] transition hover:border-[var(--form-accent)] hover:text-[var(--form-accent)]"
            label={t("forms.editor.addImage")}
            onUploaded={(imageUrl) => update({ imageUrl })}
            uploadImage={uploadImage}
          >
            {(uploading) => (
              <>
                <ImagePlus className="size-6" />
                {uploading ? t("forms.editor.uploading") : t("forms.editor.addImage")}
              </>
            )}
          </UploadTrigger>
        )}
        <InlineText
          className={cn("text-sm text-[var(--form-muted)]", align === "center" && "text-center")}
          multiline
          onChange={(description) => update({ description })}
          placeholder={t("forms.editor.captionPlaceholder")}
          value={item.description}
        />
        {toolbar}
      </FormCard>
    );
  }

  return (
    <FormCard className="h-full">
      <div className="space-y-1">
        <div className="flex items-start gap-1 text-base font-medium">
          <InlineText
            autoFocus={!item.label}
            onChange={(label) => update({ label })}
            placeholder={t("forms.editor.questionPlaceholder")}
            value={item.label}
          />
          {item.required ? <span className="text-rose-500">*</span> : null}
        </div>
        <InlineText
          className="text-sm text-[var(--form-muted)]"
          multiline
          onChange={(description) => update({ description })}
          placeholder={t("forms.editor.descriptionPlaceholder")}
          value={item.description}
        />
      </div>
      {image ? <div className="mt-3">{image}</div> : null}

      <div className="mt-4">
        {choiceList && usesCustomOptions(item) ? (
          <ChoiceOptionsEditor item={item} update={update} uploadImage={uploadImage} />
        ) : item.type === "DROPDOWN" && usesCustomOptions(item) ? (
          <DropdownOptionsEditor item={item} update={update} />
        ) : (
          <>
            <QuestionInput attendeeTypeOptions={attendeeTypeOptions} disabled item={toFormItem(item)} onChange={() => undefined} value={undefined} />
            {item.systemField === "PROFILE_PHOTO" ? (
              <p className="mt-2 text-xs text-[var(--form-muted)]">{t("forms.editor.profilePhotoHint")}</p>
            ) : null}
            {item.systemField === "ATTENDEE_TYPE" ? (
              <p className="mt-2 text-xs text-[var(--form-muted)]">
                {t("forms.editor.attendeeTypeHint", { types: attendeeTypeOptions.join(", ") || "-" })}
              </p>
            ) : null}
          </>
        )}
      </div>
      {toolbar}
    </FormCard>
  );
}

function addOption(item: EditorItem, update: (patch: Partial<EditorItem>) => void, label: string) {
  update({ options: [...item.options, { key: newKey(), label, imageUrl: null }] });
}

/** Radio / checkbox rows drawn like the form, with the label typed in place. */
function ChoiceOptionsEditor({
  item,
  update,
  uploadImage,
}: {
  item: EditorItem;
  update: (patch: Partial<EditorItem>) => void;
  uploadImage: UploadImage;
}) {
  const { t } = useTranslation();
  const multiple = item.type === "CHECKBOXES";
  const setOption = (key: string, patch: Partial<EditorItem["options"][number]>) =>
    update({ options: item.options.map((option) => (option.key === key ? { ...option, ...patch } : option)) });

  return (
    <div className={cn("grid gap-2", OPTION_COLUMNS_CLASS[item.config.columns ?? 1])}>
      {item.options.map((option, optionIndex) => (
        <div key={option.key} className={cn(choiceRowClass(false), "group/option items-start")}>
          <input className="mt-0.5 size-4 shrink-0 accent-[var(--form-accent)]" disabled type={multiple ? "checkbox" : "radio"} />
          <div className="min-w-0 flex-1">
            <InlineText
              onChange={(label) => setOption(option.key, { label })}
              placeholder={t("forms.editor.optionDefault", { n: optionIndex + 1 })}
              value={option.label}
            />
            {option.imageUrl ? (
              <div className="relative mt-2 inline-block">
                <img
                  alt=""
                  className="max-h-40 rounded-[var(--form-control-radius)] object-contain"
                  src={resolveMediaUrl(option.imageUrl) ?? undefined}
                />
                <button
                  aria-label={t("forms.editor.removeImage")}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  onClick={() => setOption(option.key, { imageUrl: null })}
                  type="button"
                >
                  <X className="size-3" />
                </button>
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-0.5 text-[var(--form-faint)] opacity-60 transition group-hover/option:opacity-100">
            <UploadTrigger
              className="rounded-[6px] p-1 hover:bg-[var(--form-subtle)] hover:text-[var(--form-text)]"
              label={t("forms.editor.addImage")}
              onUploaded={(imageUrl) => setOption(option.key, { imageUrl })}
              uploadImage={uploadImage}
            >
              {() => <ImagePlus className="size-4" />}
            </UploadTrigger>
            <button
              aria-label={t("common.delete")}
              className="rounded-[6px] p-1 hover:bg-rose-500/10 hover:text-rose-500 disabled:opacity-30"
              disabled={item.options.length <= 1}
              onClick={() => update({ options: item.options.filter((current) => current.key !== option.key) })}
              title={t("common.delete")}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ))}
      <button
        className="flex items-center gap-3 rounded-[var(--form-control-radius)] border border-dashed border-[var(--form-border)] px-4 py-3 text-left text-sm text-[var(--form-muted)] transition hover:border-[var(--form-accent)] hover:text-[var(--form-accent)]"
        onClick={() => addOption(item, update, t("forms.editor.optionDefault", { n: item.options.length + 1 }))}
        type="button"
      >
        <Plus className="size-4" />
        {t("forms.editor.addChoice")}
      </button>
    </div>
  );
}

/** Dropdown choices as a numbered list, since a closed dropdown can't show them. */
function DropdownOptionsEditor({ item, update }: { item: EditorItem; update: (patch: Partial<EditorItem>) => void }) {
  const { t } = useTranslation();
  const theme = useFormTheme();

  return (
    <div className={cn(inputClass(theme), "space-y-2")}>
      {item.options.map((option, optionIndex) => (
        <div key={option.key} className="group/option flex items-center gap-3">
          <span className="w-5 shrink-0 text-right text-xs text-[var(--form-faint)]">{optionIndex + 1}.</span>
          <InlineText
            onChange={(label) =>
              update({ options: item.options.map((current) => (current.key === option.key ? { ...current, label } : current)) })
            }
            placeholder={t("forms.editor.optionDefault", { n: optionIndex + 1 })}
            value={option.label}
          />
          <button
            aria-label={t("common.delete")}
            className="shrink-0 rounded-[6px] p-1 text-[var(--form-faint)] opacity-60 transition hover:bg-rose-500/10 hover:text-rose-500 group-hover/option:opacity-100 disabled:opacity-20"
            disabled={item.options.length <= 1}
            onClick={() => update({ options: item.options.filter((current) => current.key !== option.key) })}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
      <button
        className="flex items-center gap-3 text-sm text-[var(--form-muted)] transition hover:text-[var(--form-accent)]"
        onClick={() => addOption(item, update, t("forms.editor.optionDefault", { n: item.options.length + 1 }))}
        type="button"
      >
        <Plus className="ml-1 size-4" />
        {t("forms.editor.addChoice")}
      </button>
    </div>
  );
}
