import { FileLock, Mail, ScanSearch, ShieldCheck, UserRound } from "lucide-react";
import { Card } from "../components/ui/card";
import { LegalPageLayout } from "../components/legal/legal-page-layout";
import { buildBreadcrumbStructuredData, buildOrganizationStructuredData } from "../lib/seo";

const toc = [
  { id: "overview", label: "Overview" },
  { id: "data-we-collect", label: "Data We Collect" },
  { id: "how-we-use-data", label: "How We Use Data" },
  { id: "sharing", label: "Sharing" },
  { id: "retention", label: "Retention + Deletion" },
  { id: "security", label: "Security" },
  { id: "choices", label: "Your Choices" },
  { id: "contact", label: "Contact" },
];

export function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      description="Read how EventQR collects, uses, stores, and deletes account, workspace, attendee, and attendance data."
      eyebrow="Privacy Policy"
      pathname="/privacy"
      structuredData={[
        buildOrganizationStructuredData(),
        buildBreadcrumbStructuredData([
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/privacy" },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Privacy Policy",
        },
      ]}
      title="Privacy Policy"
      toc={toc}
      updatedAt="May 20, 2026"
    >
      <Card className="p-7" id="overview">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-sky-50 p-3 text-sky-700">
            <FileLock className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-4xl font-semibold text-slate-900">Privacy Policy</h1>
            <p className="mt-2 text-sm text-slate-500">Last updated May 20, 2026</p>
          </div>
        </div>
        <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
          <p>
            This Privacy Policy explains how EventQR, powered by Magitecx, collects, uses, stores, and deletes
            information when you use the EventQR website, dashboard, scanner flows, support channels, and related
            services.
          </p>
          <p>
            EventQR is designed for organizations that manage attendees, recurring event series, attendance check-ins,
            and reporting. By using the service, you acknowledge that your organization may upload attendee information
            and attendance data into the platform.
          </p>
        </div>
      </Card>

      <Card className="p-7" id="data-we-collect">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
            <UserRound className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">Data we collect</h2>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
            <p className="text-sm font-semibold text-slate-900">Account data</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Name, email address, password hash, organization memberships, role assignments, and account activity
              needed to authenticate and manage access.
            </p>
          </div>
          <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
            <p className="text-sm font-semibold text-slate-900">Organization data</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Workspace names, join codes, invite records, event series, event sessions, settings, inactivity status,
              and scheduled deletion metadata.
            </p>
          </div>
          <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
            <p className="text-sm font-semibold text-slate-900">Attendee data</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Attendee names, email addresses, phone numbers, profile images, QR tokens, and attendance history
              created by the organization using the service.
            </p>
          </div>
          <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
            <p className="text-sm font-semibold text-slate-900">Technical and support data</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Browser and device information, IP-derived operational logs, password reset requests, and messages you
              send to support.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-7" id="how-we-use-data">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-emerald-50 p-3 text-emerald-700">
            <ScanSearch className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">How we use data</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>We use personal and workspace data to provide authentication, organization membership, scanner flows, attendee management, reports, exports, and support operations.</p>
          <p>We also use data to maintain service security, investigate misuse, send service emails such as password resets and inactivity warnings, and improve the reliability of the platform.</p>
          <p>We do not sell attendee or account personal information.</p>
        </div>
      </Card>

      <Card className="p-7" id="sharing">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-violet-50 p-3 text-violet-700">
            <Mail className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">Sharing and service providers</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>We share data only as needed to operate the service, such as with infrastructure, email, hosting, database, and security providers acting on our behalf.</p>
          <p>At the time of this draft, password reset and notification emails are sent through Resend. Additional sub-processors may be used for hosting, database operations, and file storage as the service evolves.</p>
          <p>We may also disclose information if reasonably necessary to comply with law, enforce our Terms, prevent fraud, or protect users, EventQR, Magitecx, or the public.</p>
        </div>
      </Card>

      <Card className="p-7" id="retention">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-rose-50 p-3 text-rose-700">
            <ShieldCheck className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">Retention and deletion</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>EventQR stores organization data for as long as the workspace remains active or until it is removed under the product’s inactivity lifecycle or an administrative deletion action.</p>
          <p>By default, organizations may be marked inactive after 75 days without meaningful workspace activity and may be permanently deleted after 90 days from the last real activity if inactivity continues.</p>
          <p>When an organization is permanently deleted, organization-scoped data may be removed, including attendees, event series, event sessions, attendance records, invites, workspace memberships for that organization, and stored attendee profile images.</p>
          <p>User accounts are not automatically deleted when an organization is purged. A user may continue using other organizations linked to the same account.</p>
          <p>Replaced or removed attendee profile images may be deleted earlier as part of file cleanup and storage management.</p>
        </div>
      </Card>

      <Card className="p-7" id="security">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-slate-100 p-3 text-slate-700">
            <ShieldCheck className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">Security</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>We use access controls, password hashing, secure token flows, protected dashboard routes, and server-side validation in support of the service.</p>
          <p>Attendee profile images are validated and re-encoded server-side, and only supported image formats are accepted by the current upload flow.</p>
          <p>No system is completely secure. You are responsible for safeguarding your account credentials and limiting access within your organization appropriately.</p>
        </div>
      </Card>

      <Card className="p-7" id="choices">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-indigo-50 p-3 text-indigo-700">
            <UserRound className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">Your choices</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>Users can update account details, change passwords, switch organizations, and manage workspace records according to their role permissions.</p>
          <p>Organization administrators control most attendee and event data inside their workspaces, including updates, exports, and deletions.</p>
          <p>If you need support regarding your data, contact support using the email listed below.</p>
        </div>
      </Card>

      <Card className="p-7" id="contact">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
            <Mail className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">Contact</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>Questions about this Privacy Policy or privacy-related requests can be sent to <a className="font-medium text-amber-700 hover:text-amber-800" href="mailto:support@magitecx.com">support@magitecx.com</a>.</p>
          <p>This document is a product-facing policy draft and should be reviewed for your business entity details, local law requirements, and final publication requirements before production launch.</p>
        </div>
      </Card>
    </LegalPageLayout>
  );
}
