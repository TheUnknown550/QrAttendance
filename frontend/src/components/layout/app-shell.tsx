import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  OctagonAlert,
  LogOut,
  Settings2,
  PlusCircle,
  Radio,
  Sheet,
  Users,
  X,
} from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../lib/auth";
import { api, unwrapResponse } from "../../lib/api";
import { cn, formatDate } from "../../lib/utils";
import type { OrganizationDetail } from "../../types/api";
import { BrandBadge } from "../brand/brand-badge";
import { BrandLogo } from "../brand/brand-logo";
import { OrganizationSwitcher } from "../org/organization-switcher";
import { Seo } from "../seo/seo";
import { Button } from "../ui/button";
import { ThemeToggle } from "../ui/theme-toggle";

const navigation = [
  { to: "/app", label: "Dashboard", icon: BarChart3 },
  { to: "/app/event-series", label: "Event Series", icon: CalendarDays },
  { to: "/app/attendees", label: "Attendees", icon: Users },
  { to: "/app/scanner", label: "Scanner", icon: Radio },
  { to: "/app/reports", label: "Reports", icon: Sheet },
  { to: "/app/settings/account", label: "Settings", icon: Settings2 },
];

const INACTIVE_BANNER_DISMISS_KEY = "eventqr-inactive-banner-dismissed";

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeMembership, auth, logout } = useAuth();
  const [dismissedBannerKey, setDismissedBannerKey] = useState<string | null>(() =>
    typeof window === "undefined" ? null : window.localStorage.getItem(INACTIVE_BANNER_DISMISS_KEY),
  );

  const pathLabel =
    navigation.find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))
      ?.label ?? "Workspace";
  const workspaceTitle = activeMembership?.organizationName ? `${pathLabel} · ${activeMembership.organizationName}` : pathLabel;

  const organizationQuery = useQuery({
    queryKey: ["organization-current-banner", auth?.activeOrganizationId],
    enabled: Boolean(auth?.activeOrganizationId),
    queryFn: async () => unwrapResponse<OrganizationDetail>(await api.get("/organizations/current")),
  });

  const inactiveBannerKey = useMemo(() => {
    const organization = organizationQuery.data;

    if (!organization || organization.lifecycle.status !== "INACTIVE") {
      return null;
    }

    return `${organization.id}:${organization.lifecycle.scheduledDeletionAt ?? "inactive"}`;
  }, [organizationQuery.data]);

  const showInactiveBanner = Boolean(
    organizationQuery.data &&
      organizationQuery.data.lifecycle.status === "INACTIVE" &&
      inactiveBannerKey &&
      inactiveBannerKey !== dismissedBannerKey,
  );

  useEffect(() => {
    if (!inactiveBannerKey || inactiveBannerKey === dismissedBannerKey) {
      return;
    }

    window.localStorage.removeItem(INACTIVE_BANNER_DISMISS_KEY);
    setDismissedBannerKey(null);
  }, [dismissedBannerKey, inactiveBannerKey]);

  return (
    <div className="min-h-screen text-slate-900">
      <Seo noindex pathname={location.pathname} title={workspaceTitle} />
      <ThemeToggle className="fixed right-3 top-3 z-50 lg:right-6 lg:top-6" />
      <div className="mx-auto grid min-h-screen max-w-[1480px] gap-5 px-4 py-20 lg:grid-cols-[248px_minmax(0,1fr)] lg:px-6 lg:py-4">
        <aside className="rounded-[10px] bg-[var(--color-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur">
          <div className="flex items-center gap-3">
            <BrandLogo imageClassName="h-12" />
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-amber-700">Attendance</p>
              <h1 className="font-display text-2xl font-semibold text-slate-900">EventQR</h1>
            </div>
          </div>

          <div className="mt-8 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-[8px] px-4 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-[var(--color-surface)] text-slate-900 shadow-[0_4px_14px_rgba(15,23,42,0.05)]"
                      : "text-slate-600 hover:bg-[var(--color-surface-soft)] hover:text-slate-900",
                  )
                }
                end={item.to === "/app"}
                to={item.to}
              >
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="mt-8 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Quick start</p>
            <div className="mt-3 grid gap-2 md:grid-cols-3 lg:grid-cols-1">
              <Link
                className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-[var(--color-surface-soft)] hover:text-slate-900"
                to="/app/event-series"
              >
                Create series
              </Link>
              <Link
                className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-[var(--color-surface-soft)] hover:text-slate-900"
                to="/app/attendees"
              >
                Add attendees
              </Link>
              <Link
                className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-[var(--color-surface-soft)] hover:text-slate-900"
                to="/app/scanner"
              >
                Start scanner
              </Link>
            </div>
          </div>

          <div className="mt-8 border-t border-[var(--color-border)] pt-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Workspace</p>
            <p className="mt-2 break-words text-lg font-semibold text-slate-900">
              {activeMembership?.organizationName ?? "No active organization"}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Switch workspaces from the menu below.
            </p>
            <div className="mt-3">
              <OrganizationSwitcher compact />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Link to="/app/onboarding">
                <Button className="w-full" variant="ghost">
                  Create or join
                </Button>
              </Link>
              <Link to="/app/settings/organization">
                <Button className="w-full" variant="ghost">
                  Org settings
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-8 border-t border-[var(--color-border)] pt-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Account</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{auth?.user.name}</p>
            <p className="break-words text-sm text-slate-500">{auth?.user.email}</p>
          </div>

          <Button
            className="mt-6 w-full"
            icon={<LogOut className="size-4" />}
            onClick={() => {
              logout();
              navigate("/");
            }}
            variant="ghost"
          >
            Log out
          </Button>

          <div className="mt-6">
            <BrandBadge compact />
            <p className="mt-2 text-xs text-slate-500">
              Support:{" "}
              <a className="font-medium text-amber-700 hover:text-amber-800" href="mailto:support@magitecx.com">
                support@magitecx.com
              </a>
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
              <Link className="hover:text-slate-900" to="/privacy">
                Privacy
              </Link>
              <Link className="hover:text-slate-900" to="/terms">
                Terms
              </Link>
            </div>
          </div>
        </aside>

        <main className="min-w-0 py-2">
          {showInactiveBanner && organizationQuery.data ? (
            <div className="mb-6 rounded-[8px] bg-rose-50 px-5 py-4 shadow-[0_10px_28px_rgba(244,63,94,0.08)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="rounded-[8px] bg-white p-3 text-rose-700">
                    <OctagonAlert className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">Workspace inactivity warning</p>
                    <p className="mt-1 break-words text-sm text-slate-600">
                      {organizationQuery.data.name} is inactive. If no new activity happens, it will be permanently deleted on{" "}
                      <span className="font-semibold text-rose-700">
                        {organizationQuery.data.lifecycle.scheduledDeletionAt
                          ? formatDate(organizationQuery.data.lifecycle.scheduledDeletionAt)
                          : "the scheduled purge date"}
                      </span>.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link to="/app/settings/organization">
                        <Button type="button" variant="secondary">View details</Button>
                      </Link>
                    </div>
                  </div>
                </div>
                <Button
                  aria-label="Dismiss inactivity warning"
                  icon={<X className="size-4" />}
                  onClick={() => {
                    if (!inactiveBannerKey) {
                      return;
                    }

                    window.localStorage.setItem(INACTIVE_BANNER_DISMISS_KEY, inactiveBannerKey);
                    setDismissedBannerKey(inactiveBannerKey);
                  }}
                  type="button"
                  variant="ghost"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : null}

          <div className="mb-6 flex flex-col gap-4 rounded-[10px] bg-[var(--color-panel)] px-5 py-4 shadow-[var(--shadow-card)] backdrop-blur xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Workspace</p>
              <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2 text-sm text-slate-500">
                <span className="font-semibold text-slate-900">
                  {activeMembership?.organizationName ?? "No active organization"}
                </span>
                <ChevronRight className="size-4" />
                <span className="font-medium text-slate-900">{pathLabel}</span>
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 xl:flex xl:w-auto xl:flex-wrap">
              <Link to="/app/event-series">
                <Button className="w-full" icon={<PlusCircle className="size-4" />} variant="secondary">
                  New series
                </Button>
              </Link>
              <Link to="/app/attendees">
                <Button className="w-full" icon={<Users className="size-4" />} variant="secondary">
                  Add attendee
                </Button>
              </Link>
              <Link to="/app/scanner">
                <Button className="w-full" icon={<Radio className="size-4" />}>Open scanner</Button>
              </Link>
              <Link to="/app/settings/account">
                <Button className="w-full" icon={<Sheet className="size-4" />} variant="ghost">
                  Account
                </Button>
              </Link>
            </div>
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  );
}
