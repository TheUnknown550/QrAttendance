import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { isQuestion, resolveFormTheme } from "../../lib/forms";
import { cn, resolveMediaUrl } from "../../lib/utils";
import type { FormItem, FormTheme } from "../../types/api";
import {
  FormThemeContext,
  LAYOUT_GAP,
  OPTION_COLUMNS_CLASS,
  WIDTH_CLASS,
  choiceRowClass,
  ensureFontLoaded,
  inputClass,
  itemSpanClass,
  primaryButtonClass,
  secondaryButtonClass,
  themeStyle,
  useFormTheme,
} from "./form-theme";

export type FormAnswerValue = string | string[];
export type FormAnswers = Record<string, FormAnswerValue>;

export type RenderableForm = {
  title: string;
  description: string | null;
  theme: FormTheme | null;
  items: FormItem[];
  attendeeTypeOptions: string[];
  organizationName?: string | null;
  eventSeriesName?: string | null;
};

type FormRendererProps = {
  form: RenderableForm;
  /** Preview mode renders the form but never submits it. */
  preview?: boolean;
  submitting?: boolean;
  serverErrors?: Record<string, string>;
  submitError?: string | null;
  onSubmit?: (answers: FormAnswers) => void;
  footer?: ReactNode;
  className?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmpty(value: FormAnswerValue | undefined) {
  return value === undefined || (Array.isArray(value) ? value.length === 0 : value.trim() === "");
}

/** Splits the items into pages at each SECTION block, like Google Forms sections. */
function splitIntoPages(items: FormItem[]) {
  const pages: FormItem[][] = [[]];

  for (const item of items) {
    if (item.type === "SECTION" && pages[pages.length - 1].length > 0) {
      pages.push([]);
    }

    pages[pages.length - 1].push(item);
  }

  return pages;
}

/** Applies the form's theme (colors, font, layout) to everything inside it. */
export function FormThemeFrame({
  theme,
  children,
  className,
}: {
  theme: FormTheme | null;
  children: ReactNode;
  className?: string;
}) {
  const resolved = useMemo(() => resolveFormTheme(theme), [theme]);

  useEffect(() => {
    ensureFontLoaded(resolved.font);
  }, [resolved.font]);

  const single = resolved.layout === "single";

  return (
    <FormThemeContext.Provider value={resolved}>
      <div className={cn("px-4 py-8 sm:py-10", className)} style={themeStyle(resolved)}>
        <div
          className={cn(
            "mx-auto w-full",
            WIDTH_CLASS[resolved.width],
            single
              ? "space-y-3 rounded-[var(--form-radius)] border border-[var(--form-border)] bg-[var(--form-card)] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.10)] sm:p-8"
              : resolved.layout === "minimal"
                ? "space-y-7"
                : "space-y-4",
            single && resolved.headerStyle !== "simple" && "border-t-[6px] border-t-[var(--form-accent)]",
          )}
        >
          {children}
        </div>
      </div>
    </FormThemeContext.Provider>
  );
}

/** A block of the form. In the "cards" layout it is a card; otherwise it sits on the page. */
export function FormCard({ className, children, accentTop }: { className?: string; children: ReactNode; accentTop?: boolean }) {
  const theme = useFormTheme();

  if (theme.layout !== "cards") {
    return (
      <div className={cn("py-2", accentTop && "mt-2 border-t-2 border-t-[var(--form-accent)] pt-5", className)}>{children}</div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[var(--form-radius)] border border-[var(--form-border)] bg-[var(--form-card)] p-6 shadow-[0_6px_20px_rgba(15,23,42,0.06)]",
        accentTop && "border-t-[6px] border-t-[var(--form-accent)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ItemImage({ src, size, align, alt }: { src: string; size?: string | null; align?: string | null; alt: string }) {
  const resolved = resolveMediaUrl(src);
  if (!resolved) return null;

  return (
    <div className={cn("flex", align === "center" ? "justify-center" : "justify-start")}>
      <img
        alt={alt}
        className={cn(
          "rounded-[var(--form-control-radius)] object-contain",
          size === "small" ? "max-h-48" : size === "medium" ? "max-h-80" : "w-full",
        )}
        loading="lazy"
        src={resolved}
      />
    </div>
  );
}

export function QuestionInput({
  item,
  value,
  attendeeTypeOptions,
  onChange,
  disabled,
}: {
  item: FormItem;
  value: FormAnswerValue | undefined;
  attendeeTypeOptions: string[];
  onChange: (value: FormAnswerValue) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const theme = useFormTheme();
  const fieldClass = inputClass(theme);
  const text = typeof value === "string" ? value : "";
  const placeholder = item.config?.placeholder ?? undefined;

  if (item.systemField === "ATTENDEE_TYPE") {
    return (
      <select className={fieldClass} disabled={disabled} onChange={(event) => onChange(event.target.value)} value={text}>
        <option value="">{t("forms.renderer.choose")}</option>
        {attendeeTypeOptions.map((label) => (
          <option key={label} value={label}>
            {label}
          </option>
        ))}
      </select>
    );
  }

  switch (item.type) {
    case "PARAGRAPH":
      return (
        <textarea
          className={cn(fieldClass, "min-h-28 resize-y")}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder ?? t("forms.renderer.yourAnswer")}
          value={text}
        />
      );
    case "NUMBER":
      return (
        <input
          className={fieldClass}
          disabled={disabled}
          inputMode="decimal"
          max={item.config?.max ?? undefined}
          min={item.config?.min ?? undefined}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder ?? t("forms.renderer.yourAnswer")}
          type="number"
          value={text}
        />
      );
    case "DATE":
      return (
        <input
          className={cn(fieldClass, "sm:max-w-xs")}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          type="date"
          value={text}
        />
      );
    case "MULTIPLE_CHOICE":
    case "CHECKBOXES": {
      const multiple = item.type === "CHECKBOXES";
      const selected = Array.isArray(value) ? value : text ? [text] : [];

      return (
        <div className={cn("grid gap-2", OPTION_COLUMNS_CLASS[item.config?.columns ?? 1])}>
          {item.options.map((option) => {
            const checked = selected.includes(option.id);
            const optionImage = resolveMediaUrl(option.imageUrl);

            return (
              <label key={option.id} className={cn(choiceRowClass(checked), disabled ? "cursor-default" : "cursor-pointer")}>
                <input
                  checked={checked}
                  className="mt-0.5 size-4 shrink-0 accent-[var(--form-accent)]"
                  disabled={disabled}
                  name={item.id}
                  onChange={() => {
                    if (multiple) {
                      onChange(checked ? selected.filter((id) => id !== option.id) : [...selected, option.id]);
                    } else {
                      onChange(option.id);
                    }
                  }}
                  type={multiple ? "checkbox" : "radio"}
                />
                <span className="min-w-0 flex-1">
                  <span className="break-words">{option.label}</span>
                  {optionImage ? (
                    <img
                      alt={option.label}
                      className="mt-2 max-h-40 rounded-[var(--form-control-radius)] object-contain"
                      loading="lazy"
                      src={optionImage}
                    />
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
      );
    }
    case "DROPDOWN":
      return (
        <select className={fieldClass} disabled={disabled} onChange={(event) => onChange(event.target.value)} value={text}>
          <option value="">{t("forms.renderer.choose")}</option>
          {item.options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      );
    default:
      return (
        <input
          autoComplete={
            item.systemField === "FIRST_NAME"
              ? "given-name"
              : item.systemField === "SURNAME"
                ? "family-name"
                : item.type === "EMAIL"
                  ? "email"
                  : item.type === "PHONE"
                    ? "tel"
                    : item.systemField === "ORGANIZATION_NAME"
                      ? "organization"
                      : "off"
          }
          className={fieldClass}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder ?? t("forms.renderer.yourAnswer")}
          type={item.type === "EMAIL" ? "email" : item.type === "PHONE" ? "tel" : "text"}
          value={text}
        />
      );
  }
}

export function FormItemView({
  item,
  value,
  error,
  attendeeTypeOptions,
  onChange,
  disabled,
}: {
  item: FormItem;
  value?: FormAnswerValue;
  error?: string;
  attendeeTypeOptions: string[];
  onChange?: (value: FormAnswerValue) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const align = item.config?.align;

  if (item.type === "DIVIDER") {
    return <hr className="my-2 border-t-2 border-[color-mix(in_srgb,var(--form-accent)_35%,transparent)]" />;
  }

  if (item.type === "SECTION") {
    return (
      <FormCard accentTop>
        {item.label ? <h2 className="text-xl font-semibold">{item.label}</h2> : null}
        {item.description ? <p className="mt-2 whitespace-pre-line text-sm text-[var(--form-muted)]">{item.description}</p> : null}
      </FormCard>
    );
  }

  if (item.type === "TITLE_TEXT") {
    return (
      <FormCard className={align === "center" ? "text-center" : undefined}>
        {item.label ? <h3 className="text-lg font-semibold">{item.label}</h3> : null}
        {item.description ? (
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--form-muted)]">{item.description}</p>
        ) : null}
        {item.imageUrl ? (
          <div className="mt-4">
            <ItemImage align={align} alt={item.label ?? ""} size={item.config?.imageSize} src={item.imageUrl} />
          </div>
        ) : null}
      </FormCard>
    );
  }

  if (item.type === "IMAGE") {
    return (
      <FormCard className="space-y-3">
        {item.label ? <p className={cn("font-semibold", align === "center" && "text-center")}>{item.label}</p> : null}
        {item.imageUrl ? (
          <ItemImage align={align} alt={item.label ?? ""} size={item.config?.imageSize} src={item.imageUrl} />
        ) : (
          <div className="flex h-32 items-center justify-center rounded-[var(--form-control-radius)] bg-[var(--form-subtle)] text-sm text-[var(--form-faint)]">
            {t("forms.renderer.noImage")}
          </div>
        )}
        {item.description ? (
          <p className={cn("whitespace-pre-line text-sm text-[var(--form-muted)]", align === "center" && "text-center")}>
            {item.description}
          </p>
        ) : null}
      </FormCard>
    );
  }

  return (
    <FormCard className={cn("h-full", error && "border-rose-400")}>
      <QuestionHeading item={item} />
      {item.imageUrl ? (
        <div className="mt-3">
          <ItemImage align={align} alt={item.label ?? ""} size={item.config?.imageSize ?? "medium"} src={item.imageUrl} />
        </div>
      ) : null}
      <div className="mt-4">
        <QuestionInput
          attendeeTypeOptions={attendeeTypeOptions}
          disabled={disabled}
          item={item}
          onChange={(next) => onChange?.(next)}
          value={value}
        />
      </div>
      {error ? <p className="mt-2 text-sm text-rose-500">{error}</p> : null}
    </FormCard>
  );
}

function QuestionHeading({ item }: { item: FormItem }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-1">
      <p className="break-words text-base font-medium">
        {item.label || t("forms.renderer.untitledQuestion")}
        {item.required ? <span className="ml-1 text-rose-500">*</span> : null}
      </p>
      {item.description ? <p className="whitespace-pre-line text-sm text-[var(--form-muted)]">{item.description}</p> : null}
    </div>
  );
}

/**
 * The title block. The editor passes `titleSlot` / `descriptionSlot` to edit the
 * text in place while everything around it stays exactly as the public form.
 */
export function FormHeader({
  form,
  titleSlot,
  descriptionSlot,
}: {
  form: RenderableForm;
  titleSlot?: ReactNode;
  descriptionSlot?: ReactNode;
}) {
  const { t } = useTranslation();
  const theme = useFormTheme();
  const headerImage = resolveMediaUrl(theme.headerImageUrl);
  const hasRequired = form.items.some((item) => item.required && isQuestion(item.type));
  const meta = [form.organizationName, form.eventSeriesName].filter(Boolean).join(" · ");
  const center = theme.headerAlign === "center";
  const description = descriptionSlot ?? form.description;
  const requiredHint = hasRequired ? <p className="text-xs text-rose-500">* {t("forms.renderer.requiredHint")}</p> : null;

  if (theme.headerStyle === "cover") {
    return (
      <>
        <div
          className="relative overflow-hidden rounded-[var(--form-radius)] shadow-[0_10px_30px_rgba(15,23,42,0.18)]"
          style={{ backgroundColor: "var(--form-accent)", color: headerImage ? "#ffffff" : "var(--form-on-accent)" }}
        >
          {headerImage ? (
            <>
              <img alt="" className="absolute inset-0 size-full object-cover" src={headerImage} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
            </>
          ) : null}
          <div className={cn("relative flex min-h-56 flex-col justify-end p-6 sm:p-8", center && "items-center text-center")}>
            {meta ? <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">{meta}</p> : null}
            <h1 className="mt-2 w-full break-words text-3xl font-bold sm:text-4xl">{titleSlot ?? form.title}</h1>
            {description ? <div className="mt-3 w-full whitespace-pre-line text-sm leading-6 opacity-90">{description}</div> : null}
          </div>
        </div>
        {requiredHint ? <div className={cn("px-1", center && "text-center")}>{requiredHint}</div> : null}
      </>
    );
  }

  return (
    <>
      {headerImage ? (
        <img
          alt=""
          className="aspect-[4/1] w-full rounded-[var(--form-radius)] object-cover shadow-[0_6px_20px_rgba(15,23,42,0.08)]"
          src={headerImage}
        />
      ) : null}
      <FormCard
        accentTop={theme.headerStyle === "banner" && theme.layout !== "single"}
        className={center ? "text-center" : undefined}
      >
        {meta ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--form-accent)]">{meta}</p> : null}
        <h1 className="mt-2 break-words text-3xl font-semibold">{titleSlot ?? form.title}</h1>
        {description ? (
          <div className="mt-3 whitespace-pre-line text-sm leading-6 text-[var(--form-muted)]">{description}</div>
        ) : null}
        {requiredHint ? <div className="mt-4">{requiredHint}</div> : null}
      </FormCard>
    </>
  );
}

/** Lays items out in the two-column grid (half-width questions share a row). */
export function FormItemsGrid({ children }: { children: ReactNode }) {
  const theme = useFormTheme();
  return <div className={cn("grid grid-cols-2 gap-x-4", LAYOUT_GAP[theme.layout])}>{children}</div>;
}

export function FormRenderer({
  form,
  preview,
  submitting,
  serverErrors,
  submitError,
  onSubmit,
  footer,
  className,
}: FormRendererProps) {
  const { t } = useTranslation();
  const pages = useMemo(() => splitIntoPages(form.items), [form.items]);
  const [pageIndex, setPageIndex] = useState(0);
  const [answers, setAnswers] = useState<FormAnswers>({});
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const safePageIndex = Math.min(pageIndex, pages.length - 1);
  const currentPage = pages[safePageIndex] ?? [];
  const isLastPage = safePageIndex === pages.length - 1;
  const errors = { ...serverErrors, ...clientErrors };

  function validate(items: FormItem[]) {
    const nextErrors: Record<string, string> = {};

    for (const item of items) {
      if (!isQuestion(item.type)) continue;
      const value = answers[item.id];

      if (isEmpty(value)) {
        if (item.required) nextErrors[item.id] = t("forms.renderer.requiredError");
        continue;
      }

      if (item.type === "EMAIL" && typeof value === "string" && !emailPattern.test(value.trim())) {
        nextErrors[item.id] = t("forms.renderer.emailError");
      }
    }

    return nextErrors;
  }

  function goTo(index: number) {
    setPageIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Jump back to the page holding the first error the server reported.
  const firstServerErrorPage = serverErrors
    ? pages.findIndex((page) => page.some((item) => serverErrors[item.id]))
    : -1;

  return (
    <FormThemeFrame className={className} theme={form.theme}>
      <FormHeader form={form} />

      <form
        className="space-y-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (preview) {
            if (!isLastPage) goTo(safePageIndex + 1);
            return;
          }

          const pageErrors = validate(currentPage);
          setClientErrors(pageErrors);
          const firstErrorId = currentPage.find((item) => pageErrors[item.id])?.id;
          if (firstErrorId) {
            document.getElementById(`form-item-${firstErrorId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
          }

          if (!isLastPage) {
            goTo(safePageIndex + 1);
            return;
          }

          const allErrors = validate(form.items);
          setClientErrors(allErrors);
          if (Object.keys(allErrors).length > 0) {
            goTo(pages.findIndex((page) => page.some((item) => allErrors[item.id])));
            return;
          }

          onSubmit?.(answers);
        }}
      >
        <FormItemsGrid>
          {currentPage.map((item) => (
            <div key={item.id} className={cn("scroll-mt-6", itemSpanClass(item))} id={`form-item-${item.id}`}>
              <FormItemView
                attendeeTypeOptions={form.attendeeTypeOptions}
                error={errors[item.id]}
                item={item}
                onChange={(value) => {
                  setAnswers((current) => ({ ...current, [item.id]: value }));
                  setClientErrors((current) => {
                    const next = { ...current };
                    delete next[item.id];
                    return next;
                  });
                }}
                value={answers[item.id]}
              />
            </div>
          ))}
        </FormItemsGrid>

        {submitError ? (
          <div className="rounded-[var(--form-control-radius)] border border-rose-300 bg-[#fff1f2] px-4 py-3 text-sm text-rose-700">
            {submitError}
            {firstServerErrorPage >= 0 && firstServerErrorPage !== safePageIndex ? (
              <button className="ml-2 font-semibold underline" onClick={() => goTo(firstServerErrorPage)} type="button">
                {t("forms.renderer.showProblem")}
              </button>
            ) : null}
          </div>
        ) : null}

        <FormNavigation
          isLastPage={isLastPage}
          onBack={safePageIndex > 0 ? () => goTo(safePageIndex - 1) : undefined}
          pageCount={pages.length}
          pageIndex={safePageIndex}
          submitDisabled={submitting || (preview && isLastPage)}
          submitting={submitting}
        />
        {footer}
      </form>
    </FormThemeFrame>
  );
}

/** Back / Next / Submit row with the page progress bar. */
export function FormNavigation({
  isLastPage,
  pageIndex,
  pageCount,
  submitting,
  submitDisabled,
  onBack,
}: {
  isLastPage: boolean;
  pageIndex: number;
  pageCount: number;
  submitting?: boolean;
  submitDisabled?: boolean;
  onBack?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-2">
        {onBack ? (
          <button className={secondaryButtonClass} onClick={onBack} type="button">
            <ChevronLeft className="size-4" />
            {t("forms.renderer.back")}
          </button>
        ) : null}
        <button className={primaryButtonClass} disabled={submitDisabled} type="submit">
          {isLastPage ? (submitting ? t("forms.renderer.submitting") : t("forms.renderer.submit")) : t("forms.renderer.next")}
          {!isLastPage ? <ChevronRight className="size-4" /> : null}
        </button>
      </div>
      {pageCount > 1 ? (
        <div className="flex items-center gap-3 text-xs text-[var(--form-muted)]">
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-[var(--form-border)]">
            <div
              className="h-full rounded-full bg-[var(--form-accent)] transition-all"
              style={{ width: `${((pageIndex + 1) / pageCount) * 100}%` }}
            />
          </div>
          {t("forms.renderer.pageOf", { current: pageIndex + 1, total: pageCount })}
        </div>
      ) : null}
    </div>
  );
}
