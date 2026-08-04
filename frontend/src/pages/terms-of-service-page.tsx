import {
  Gavel,
  Handshake,
  Mail,
  ShieldAlert,
  Trash2,
  UserCog,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { LegalPageLayout } from "../components/legal/legal-page-layout";
import { buildBreadcrumbStructuredData, buildOrganizationStructuredData } from "../lib/seo";

const toc = [
  { id: "acceptance", label: "Acceptance" },
  { id: "accounts", label: "Accounts + Roles" },
  { id: "acceptable-use", label: "Acceptable Use" },
  { id: "organization-data", label: "Workspace Data" },
  { id: "deletion", label: "Deletion + Inactivity" },
  { id: "intellectual-property", label: "Intellectual Property" },
  { id: "availability", label: "Availability + Changes" },
  { id: "liability", label: "Disclaimers + Liability" },
  { id: "contact", label: "Contact" },
];

export function TermsOfServicePage() {
  return (
    <LegalPageLayout
      description="Read the EventQR Terms of Service covering accounts, organization data, deletion rules, acceptable use, and liability limits."
      eyebrow="Terms of Service"
      pathname="/terms"
      structuredData={[
        buildOrganizationStructuredData(),
        buildBreadcrumbStructuredData([
          { name: "Home", path: "/" },
          { name: "Terms of Service", path: "/terms" },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Terms of Service",
        },
      ]}
      title="Terms of Service"
      toc={toc}
      updatedAt="May 20, 2026"
    >
      <Card className="p-7" id="acceptance">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
            <Gavel className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-4xl font-semibold text-slate-900">Terms of Service</h1>
            <p className="mt-2 text-sm text-slate-500">Last updated May 20, 2026</p>
          </div>
        </div>
        <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
          <p>
            These Terms of Service govern access to and use of EventQR, a QR attendance platform powered by Magitecx,
            including the website, dashboard, scanner tools, reports, exports, documentation, and related support
            services.
          </p>
          <p>
            By creating an account, joining a workspace, using a scanner link, or otherwise accessing the service, you
            agree to these Terms. If you use EventQR on behalf of an organization, you represent that you are
            authorized to bind that organization to these Terms.
          </p>
        </div>
      </Card>

      <Card className="p-7" id="accounts">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-sky-50 p-3 text-sky-700">
            <UserCog className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">Accounts and roles</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>Users create individual accounts first and may then create or join one or more organizations.</p>
          <p>Organizations may assign roles such as owner, admin, or member. You are responsible for actions taken through your account and for keeping your credentials secure.</p>
          <p>You must provide accurate information, use the service lawfully, and promptly update account details that become inaccurate or outdated.</p>
        </div>
      </Card>

      <Card className="p-7" id="acceptable-use">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-emerald-50 p-3 text-emerald-700">
            <Handshake className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">Acceptable use</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>You may use EventQR only for legitimate attendance, event operations, workspace collaboration, and related administrative purposes.</p>
          <p>You may not misuse the service, interfere with scanner or reporting operations, attempt unauthorized access, upload malicious files, abuse public scan links, scrape data without permission, or use the platform to violate privacy, intellectual property, or other legal rights.</p>
          <p>We may suspend or restrict access if we reasonably believe an account or workspace is being used unlawfully, abusively, or in a way that threatens the service or other users.</p>
        </div>
      </Card>

      <Card className="p-7" id="organization-data">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-violet-50 p-3 text-violet-700">
            <ShieldAlert className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">Workspace data and responsibilities</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>Your organization is responsible for the attendee, event, and attendance data it creates, imports, or uploads into EventQR.</p>
          <p>You represent that you have the right to upload attendee information and profile images and to use those records for your organization’s attendance workflows.</p>
          <p>We provide the software service and related operational tooling, but you remain responsible for your internal consent, notice, and data handling obligations to your attendees and staff.</p>
        </div>
      </Card>

      <Card className="p-7" id="deletion">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-rose-50 p-3 text-rose-700">
            <Trash2 className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">Deletion and inactivity policy</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>EventQR includes an automatic organization-level cleanup lifecycle intended to reduce unused data and storage overhead.</p>
          <p>By default, a workspace may be marked inactive after 75 days without meaningful activity and may be permanently deleted after 90 days from the last real activity if inactivity continues.</p>
          <p>Activity can include login, switching organizations, attendee changes, event and session changes, invite actions, attendance scans, scanner share-link generation, and certain organization-setting actions.</p>
          <p>When a workspace is permanently deleted, organization-scoped data may be removed, including event series, event sessions, attendees, attendance records, invites, organization memberships for that workspace, and stored attendee profile images.</p>
          <p>User accounts are not automatically deleted when a workspace is purged. Users may continue using other organizations associated with their accounts.</p>
          <p>Replaced, removed, or orphaned uploaded files may also be deleted earlier as part of routine file management and security cleanup.</p>
        </div>
      </Card>

      <Card className="p-7" id="intellectual-property">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-indigo-50 p-3 text-indigo-700">
            <Gavel className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">Intellectual property</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>EventQR, its software, branding, interface design, documentation, and related service materials remain the property of Magitecx or its licensors, except for customer-provided content.</p>
          <p>You retain rights to the content and data your organization uploads, subject to the rights needed for us to host, process, display, export, secure, and support that content within the service.</p>
        </div>
      </Card>

      <Card className="p-7" id="availability">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-slate-100 p-3 text-slate-700">
            <Handshake className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">Availability, changes, and support</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>We may update, improve, modify, or discontinue features as the product evolves. We may also suspend portions of the service for maintenance, security, or operational reasons.</p>
          <p>We aim to operate the service professionally, but we do not guarantee uninterrupted availability, error-free performance, or compatibility with every device, browser, or camera environment.</p>
        </div>
      </Card>

      <Card className="p-7" id="liability">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
            <ShieldAlert className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">Disclaimers and limitation of liability</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>To the maximum extent permitted by law, EventQR is provided on an “as is” and “as available” basis without warranties of merchantability, fitness for a particular purpose, or non-infringement.</p>
          <p>To the maximum extent permitted by law, Magitecx will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for loss of profits, revenue, goodwill, data, or business opportunities arising from or related to use of the service.</p>
          <p>To the maximum extent permitted by law, any direct liability related to the service will be limited to the amount paid, if any, for the applicable service period directly preceding the event giving rise to the claim.</p>
        </div>
      </Card>

      <Card className="p-7" id="contact">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-emerald-50 p-3 text-emerald-700">
            <Mail className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">Contact and updates</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>Questions about these Terms can be sent to <a className="font-medium text-amber-700 hover:text-amber-800" href="mailto:support@magitecx.com">support@magitecx.com</a>.</p>
          <p>We may update these Terms from time to time. Continued use of EventQR after an update becomes effective constitutes acceptance of the revised Terms.</p>
          <p>This Terms page is a professional product draft and should be reviewed for final business entity details, jurisdiction-specific rules, and production legal approval before final publication.</p>
        </div>
      </Card>
    </LegalPageLayout>
  );
}
