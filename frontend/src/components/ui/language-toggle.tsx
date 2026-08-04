import type { HTMLAttributes } from "react";
import { useTranslation } from "react-i18next";
import { setLanguage, type Language } from "../../lib/i18n";
import { cn } from "../../lib/utils";

export function LanguageToggle({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { i18n } = useTranslation();
  const currentLanguage = (i18n.language === "th" ? "th" : "en") as Language;

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-[10px] border border-[var(--color-border)] bg-[var(--color-panel)] p-1 shadow-[var(--shadow-card)] backdrop-blur",
        className,
      )}
      {...props}
    >
      {(["en", "th"] as Language[]).map((language) => (
        <button
          aria-label={`Switch language to ${language === "en" ? "English" : "Thai"}`}
          aria-pressed={currentLanguage === language}
          className={cn(
            "inline-flex h-9 min-w-9 items-center justify-center rounded-[8px] px-2 text-xs font-semibold uppercase tracking-wide transition",
            currentLanguage === language
              ? "bg-[var(--color-surface)] text-slate-900 shadow-[0_2px_10px_rgba(15,23,42,0.06)]"
              : "text-slate-500 hover:text-slate-900",
          )}
          key={language}
          onClick={() => setLanguage(language)}
          type="button"
        >
          {language}
        </button>
      ))}
    </div>
  );
}
