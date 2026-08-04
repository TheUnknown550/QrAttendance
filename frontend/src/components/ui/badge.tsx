import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[6px] bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700",
        className,
      )}
      {...props}
    />
  );
}
