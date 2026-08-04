import {
  BellRing,
  BookOpen,
  Building2,
  Download,
  ScanLine,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { BrandBadge } from "../components/brand/brand-badge";
import { SiteHeader } from "../components/public/site-header";
import { Seo } from "../components/seo/seo";
import { Card } from "../components/ui/card";
import { buildBreadcrumbStructuredData, buildOrganizationStructuredData } from "../lib/seo";

export function DocsPage() {
  const { t } = useTranslation();

  const toc = [
    { id: "overview", label: t("docs.toc.overview") },
    { id: "accounts", label: t("docs.toc.accounts") },
    { id: "attendance", label: t("docs.toc.attendance") },
    { id: "scanner", label: t("docs.toc.scanner") },
    { id: "reports", label: t("docs.toc.reports") },
    { id: "security", label: t("docs.toc.security") },
    { id: "deletion", label: t("docs.toc.deletion") },
    { id: "automation", label: t("docs.toc.automation") },
  ];

  return (
    <div className="min-h-screen px-4 py-20 text-[var(--color-text)] lg:px-6 lg:py-5">
      <Seo
        description="Detailed EventQR product documentation: setup, workspace model, scanning flow, reports, security, and operations."
        pathname="/docs"
        structuredData={[
          buildOrganizationStructuredData(),
          buildBreadcrumbStructuredData([
            { name: "Home", path: "/" },
            { name: "Docs", path: "/docs" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "TechArticle",
            headline: "EventQR product docs",
            description:
              "Detailed EventQR product documentation: setup, workspace model, scanning flow, reports, security, and operations.",
          },
        ]}
        title="Docs"
      />
      <div className="mx-auto max-w-[1320px]">
        <SiteHeader eyebrow={t("docs.eyebrow")} />

        <section className="grid gap-6 py-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Card className="h-fit p-5 lg:sticky lg:top-5">
            <p className="text-sm font-semibold text-slate-900">{t("docs.contents")}</p>
            <div className="mt-4 space-y-2">
              {toc.map((item) => (
                <a
                  key={item.id}
                  className="block rounded-[8px] px-3 py-2 text-sm text-slate-600 transition hover:bg-[var(--color-surface-soft)] hover:text-slate-900"
                  href={`#${item.id}`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-7" id="overview">
              <div className="flex items-center gap-3">
                <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
                  <BookOpen className="size-5" />
                </div>
                <h1 className="font-display text-4xl font-semibold text-slate-900">{t("docs.overview.title")}</h1>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">{t("docs.overview.body")}</p>
            </Card>

            <Card className="p-7" id="accounts">
              <div className="flex items-center gap-3">
                <div className="rounded-[8px] bg-sky-50 p-3 text-sky-700">
                  <Building2 className="size-5" />
                </div>
                <h2 className="text-3xl font-semibold text-slate-900">{t("docs.accounts.title")}</h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <p>{t("docs.accounts.p1")}</p>
                <p>{t("docs.accounts.p2")}</p>
                <p>{t("docs.accounts.p3")}</p>
              </div>
            </Card>

            <Card className="p-7" id="attendance">
              <div className="flex items-center gap-3">
                <div className="rounded-[8px] bg-emerald-50 p-3 text-emerald-700">
                  <Users className="size-5" />
                </div>
                <h2 className="text-3xl font-semibold text-slate-900">{t("docs.attendance.title")}</h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <p>{t("docs.attendance.p1")}</p>
                <p>{t("docs.attendance.p2")}</p>
                <p>
                  {t("docs.attendance.p3")}
                  <span className="ml-2 font-mono text-slate-900">attendedSessions / totalSessions * 100</span>
                </p>
              </div>
            </Card>

            <Card className="p-7" id="scanner">
              <div className="flex items-center gap-3">
                <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
                  <ScanLine className="size-5" />
                </div>
                <h2 className="text-3xl font-semibold text-slate-900">{t("docs.scanner.title")}</h2>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                  <p className="text-sm font-semibold text-slate-900">{t("docs.scanner.internal.title")}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{t("docs.scanner.internal.body")}</p>
                </div>
                <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                  <p className="text-sm font-semibold text-slate-900">{t("docs.scanner.public.title")}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{t("docs.scanner.public.body")}</p>
                </div>
              </div>
            </Card>

            <Card className="p-7" id="reports">
              <div className="flex items-center gap-3">
                <div className="rounded-[8px] bg-violet-50 p-3 text-violet-700">
                  <Download className="size-5" />
                </div>
                <h2 className="text-3xl font-semibold text-slate-900">{t("docs.reports.title")}</h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <p>{t("docs.reports.p1")}</p>
                <p>{t("docs.reports.p2")}</p>
              </div>
            </Card>

            <Card className="p-7" id="security">
              <div className="flex items-center gap-3">
                <div className="rounded-[8px] bg-rose-50 p-3 text-rose-700">
                  <ShieldCheck className="size-5" />
                </div>
                <h2 className="text-3xl font-semibold text-slate-900">{t("docs.security.title")}</h2>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                  <p className="text-sm font-semibold text-slate-900">{t("docs.security.auth.title")}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{t("docs.security.auth.body")}</p>
                </div>
                <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                  <p className="text-sm font-semibold text-slate-900">{t("docs.security.profileImages.title")}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{t("docs.security.profileImages.body")}</p>
                </div>
                <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                  <p className="text-sm font-semibold text-slate-900">{t("docs.security.passwordReset.title")}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{t("docs.security.passwordReset.body")}</p>
                </div>
                <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                  <p className="text-sm font-semibold text-slate-900">{t("docs.security.orgLifecycle.title")}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{t("docs.security.orgLifecycle.body")}</p>
                </div>
              </div>
            </Card>

            <Card className="p-7" id="deletion">
              <div className="flex items-center gap-3">
                <div className="rounded-[8px] bg-slate-100 p-3 text-slate-700">
                  <Trash2 className="size-5" />
                </div>
                <h2 className="text-3xl font-semibold text-slate-900">{t("docs.deletion.title")}</h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <p>{t("docs.deletion.p1")}</p>
                <p>
                  {t("docs.deletion.p2a")} <span className="font-mono text-slate-900">ACTIVE</span>{" "}
                  {t("docs.deletion.p2b")} <span className="font-mono text-slate-900">INACTIVE</span>{" "}
                  {t("docs.deletion.p2c")}
                </p>
                <p>{t("docs.deletion.p3")}</p>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                  <p className="text-sm font-semibold text-slate-900">{t("docs.deletion.whatGetsDeleted.title")}</p>
                  <div className="mt-2 space-y-2 text-sm text-slate-600">
                    <p>{t("docs.deletion.whatGetsDeleted.body")}</p>
                  </div>
                </div>
                <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                  <p className="text-sm font-semibold text-slate-900">{t("docs.deletion.whatStays.title")}</p>
                  <div className="mt-2 space-y-2 text-sm text-slate-600">
                    <p>{t("docs.deletion.whatStays.body")}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                  <p className="text-sm font-semibold text-slate-900">{t("docs.deletion.warning.title")}</p>
                  <p className="mt-2 text-sm text-slate-600">{t("docs.deletion.warning.body")}</p>
                </div>
                <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                  <p className="text-sm font-semibold text-slate-900">{t("docs.deletion.purge.title")}</p>
                  <p className="mt-2 text-sm text-slate-600">{t("docs.deletion.purge.body")}</p>
                </div>
                <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                  <p className="text-sm font-semibold text-slate-900">{t("docs.deletion.visibility.title")}</p>
                  <p className="mt-2 text-sm text-slate-600">{t("docs.deletion.visibility.body")}</p>
                </div>
              </div>
            </Card>

            <Card className="p-7" id="automation">
              <div className="flex items-center gap-3">
                <div className="rounded-[8px] bg-indigo-50 p-3 text-indigo-700">
                  <BellRing className="size-5" />
                </div>
                <h2 className="text-3xl font-semibold text-slate-900">{t("docs.automation.title")}</h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <p>{t("docs.automation.p1")}</p>
                <p>{t("docs.automation.p2")}</p>
                <p>
                  {t("docs.automation.p3")}{" "}
                  <a className="font-medium text-amber-700 hover:text-amber-800" href="mailto:support@magitecx.com">
                    support@magitecx.com
                  </a>
                  .
                </p>
              </div>
            </Card>
          </div>
        </section>

        <footer className="py-6">
          <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">{t("docs.needSupport")}</p>
              <p className="text-sm text-slate-500">
                {t("docs.email")}{" "}
                <a className="font-medium text-amber-700 hover:text-amber-800" href="mailto:support@magitecx.com">
                  support@magitecx.com
                </a>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <Link className="hover:text-slate-900" to="/about">
                {t("landing.footer.about")}
              </Link>
              <Link className="hover:text-slate-900" to="/contact">
                {t("landing.footer.contact")}
              </Link>
              <Link className="hover:text-slate-900" to="/help">
                {t("landing.footer.helpFaq")}
              </Link>
              <Link className="hover:text-slate-900" to="/privacy">
                {t("landing.footer.privacyPolicy")}
              </Link>
              <Link className="hover:text-slate-900" to="/terms">
                {t("landing.footer.termsOfService")}
              </Link>
              <BrandBadge compact />
            </div>
          </Card>
        </footer>
      </div>
    </div>
  );
}
