import { Building2, QrCode, ScanLine, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PublicPageLayout } from "../components/public/public-page-layout";
import { Card } from "../components/ui/card";
import { buildBreadcrumbStructuredData, buildOrganizationStructuredData } from "../lib/seo";

export function AboutPage() {
  const { t } = useTranslation();

  const items = [
    { icon: Building2, title: t("about.items.workspaceBased.title"), copy: t("about.items.workspaceBased.copy") },
    { icon: QrCode, title: t("about.items.secureIdentity.title"), copy: t("about.items.secureIdentity.copy") },
    { icon: ScanLine, title: t("about.items.fastScanning.title"), copy: t("about.items.fastScanning.copy") },
    { icon: Users, title: t("about.items.clearReporting.title"), copy: t("about.items.clearReporting.copy") },
  ];

  return (
    <PublicPageLayout
      description="Learn what EventQR is, who it is built for, and how it helps teams run recurring attendance workflows."
      eyebrow={t("about.eyebrow")}
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
      title={t("about.eyebrow")}
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-8">
          <p className="text-sm font-semibold text-slate-500">{t("about.aboutEventQr")}</p>
          <h1 className="mt-3 font-display text-5xl font-semibold text-slate-900">{t("about.heroTitle")}</h1>
          <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
            <p>{t("about.paragraph1")}</p>
            <p>{t("about.paragraph2")}</p>
            <p>{t("about.paragraph3")}</p>
          </div>
        </Card>

        <div className="grid gap-4">
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
