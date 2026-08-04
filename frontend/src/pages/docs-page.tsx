import {
  BellRing,
  BookOpen,
  Building2,
  Download,
  ScanLine,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { BrandBadge } from "../components/brand/brand-badge";
import { SiteHeader } from "../components/public/site-header";
import { Seo } from "../components/seo/seo";
import { Card } from "../components/ui/card";
import { buildBreadcrumbStructuredData, buildOrganizationStructuredData } from "../lib/seo";

const toc = [
  { id: "overview", label: "Overview" },
  { id: "accounts", label: "Accounts + Workspaces" },
  { id: "attendance", label: "Attendance Flow" },
  { id: "scanner", label: "Scanner + Share Links" },
  { id: "reports", label: "Reports + Export" },
  { id: "security", label: "Security + Data Rules" },
  { id: "deletion", label: "Deletion + Retention" },
  { id: "automation", label: "Automation + Emails" },
];

export function DocsPage() {
  return (
    <div className="min-h-screen px-4 py-20 text-[var(--color-text)] lg:px-6 lg:py-5">
      <Seo
        description="Detailed EventQR product documentation: setup, workspace model, scanning flow, reports, security, and operations."
        pathname="/docs"
        structuredData={[
          buildOrganizationStructuredData(),
          buildBreadcrumbStructuredData([
            { name: "Home", path: "/" },
            { name: "Docs", path: "/docs" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "TechArticle",
            headline: "EventQR product docs",
            description:
              "Detailed EventQR product documentation: setup, workspace model, scanning flow, reports, security, and operations.",
          },
        ]}
        title="Docs"
      />
      <div className="mx-auto max-w-[1320px]">
        <SiteHeader eyebrow="Documentation" />

        <section className="grid gap-6 py-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Card className="h-fit p-5 lg:sticky lg:top-5">
            <p className="text-sm font-semibold text-slate-900">Contents</p>
            <div className="mt-4 space-y-2">
              {toc.map((item) => (
                <a
                  key={item.id}
                  className="block rounded-[8px] px-3 py-2 text-sm text-slate-600 transition hover:bg-[var(--color-surface-soft)] hover:text-slate-900"
                  href={`#${item.id}`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-7" id="overview">
              <div className="flex items-center gap-3">
                <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
                  <BookOpen className="size-5" />
                </div>
                <h1 className="font-display text-4xl font-semibold text-slate-900">EventQR product docs</h1>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                EventQR is a multi-organization QR attendance platform for recurring workshops and event series.
                Organizations manage attendees, run session check-ins, and export attendance outcomes.
              </p>
            </Card>

            <Card className="p-7" id="accounts">
              <div className="flex items-center gap-3">
                <div className="rounded-[8px] bg-sky-50 p-3 text-sky-700">
                  <Building2 className="size-5" />
                </div>
                <h2 className="text-3xl font-semibold text-slate-900">Accounts and workspaces</h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <p>Users create accounts first, then create or join one or more organizations (workspaces).</p>
                <p>A user can switch active workspace from the sidebar selector at any time.</p>
                <p>All event series, sessions, attendees, and attendance actions are scoped to the active organization.</p>
              </div>
            </Card>

            <Card className="p-7" id="attendance">
              <div className="flex items-center gap-3">
                <div className="rounded-[8px] bg-emerald-50 p-3 text-emerald-700">
                  <Users className="size-5" />
                </div>
                <h2 className="text-3xl font-semibold text-slate-900">Attendance model</h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <p>Attendees belong to an organization, not to a single event.</p>
                <p>Event series contain sessions. Check-ins create attendance records at attendee+session level.</p>
                <p>
                  Series report percentages are calculated as:
                  <span className="ml-2 font-mono text-slate-900">attendedSessions / totalSessions * 100</span>
                </p>
              </div>
            </Card>

            <Card className="p-7" id="scanner">
              <div className="flex items-center gap-3">
                <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
                  <ScanLine className="size-5" />
                </div>
                <h2 className="text-3xl font-semibold text-slate-900">Scanner and share links</h2>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                  <p className="text-sm font-semibold text-slate-900">Internal scanner</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Staff choose a session, scan QR codes, and get immediate success/duplicate/invalid feedback.
                  </p>
                </div>
                <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                  <p className="text-sm font-semibold text-slate-900">Public scan page</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Session-specific share links open a scan-only page (`/scan/:token`) for phone-based operations.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-7" id="reports">
              <div className="flex items-center gap-3">
                <div className="rounded-[8px] bg-violet-50 p-3 text-violet-700">
                  <Download className="size-5" />
                </div>
                <h2 className="text-3xl font-semibold text-slate-900">Reports and export</h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <p>Series reports show a full session matrix with joined/missed state per attendee.</p>
                <p>Export formats: CSV and Excel (`.xlsx`) with summary counts and per-session participation columns.</p>
              </div>
            </Card>

            <Card className="p-7" id="security">
              <div className="flex items-center gap-3">
                <div className="rounded-[8px] bg-rose-50 p-3 text-rose-700">
                  <ShieldCheck className="size-5" />
                </div>
                <h2 className="text-3xl font-semibold text-slate-900">Security and data controls</h2>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                  <p className="text-sm font-semibold text-slate-900">Auth and access</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    JWT-based auth, protected app routes, and organization role checks (`OWNER`, `ADMIN`, `MEMBER`).
                  </p>
                </div>
                <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                  <p className="text-sm font-semibold text-slate-900">Profile images</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Local storage with server-side validation/re-encoding; only JPEG, PNG, and WebP are accepted.
                  </p>
                </div>
                <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                  <p className="text-sm font-semibold text-slate-900">Password reset</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Backend-generated single-use token flow with expiry and email delivery through Resend.
                  </p>
                </div>
                <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                  <p className="text-sm font-semibold text-slate-900">Organization lifecycle</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Inactivity tracking with warning state, scheduled deletion metadata, and automatic purge window.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-7" id="deletion">
              <div className="flex items-center gap-3">
                <div className="rounded-[8px] bg-slate-100 p-3 text-slate-700">
                  <Trash2 className="size-5" />
                </div>
                <h2 className="text-3xl font-semibold text-slate-900">Deletion and retention</h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <p>EventQR uses an organization-level cleanup policy to remove inactive workspace data and save storage.</p>
                <p>Organizations move through <span className="font-mono text-slate-900">ACTIVE</span> to <span className="font-mono text-slate-900">INACTIVE</span> and then to permanent deletion if inactivity continues past the purge window.</p>
                <p>Activity updates the organization lifecycle automatically. Examples include login, switching workspace, attendee changes, event/session changes, invite activity, attendance scans, and scanner link generation.</p>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                  <p className="text-sm font-semibold text-slate-900">What gets deleted</p>
                  <div className="mt-2 space-y-2 text-sm text-slate-600">
                    <p>Attendees, attendance records, event sessions, event series, invites, workspace memberships for that organization, and attendee profile image files.</p>
                  </div>
                </div>
                <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                  <p className="text-sm font-semibold text-slate-900">What stays</p>
                  <div className="mt-2 space-y-2 text-sm text-slate-600">
                    <p>User accounts, passwords, account settings, and access to any other organizations the user belongs to.</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                  <p className="text-sm font-semibold text-slate-900">Warning</p>
                  <p className="mt-2 text-sm text-slate-600">By default, workspaces are flagged inactive after 75 days without activity.</p>
                </div>
                <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                  <p className="text-sm font-semibold text-slate-900">Purge</p>
                  <p className="mt-2 text-sm text-slate-600">By default, hard deletion happens after 90 days from the last real activity.</p>
                </div>
                <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                  <p className="text-sm font-semibold text-slate-900">Visibility</p>
                  <p className="mt-2 text-sm text-slate-600">Admins can see last activity and scheduled deletion timing in organization settings.</p>
                </div>
              </div>
            </Card>

            <Card className="p-7" id="automation">
              <div className="flex items-center gap-3">
                <div className="rounded-[8px] bg-indigo-50 p-3 text-indigo-700">
                  <BellRing className="size-5" />
                </div>
                <h2 className="text-3xl font-semibold text-slate-900">Automation and email notifications</h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <p>Password reset request emails and password changed success emails are sent from backend only.</p>
                <p>Inactive organization warning emails are sent to owner/admin members when status changes to inactive.</p>
                <p>Support contact in outbound messaging: <a className="font-medium text-amber-700 hover:text-amber-800" href="mailto:support@magitecx.com">support@magitecx.com</a>.</p>
              </div>
            </Card>
          </div>
        </section>

        <footer className="py-6">
          <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Need support?</p>
              <p className="text-sm text-slate-500">
                Email{" "}
                <a className="font-medium text-amber-700 hover:text-amber-800" href="mailto:support@magitecx.com">
                  support@magitecx.com
                </a>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <Link className="hover:text-slate-900" to="/about">
                About
              </Link>
              <Link className="hover:text-slate-900" to="/contact">
                Contact
              </Link>
              <Link className="hover:text-slate-900" to="/help">
                Help / FAQ
              </Link>
              <Link className="hover:text-slate-900" to="/privacy">
                Privacy Policy
              </Link>
              <Link className="hover:text-slate-900" to="/terms">
                Terms of Service
              </Link>
              <BrandBadge compact />
            </div>
          </Card>
        </footer>
      </div>
    </div>
  );
}
