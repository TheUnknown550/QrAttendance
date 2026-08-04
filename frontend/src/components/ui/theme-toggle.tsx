import type { HTMLAttributes } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "../../lib/theme";
import { cn } from "../../lib/utils";

export function ThemeToggle({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { mode, toggleTheme } = useTheme();

  const icon =
    mode === "light" ? <Sun className="size-4" /> : mode === "dark" ? <Moon className="size-4" /> : <Monitor className="size-4" />;

  const nextMode = mode === "system" ? "light" : mode === "light" ? "dark" : "system";
  const nextLabel = nextMode === "light" ? "light" : nextMode === "dark" ? "dark" : "system";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-[10px] border border-[var(--color-border)] bg-[var(--color-panel)] p-1 shadow-[var(--shadow-card)] backdrop-blur",
        className,
      )}
      {...props}
    >
      <button
        aria-label={`Switch theme mode to ${nextLabel}`}
        className="inline-flex size-9 items-center justify-center rounded-[8px] bg-[var(--color-surface)] text-slate-900 shadow-[0_2px_10px_rgba(15,23,42,0.06)] transition hover:bg-[var(--color-surface-soft)]"
        onClick={toggleTheme}
        type="button"
      >
        {icon}
      </button>
    </div>
  );
}
