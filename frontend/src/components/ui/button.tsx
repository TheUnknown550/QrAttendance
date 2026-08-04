import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: ReactNode;
};

const variants = {
  primary:
    "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-strong)] shadow-[0_8px_18px_rgba(180,83,9,0.14)]",
  secondary:
    "bg-[var(--color-surface-soft)] text-slate-700 hover:bg-[var(--color-surface)]",
  ghost:
    "bg-transparent text-slate-600 hover:bg-[var(--color-surface-soft)]",
  danger:
    "bg-rose-50 text-rose-700 hover:bg-rose-100",
};

export function Button({ className, variant = "primary", icon, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[8px] px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
