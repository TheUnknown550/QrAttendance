import { useTheme } from "../../lib/theme";
import { cn } from "../../lib/utils";

type BrandLogoProps = {
  alt?: string;
  className?: string;
  imageClassName?: string;
  forceVariant?: "light" | "dark";
};

export function BrandLogo({
  alt = "EventQR logo",
  className,
  imageClassName,
  forceVariant,
}: BrandLogoProps) {
  const { theme } = useTheme();
  const variant = forceVariant ?? theme;
  const src = variant === "dark" ? "/eventqr-mark-dark.svg" : "/eventqr-mark-light.svg";

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-[8px] bg-[var(--color-surface)] p-2 shadow-[0_8px_18px_rgba(15,23,42,0.05)]",
        className,
      )}
    >
      <img alt={alt} className={cn("h-10 w-10", imageClassName)} src={src} />
    </div>
  );
}
