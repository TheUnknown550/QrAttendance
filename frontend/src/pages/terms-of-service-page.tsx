import {
  Gavel,
  Handshake,
  Mail,
  ShieldAlert,
  Trash2,
  UserCog,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../components/ui/card";
import { LegalPageLayout } from "../components/legal/legal-page-layout";
import { buildBreadcrumbStructuredData, buildOrganizationStructuredData } from "../lib/seo";

export function TermsOfServicePage() {
  const { t } = useTranslation();

  const toc = [
    { id: "acceptance", label: t("terms.toc.acceptance") },
    { id: "accounts", label: t("terms.toc.accounts") },
    { id: "acceptable-use", label: t("terms.toc.acceptableUse") },
    { id: "organization-data", label: t("terms.toc.organizationData") },
    { id: "deletion", label: t("terms.toc.deletion") },
    { id: "intellectual-property", label: t("terms.toc.intellectualProperty") },
    { id: "availability", label: t("terms.toc.availability") },
    { id: "liability", label: t("terms.toc.liability") },
    { id: "contact", label: t("terms.toc.contact") },
  ];

  return (
    <LegalPageLayout
      description="Read the EventQR Terms of Service covering accounts, organization data, deletion rules, acceptable use, and liability limits."
      eyebrow={t("terms.eyebrow")}
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
      title={t("terms.eyebrow")}
      toc={toc}
      updatedAt="May 20, 2026"
    >
      <Card className="p-7" id="acceptance">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
            <Gavel className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-4xl font-semibold text-slate-900">{t("terms.eyebrow")}</h1>
            <p className="mt-2 text-sm text-slate-500">{t("terms.lastUpdated")}</p>
          </div>
        </div>
        <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
          <p>{t("terms.acceptance.p1")}</p>
          <p>{t("terms.acceptance.p2")}</p>
        </div>
      </Card>

      <Card className="p-7" id="accounts">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-sky-50 p-3 text-sky-700">
            <UserCog className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">{t("terms.accounts.title")}</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>{t("terms.accounts.p1")}</p>
          <p>{t("terms.accounts.p2")}</p>
          <p>{t("terms.accounts.p3")}</p>
        </div>
      </Card>

      <Card className="p-7" id="acceptable-use">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-emerald-50 p-3 text-emerald-700">
            <Handshake className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">{t("terms.acceptableUse.title")}</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>{t("terms.acceptableUse.p1")}</p>
          <p>{t("terms.acceptableUse.p2")}</p>
          <p>{t("terms.acceptableUse.p3")}</p>
        </div>
      </Card>

      <Card className="p-7" id="organization-data">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-violet-50 p-3 text-violet-700">
            <ShieldAlert className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">{t("terms.organizationData.title")}</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>{t("terms.organizationData.p1")}</p>
          <p>{t("terms.organizationData.p2")}</p>
          <p>{t("terms.organizationData.p3")}</p>
        </div>
      </Card>

      <Card className="p-7" id="deletion">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-rose-50 p-3 text-rose-700">
            <Trash2 className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">{t("terms.deletion.title")}</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>{t("terms.deletion.p1")}</p>
          <p>{t("terms.deletion.p2")}</p>
          <p>{t("terms.deletion.p3")}</p>
          <p>{t("terms.deletion.p4")}</p>
          <p>{t("terms.deletion.p5")}</p>
          <p>{t("terms.deletion.p6")}</p>
        </div>
      </Card>

      <Card className="p-7" id="intellectual-property">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-indigo-50 p-3 text-indigo-700">
            <Gavel className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">{t("terms.intellectualProperty.title")}</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>{t("terms.intellectualProperty.p1")}</p>
          <p>{t("terms.intellectualProperty.p2")}</p>
        </div>
      </Card>

      <Card className="p-7" id="availability">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-slate-100 p-3 text-slate-700">
            <Handshake className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">{t("terms.availability.title")}</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>{t("terms.availability.p1")}</p>
          <p>{t("terms.availability.p2")}</p>
        </div>
      </Card>

      <Card className="p-7" id="liability">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
            <ShieldAlert className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">{t("terms.liability.title")}</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>{t("terms.liability.p1")}</p>
          <p>{t("terms.liability.p2")}</p>
          <p>{t("terms.liability.p3")}</p>
        </div>
      </Card>

      <Card className="p-7" id="contact">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-emerald-50 p-3 text-emerald-700">
            <Mail className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">{t("terms.contact.title")}</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>
            {t("terms.contact.p1")}{" "}
            <a className="font-medium text-amber-700 hover:text-amber-800" href="mailto:support@magitecx.com">
              support@magitecx.com
            </a>
            .
          </p>
          <p>{t("terms.contact.p2")}</p>
          <p>{t("terms.contact.p3")}</p>
        </div>
      </Card>
    </LegalPageLayout>
  );
}
