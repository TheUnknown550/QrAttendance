import { ChevronDown, ArrowRightLeft, PlusCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrapResponse } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { AuthResponse } from "../../types/api";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

type OrganizationSwitcherProps = {
  className?: string;
  compact?: boolean;
};

export function OrganizationSwitcher({ className, compact = false }: OrganizationSwitcherProps) {
  const { auth, activeMembership, setAuthState } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const switchMutation = useMutation({
    mutationFn: async (organizationId: string) =>
      unwrapResponse<AuthResponse>(await api.post("/auth/switch-organization", { organizationId })),
    onSuccess: (result) => {
      queryClient.removeQueries({ queryKey: ["attendees"] });
      queryClient.removeQueries({ queryKey: ["attendees-summary"] });
      queryClient.removeQueries({ queryKey: ["event-series"] });
      queryClient.removeQueries({ queryKey: ["series-report"] });
      queryClient.removeQueries({ queryKey: ["scanner-share-link"] });
      queryClient.removeQueries({ queryKey: ["organization-current"] });
      queryClient.removeQueries({ queryKey: ["organization-current-banner"] });
      setAuthState(result);
      setOpen(false);
      const sectionRoots = [
        "/app/event-series",
        "/app/attendees",
        "/app/scanner",
        "/app/settings",
        "/app/reports",
      ];
      const matchedRoot = sectionRoots.find((p) => location.pathname.startsWith(p)) ?? "/app";
      navigate(matchedRoot);
    },
  });

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current || menuRef.current.contains(event.target as Node)) {
        return;
      }
      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleToggle() {
    setOpen((o) => !o);
  }

  const memberships = auth?.memberships ?? [];
  const currentName = activeMembership?.organizationName ?? "No active organization";
  const currentRole = activeMembership?.role?.toLowerCase() ?? "";

  const containerClassName = useMemo(
    () => cn("relative", className, compact ? "w-full" : "w-full sm:w-auto"),
    [className, compact],
  );
  const panelClassName = compact
    ? "absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-[var(--color-panel)] shadow-[var(--shadow-panel)]"
    : "absolute right-0 top-full z-50 mt-2 w-[min(352px,calc(100vw-2rem))] overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-[var(--color-panel)] shadow-[var(--shadow-panel)]";

  return (
    <div className={containerClassName} ref={menuRef}>
      <div>
        <Button
          aria-expanded={open}
          aria-haspopup="menu"
          className="w-full justify-between"
          icon={<ChevronDown className={cn("size-4 transition", open && "rotate-180")} />}
          onClick={handleToggle}
          type="button"
          variant="secondary"
        >
          <span className="min-w-0 truncate">
            {compact ? currentName : `Workspace: ${currentName}`}
          </span>
        </Button>
      </div>

      {open ? (
        <div className={panelClassName}>
          <div className="border-b border-[var(--color-border)] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Current workspace</p>
            <p className="mt-2 break-words text-sm font-semibold text-slate-900">{currentName}</p>
            {currentRole ? <p className="mt-1 text-xs text-slate-500">{currentRole} access</p> : null}
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            {memberships.map((membership) => {
              const active = membership.organizationId === auth?.activeOrganizationId;
              return (
                <button
                  key={membership.membershipId}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-[8px] px-3 py-3 text-left text-sm transition",
                    active
                      ? "bg-[var(--color-surface-soft)] text-slate-900"
                      : "text-slate-600 hover:bg-[var(--color-surface-soft)] hover:text-slate-900",
                  )}
                  disabled={switchMutation.isPending}
                  onClick={() => switchMutation.mutate(membership.organizationId)}
                  type="button"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{membership.organizationName}</span>
                    <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">
                      {membership.role.toLowerCase()}
                    </span>
                  </span>
                  {active ? <span className="text-xs font-semibold text-emerald-700">Active</span> : null}
                </button>
              );
            })}

            {memberships.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-slate-500">No organizations available.</div>
            ) : null}
          </div>

          <div className="grid gap-2 border-t border-[var(--color-border)] p-3">
            <Link to="/app/onboarding">
              <Button className="w-full justify-start" icon={<PlusCircle className="size-4" />} variant="secondary">
                Create or join
              </Button>
            </Link>
            <Link to="/app/settings/organization">
              <Button className="w-full justify-start" icon={<ArrowRightLeft className="size-4" />} variant="ghost">
                Manage workspace
              </Button>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
