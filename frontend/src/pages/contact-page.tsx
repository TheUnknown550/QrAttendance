import { Clock3, Mail, MessagesSquare, ShieldCheck } from "lucide-react";
import { PublicPageLayout } from "../components/public/public-page-layout";
import { Card } from "../components/ui/card";
import { buildBreadcrumbStructuredData, buildOrganizationStructuredData, SUPPORT_EMAIL } from "../lib/seo";

export function ContactPage() {
  return (
    <PublicPageLayout
      description="Contact the EventQR support team for help with accounts, workspaces, scanning issues, and product questions."
      eyebrow="Contact"
      pathname="/contact"
      structuredData={[
        buildOrganizationStructuredData(),
        buildBreadcrumbStructuredData([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact EventQR",
          description:
            "Contact the EventQR support team for help with accounts, workspaces, scanning issues, and product questions.",
          mainEntity: {
            "@type": "Organization",
            name: "EventQR",
            email: SUPPORT_EMAIL,
          },
        },
      ]}
      title="Contact"
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-8">
          <p className="text-sm font-semibold text-slate-500">Support</p>
          <h1 className="mt-3 font-display text-5xl font-semibold text-slate-900">Get in touch.</h1>
          <p className="mt-5 text-sm leading-7 text-slate-600">
            For account issues, workspace problems, scanner questions, or product support, contact the EventQR support team.
          </p>

          <div className="mt-8 rounded-[8px] bg-[var(--color-surface-soft)] p-5">
            <p className="text-sm font-semibold text-slate-900">Support email</p>
            <a className="mt-2 inline-block text-lg font-semibold text-amber-700 hover:text-amber-800" href="mailto:support@magitecx.com">
              support@magitecx.com
            </a>
            <p className="mt-3 text-sm text-slate-500">Please include your organization name and a short description of the issue so support can respond faster.</p>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            { icon: MessagesSquare, title: "General help", copy: "Questions about navigation, account setup, invites, reports, or exports." },
            { icon: ShieldCheck, title: "Security questions", copy: "Password reset issues, access problems, and organization lifecycle concerns." },
            { icon: Clock3, title: "Response context", copy: "Best results come from including screenshots, exact page names, and reproduction steps." },
            { icon: Mail, title: "Single contact point", copy: "All support requests currently route through support@magitecx.com." },
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
