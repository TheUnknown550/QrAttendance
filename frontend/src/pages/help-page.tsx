import { HelpCircle, Link2, QrCode, ScanLine, ShieldAlert, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PublicPageLayout } from "../components/public/public-page-layout";
import { Card } from "../components/ui/card";
import { buildBreadcrumbStructuredData, buildOrganizationStructuredData } from "../lib/seo";

export function HelpPage() {
  const { t } = useTranslation();

  const faqs = [
    {
      icon: Users,
      question: t("help.faqs.gettingStarted.question"),
      answer: t("help.faqs.gettingStarted.answer"),
    },
    {
      icon: QrCode,
      question: t("help.faqs.qrCodes.question"),
      answer: t("help.faqs.qrCodes.answer"),
    },
    {
      icon: ScanLine,
      question: t("help.faqs.scanFromPhone.question"),
      answer: t("help.faqs.scanFromPhone.answer"),
    },
    {
      icon: Link2,
      question: t("help.faqs.multipleOrgs.question"),
      answer: t("help.faqs.multipleOrgs.answer"),
    },
    {
      icon: ShieldAlert,
      question: t("help.faqs.inactiveOrg.question"),
      answer: t("help.faqs.inactiveOrg.answer"),
    },
  ];

  return (
    <PublicPageLayout
      description="Find answers to common EventQR questions about accounts, organizations, QR codes, scanner links, and workspace lifecycle behavior."
      eyebrow={t("help.eyebrow")}
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
      title={t("help.eyebrow")}
    >
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
              <HelpCircle className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">{t("help.help")}</p>
              <h1 className="mt-2 font-display text-5xl font-semibold text-slate-900">{t("help.commonQuestions")}</h1>
            </div>
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-600">{t("help.description")}</p>
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
