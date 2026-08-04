import { useTheme } from "../../lib/theme";
import { cn } from "../../lib/utils";

type BrandBadgeProps = {
  className?: string;
  compact?: boolean;
  forceVariant?: "light" | "dark";
};

export function BrandBadge({ className, compact = false, forceVariant }: BrandBadgeProps) {
  const { theme } = useTheme();
  const variant = forceVariant ?? theme;
  const src = variant === "dark" ? "/logo-dark.png" : "/logo.png";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("inline-flex items-center justify-center", compact ? "rounded-[12px]" : "rounded-[14px]")}>
        <img
          alt="Magitecx logo"
          className={cn("w-auto object-contain", compact ? "h-8" : "h-10")}
          src={src}
        />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Powered by
        </p>
        <p className={compact ? "text-sm font-semibold text-slate-900" : "text-base font-semibold text-slate-900"}>
          Magitecx
        </p>
      </div>
    </div>
  );
}
