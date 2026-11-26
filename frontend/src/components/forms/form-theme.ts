import { createContext, useContext, type CSSProperties } from "react";
import { FORM_FONTS, isDarkColor, isQuestion, readableOn, resolveFormTheme, type ResolvedFormTheme } from "../../lib/forms";
import { cn, resolveMediaUrl } from "../../lib/utils";
import type { FormItem } from "../../types/api";

export const FormThemeContext = createContext<ResolvedFormTheme>(resolveFormTheme(null));

export function useFormTheme() {
  return useContext(FormThemeContext);
}

const RADIUS_PX = {
  none: { card: 0, control: 0 },
  small: { card: 6, control: 4 },
  medium: { card: 12, control: 8 },
  large: { card: 22, control: 14 },
} as const;

export const WIDTH_CLASS = {
  narrow: "max-w-xl",
  medium: "max-w-2xl",
  wide: "max-w-4xl",
} as const;

/**
 * Every color in the form is read from these variables, so the public form, the
 * preview and the editor all look the same and ignore the admin app's dark mode.
 */
export function themeStyle(theme: ResolvedFormTheme): CSSProperties {
  const radius = RADIUS_PX[theme.radius];
  const backgroundImage = resolveMediaUrl(theme.backgroundImageUrl);
  const surface = theme.layout === "minimal" ? theme.background : theme.card;

  return {
    "--form-accent": theme.accent,
    "--form-on-accent": readableOn(theme.accent),
    "--form-bg": theme.background,
    "--form-card": theme.card,
    "--form-text": theme.text,
    "--form-muted": `color-mix(in srgb, ${theme.text} 68%, transparent)`,
    "--form-faint": `color-mix(in srgb, ${theme.text} 45%, transparent)`,
    "--form-border": `color-mix(in srgb, ${theme.text} 16%, transparent)`,
    "--form-subtle": `color-mix(in srgb, ${theme.text} 5%, transparent)`,
    "--form-fill": `color-mix(in srgb, ${theme.text} 7%, ${theme.card})`,
    "--form-radius": `${radius.card}px`,
    "--form-control-radius": `${radius.control}px`,
    color: theme.text,
    backgroundColor: theme.background,
    backgroundImage: backgroundImage ? `url("${backgroundImage}")` : undefined,
    backgroundSize: backgroundImage ? "cover" : undefined,
    backgroundPosition: backgroundImage ? "center" : undefined,
    backgroundAttachment: backgroundImage ? "fixed" : undefined,
    fontFamily: FORM_FONTS[theme.font].family,
    // Native inputs (checkboxes, date pickers, dropdown lists) follow the form surface.
    colorScheme: isDarkColor(surface) ? "dark" : "light",
  } as CSSProperties;
}

/** Loads a Google font once per page. */
export function ensureFontLoaded(font: ResolvedFormTheme["font"]) {
  const spec = FORM_FONTS[font].google;
  if (!spec || typeof document === "undefined") return;
  const id = `form-font-${font}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`;
  document.head.appendChild(link);
}

const inputBase =
  "w-full text-sm text-[var(--form-text)] outline-none transition placeholder:text-[var(--form-faint)] disabled:cursor-default";

export function inputClass(theme: ResolvedFormTheme) {
  switch (theme.inputStyle) {
    case "filled":
      return `${inputBase} rounded-[var(--form-control-radius)] border border-transparent bg-[var(--form-fill)] px-4 py-3 focus:border-[var(--form-accent)]`;
    case "underline":
      return `${inputBase} rounded-none border-0 border-b-2 border-[var(--form-border)] bg-transparent px-1 py-2.5 focus:border-[var(--form-accent)]`;
    default:
      return `${inputBase} rounded-[var(--form-control-radius)] border border-[var(--form-border)] bg-[var(--form-card)] px-4 py-3 focus:border-[var(--form-accent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--form-accent)_25%,transparent)]`;
  }
}

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-[var(--form-control-radius)] bg-[var(--form-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--form-on-accent)] shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-[var(--form-control-radius)] border border-[var(--form-border)] bg-[var(--form-card)] px-4 py-2.5 text-sm font-semibold text-[var(--form-text)] transition hover:bg-[var(--form-subtle)]";

/** The shape of a choice row, shared by the form and the editor so both look the same. */
export function choiceRowClass(checked: boolean) {
  return cn(
    "flex items-start gap-3 rounded-[var(--form-control-radius)] border px-4 py-3 text-sm transition",
    checked
      ? "border-[var(--form-accent)] bg-[color-mix(in_srgb,var(--form-accent)_12%,var(--form-card))]"
      : "border-[var(--form-border)] hover:bg-[var(--form-subtle)]",
  );
}

/** Half-width questions take one of the two grid columns on wider screens. */
export function itemSpanClass(item: Pick<FormItem, "type" | "config">) {
  return item.config?.width === "half" && isQuestion(item.type) ? "col-span-2 sm:col-span-1" : "col-span-2";
}

export const OPTION_COLUMNS_CLASS = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
} as const;

/** Gap between blocks for each layout. */
export const LAYOUT_GAP = {
  cards: "gap-4",
  single: "gap-2",
  minimal: "gap-7",
} as const;
