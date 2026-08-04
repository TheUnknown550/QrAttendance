import { Clock3, Mail, MessagesSquare, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PublicPageLayout } from "../components/public/public-page-layout";
import { Card } from "../components/ui/card";
import { buildBreadcrumbStructuredData, buildOrganizationStructuredData, SUPPORT_EMAIL } from "../lib/seo";

export function ContactPage() {
  const { t } = useTranslation();

  const items = [
    { icon: MessagesSquare, title: t("contact.items.generalHelp.title"), copy: t("contact.items.generalHelp.copy") },
    { icon: ShieldCheck, title: t("contact.items.securityQuestions.title"), copy: t("contact.items.securityQuestions.copy") },
    { icon: Clock3, title: t("contact.items.responseContext.title"), copy: t("contact.items.responseContext.copy") },
    { icon: Mail, title: t("contact.items.singleContactPoint.title"), copy: t("contact.items.singleContactPoint.copy") },
  ];

  return (
    <PublicPageLayout
      description="Contact the EventQR support team for help with accounts, workspaces, scanning issues, and product questions."
      eyebrow={t("contact.eyebrow")}
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
      title={t("contact.eyebrow")}
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-8">
          <p className="text-sm font-semibold text-slate-500">{t("contact.support")}</p>
          <h1 className="mt-3 font-display text-5xl font-semibold text-slate-900">{t("contact.heroTitle")}</h1>
          <p className="mt-5 text-sm leading-7 text-slate-600">{t("contact.heroDescription")}</p>

          <div className="mt-8 rounded-[8px] bg-[var(--color-surface-soft)] p-5">
            <p className="text-sm font-semibold text-slate-900">{t("contact.supportEmail")}</p>
            <a className="mt-2 inline-block text-lg font-semibold text-amber-700 hover:text-amber-800" href="mailto:support@magitecx.com">
              support@magitecx.com
            </a>
            <p className="mt-3 text-sm text-slate-500">{t("contact.supportEmailHint")}</p>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
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
