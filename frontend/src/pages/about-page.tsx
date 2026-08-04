import { Building2, QrCode, ScanLine, Users } from "lucide-react";
import { PublicPageLayout } from "../components/public/public-page-layout";
import { Card } from "../components/ui/card";
import { buildBreadcrumbStructuredData, buildOrganizationStructuredData } from "../lib/seo";

export function AboutPage() {
  return (
    <PublicPageLayout
      description="Learn what EventQR is, who it is built for, and how it helps teams run recurring attendance workflows."
      eyebrow="About"
      pathname="/about"
      structuredData={[
        buildOrganizationStructuredData(),
        buildBreadcrumbStructuredData([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About EventQR",
          description:
            "Learn what EventQR is, who it is built for, and how it helps teams run recurring attendance workflows.",
        },
      ]}
      title="About"
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-8">
          <p className="text-sm font-semibold text-slate-500">About EventQR</p>
          <h1 className="mt-3 font-display text-5xl font-semibold text-slate-900">Attendance infrastructure for recurring events.</h1>
          <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
            <p>EventQR is built for organizations that need a reliable way to manage attendees, run session check-ins, and track attendance over time across recurring programs and workshops.</p>
            <p>Instead of piecing together spreadsheets, printed lists, and manual attendance logs, teams can issue secure QR identities, scan attendees into sessions, and keep reporting inside one system.</p>
            <p>The product is designed for practical event operations: simpler staff workflows, cleaner reporting, and easier workspace management across multiple organizations.</p>
          </div>
        </Card>

        <div className="grid gap-4">
          {[
            { icon: Building2, title: "Workspace-based", copy: "Each organization manages its own attendees, sessions, invites, and permissions." },
            { icon: QrCode, title: "Secure identity", copy: "Attendees use secure QR tokens rather than plain numeric IDs." },
            { icon: ScanLine, title: "Fast scanning", copy: "Teams can run browser-based scanning flows on desktop or phone-friendly shared links." },
            { icon: Users, title: "Clear reporting", copy: "Attendance percentages and session-level participation stay visible in one place." },
          ].map((item) => (
            <Card key={item.title} className="p-5">
              <div className="w-fit rounded-[8px] bg-amber-50 p-3 text-amber-700">
                <item.icon className="size-5" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.copy}</p>
            </Card>
          ))}
        </div>
      </div>
    </PublicPageLayout>
  );
}
