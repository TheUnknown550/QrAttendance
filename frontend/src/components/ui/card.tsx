import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[10px] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]",
        className,
      )}
      {...props}
    />
  );
}
