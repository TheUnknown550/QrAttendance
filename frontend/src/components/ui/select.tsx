import type { SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-[8px] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-200",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
