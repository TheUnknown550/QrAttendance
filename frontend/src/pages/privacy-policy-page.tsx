import { FileLock, Mail, ScanSearch, ShieldCheck, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../components/ui/card";
import { LegalPageLayout } from "../components/legal/legal-page-layout";
import { buildBreadcrumbStructuredData, buildOrganizationStructuredData } from "../lib/seo";

export function PrivacyPolicyPage() {
  const { t } = useTranslation();

  const toc = [
    { id: "overview", label: t("privacy.toc.overview") },
    { id: "data-we-collect", label: t("privacy.toc.dataWeCollect") },
    { id: "how-we-use-data", label: t("privacy.toc.howWeUseData") },
    { id: "sharing", label: t("privacy.toc.sharing") },
    { id: "retention", label: t("privacy.toc.retention") },
    { id: "security", label: t("privacy.toc.security") },
    { id: "choices", label: t("privacy.toc.choices") },
    { id: "contact", label: t("privacy.toc.contact") },
  ];

  return (
    <LegalPageLayout
      description="Read how EventQR collects, uses, stores, and deletes account, workspace, attendee, and attendance data."
      eyebrow={t("privacy.eyebrow")}
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
      title={t("privacy.eyebrow")}
      toc={toc}
      updatedAt="May 20, 2026"
    >
      <Card className="p-7" id="overview">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-sky-50 p-3 text-sky-700">
            <FileLock className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-4xl font-semibold text-slate-900">{t("privacy.eyebrow")}</h1>
            <p className="mt-2 text-sm text-slate-500">{t("privacy.lastUpdated")}</p>
          </div>
        </div>
        <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
          <p>{t("privacy.overview.p1")}</p>
          <p>{t("privacy.overview.p2")}</p>
        </div>
      </Card>

      <Card className="p-7" id="data-we-collect">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
            <UserRound className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">{t("privacy.dataWeCollect.title")}</h2>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
            <p className="text-sm font-semibold text-slate-900">{t("privacy.dataWeCollect.accountData.title")}</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">{t("privacy.dataWeCollect.accountData.body")}</p>
          </div>
          <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
            <p className="text-sm font-semibold text-slate-900">{t("privacy.dataWeCollect.organizationData.title")}</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">{t("privacy.dataWeCollect.organizationData.body")}</p>
          </div>
          <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
            <p className="text-sm font-semibold text-slate-900">{t("privacy.dataWeCollect.attendeeData.title")}</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">{t("privacy.dataWeCollect.attendeeData.body")}</p>
          </div>
          <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
            <p className="text-sm font-semibold text-slate-900">{t("privacy.dataWeCollect.technicalData.title")}</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">{t("privacy.dataWeCollect.technicalData.body")}</p>
          </div>
        </div>
      </Card>

      <Card className="p-7" id="how-we-use-data">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-emerald-50 p-3 text-emerald-700">
            <ScanSearch className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">{t("privacy.howWeUseData.title")}</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>{t("privacy.howWeUseData.p1")}</p>
          <p>{t("privacy.howWeUseData.p2")}</p>
          <p>{t("privacy.howWeUseData.p3")}</p>
        </div>
      </Card>

      <Card className="p-7" id="sharing">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-violet-50 p-3 text-violet-700">
            <Mail className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">{t("privacy.sharing.title")}</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>{t("privacy.sharing.p1")}</p>
          <p>{t("privacy.sharing.p2")}</p>
          <p>{t("privacy.sharing.p3")}</p>
        </div>
      </Card>

      <Card className="p-7" id="retention">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-rose-50 p-3 text-rose-700">
            <ShieldCheck className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">{t("privacy.retention.title")}</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>{t("privacy.retention.p1")}</p>
          <p>{t("privacy.retention.p2")}</p>
          <p>{t("privacy.retention.p3")}</p>
          <p>{t("privacy.retention.p4")}</p>
          <p>{t("privacy.retention.p5")}</p>
        </div>
      </Card>

      <Card className="p-7" id="security">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-slate-100 p-3 text-slate-700">
            <ShieldCheck className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">{t("privacy.security.title")}</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>{t("privacy.security.p1")}</p>
          <p>{t("privacy.security.p2")}</p>
          <p>{t("privacy.security.p3")}</p>
        </div>
      </Card>

      <Card className="p-7" id="choices">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-indigo-50 p-3 text-indigo-700">
            <UserRound className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">{t("privacy.choices.title")}</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>{t("privacy.choices.p1")}</p>
          <p>{t("privacy.choices.p2")}</p>
          <p>{t("privacy.choices.p3")}</p>
        </div>
      </Card>

      <Card className="p-7" id="contact">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
            <Mail className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">{t("privacy.contact.title")}</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>
            {t("privacy.contact.p1")}{" "}
            <a className="font-medium text-amber-700 hover:text-amber-800" href="mailto:support@magitecx.com">
              support@magitecx.com
            </a>
            .
          </p>
          <p>{t("privacy.contact.p2")}</p>
        </div>
      </Card>
    </LegalPageLayout>
  );
}
