import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "../../lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[10px] bg-[var(--color-surface)] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.18)]",
          className,
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          {title ? <h2 className="text-xl font-semibold text-slate-900">{title}</h2> : <span />}
          <button
            className="rounded-[10px] p-2 text-slate-400 transition hover:bg-[var(--color-surface-soft)] hover:text-slate-700"
            onClick={onClose}
            type="button"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
