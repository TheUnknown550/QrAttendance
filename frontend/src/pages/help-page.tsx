import { HelpCircle, Link2, QrCode, ScanLine, ShieldAlert, Users } from "lucide-react";
import { PublicPageLayout } from "../components/public/public-page-layout";
import { Card } from "../components/ui/card";
import { buildBreadcrumbStructuredData, buildOrganizationStructuredData } from "../lib/seo";

const faqs = [
  {
    icon: Users,
    question: "How do I start using EventQR?",
    answer: "Create an account first, then create a workspace or join one using a code or invite link. After that, add attendees, create an event series, add sessions, and begin scanning.",
  },
  {
    icon: QrCode,
    question: "How do attendee QR codes work?",
    answer: "Each attendee receives a unique secure QR token. The scanner sends that token to the backend together with the selected session, and the backend validates and records the check-in.",
  },
  {
    icon: ScanLine,
    question: "Can I scan from a phone?",
    answer: "Yes. From the scanner page, staff can generate a session-specific share link and open the phone-friendly scan page on a mobile device.",
  },
  {
    icon: Link2,
    question: "Can users belong to more than one organization?",
    answer: "Yes. Accounts are global. A single user can join multiple organizations and switch between workspaces from the sidebar selector.",
  },
  {
    icon: ShieldAlert,
    question: "What happens if an organization becomes inactive?",
    answer: "The workspace can be marked inactive after the configured inactivity threshold and may later be permanently deleted if no new activity occurs before the purge deadline.",
  },
];

export function HelpPage() {
  return (
    <PublicPageLayout
      description="Find answers to common EventQR questions about accounts, organizations, QR codes, scanner links, and workspace lifecycle behavior."
      eyebrow="Help / FAQ"
      pathname="/help"
      structuredData={[
        buildOrganizationStructuredData(),
        buildBreadcrumbStructuredData([
          { name: "Home", path: "/" },
          { name: "Help / FAQ", path: "/help" },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        },
      ]}
      title="Help / FAQ"
    >
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
              <HelpCircle className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Help</p>
              <h1 className="mt-2 font-display text-5xl font-semibold text-slate-900">Common questions.</h1>
            </div>
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-600">
            This page covers the most common setup and workflow questions. If you still need help, email support@magitecx.com.
          </p>
        </Card>

        <div className="space-y-4">
          {faqs.map((item) => (
            <Card key={item.question} className="p-5">
              <div className="flex items-start gap-4">
                <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-3 text-amber-700">
                  <item.icon className="size-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{item.question}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.answer}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PublicPageLayout>
  );
}
