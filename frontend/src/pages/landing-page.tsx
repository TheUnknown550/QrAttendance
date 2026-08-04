import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  QrCode,
  ScanLine,
  Sheet,
  UserRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { buildOrganizationStructuredData, buildWebsiteStructuredData } from "../lib/seo";
import { BrandBadge } from "../components/brand/brand-badge";
import { SiteHeader } from "../components/public/site-header";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Seo } from "../components/seo/seo";

export function LandingPage() {
  const { t } = useTranslation();

  const features = [
    { title: t("landing.features.series"), icon: CalendarDays },
    { title: t("landing.features.qrCards"), icon: QrCode },
    { title: t("landing.features.scanner"), icon: ScanLine },
    { title: t("landing.features.reports"), icon: Sheet },
  ];

  const featureDetails = [
    {
      title: t("landing.featureDetails.seriesSessions.title"),
      copy: t("landing.featureDetails.seriesSessions.copy"),
      icon: CalendarDays,
    },
    {
      title: t("landing.featureDetails.secureQr.title"),
      copy: t("landing.featureDetails.secureQr.copy"),
      icon: QrCode,
    },
    {
      title: t("landing.featureDetails.fastScanning.title"),
      copy: t("landing.featureDetails.fastScanning.copy"),
      icon: ScanLine,
    },
    {
      title: t("landing.featureDetails.attendanceMatrix.title"),
      copy: t("landing.featureDetails.attendanceMatrix.copy"),
      icon: Sheet,
    },
  ];

  const workflowSteps = [
    {
      title: t("landing.workflow.attendee.title"),
      subtitle: t("landing.workflow.attendee.subtitle"),
      icon: UserRound,
      tone: "bg-amber-50 text-amber-700",
      detail: t("landing.workflow.attendee.detail"),
    },
    {
      title: t("landing.workflow.staff.title"),
      subtitle: t("landing.workflow.staff.subtitle"),
      icon: ScanLine,
      tone: "bg-emerald-50 text-emerald-700",
      detail: t("landing.workflow.staff.detail"),
    },
    {
      title: t("landing.workflow.dashboard.title"),
      subtitle: t("landing.workflow.dashboard.subtitle"),
      icon: Sheet,
      tone: "bg-sky-50 text-sky-700",
      detail: t("landing.workflow.dashboard.detail"),
    },
  ];

  return (
    <div className="min-h-screen px-4 py-20 text-[var(--color-text)] lg:px-6 lg:py-5">
      <Seo
        title="QR Event Management Platform by Magitecx"
        description="EventQR by Magitecx helps organizers manage events with QR attendance tracking, check-ins, and event management tools."
        keywords={[
          "QR attendance platform",
          "QR attendance system",
          "school attendance system",
          "business attendance tracker",
          "event attendance software",
          "workshop attendance tracker",
          "QR check in system",
          "attendance report software",
        ]}
        pathname="/"
        structuredData={[
          buildWebsiteStructuredData(),
          buildOrganizationStructuredData(),
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            applicationCategory: "BusinessApplication",
            name: "EventQR",
            operatingSystem: "Web",
            description: "QR attendance system",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
          },
        ]}
      />
      <div className="mx-auto max-w-[1320px]">
        <SiteHeader eyebrow={t("landing.eyebrow")} />

        <section className="grid gap-8 py-10 lg:grid-cols-[1fr_560px] lg:py-14">
          <div className="max-w-2xl pt-4">
            <h1 className="break-words font-display text-4xl font-semibold leading-[1.02] text-slate-900 sm:text-5xl md:text-7xl">
              {t("landing.hero.title")}
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">{t("landing.hero.subtitle")}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register">
                <Button className="px-6 py-3 text-base" icon={<ArrowRight className="size-4" />}>
                  {t("landing.hero.getStarted")}
                </Button>
              </Link>
              <Link to="/login">
                <Button className="px-6 py-3 text-base" variant="secondary">
                  {t("landing.hero.logIn")}
                </Button>
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {features.map((item) => (
                <div key={item.title} className="flex items-center gap-3 rounded-[8px] bg-white px-4 py-4 shadow-[var(--shadow-card)]">
                  <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
                    <item.icon className="size-5" />
                  </div>
                  <p className="font-semibold text-slate-800">{item.title}</p>
                </div>
              ))}
            </div>
          </div>

          <Card className="p-5" id="preview">
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{t("landing.preview.series")}</p>
                      <h2 className="mt-2 break-words text-2xl font-semibold text-slate-900">
                        {t("landing.preview.seriesName")}
                      </h2>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {t("landing.preview.live")}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {[
                      [t("landing.preview.session1"), "96%"],
                      [t("landing.preview.session2"), "88%"],
                      [t("landing.preview.session3"), t("landing.preview.today")],
                    ].map(([title, value]) => (
                      <div key={title} className="flex items-center justify-between rounded-[8px] bg-white px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
                        <p className="break-words font-medium text-slate-800">{title}</p>
                        <p className="text-sm font-semibold text-amber-700">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[8px] bg-emerald-50 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">{t("landing.preview.latestScan")}</p>
                  <div className="mt-5 rounded-[8px] bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-[8px] bg-emerald-50 p-3 text-emerald-700">
                        <CheckCircle2 className="size-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{t("landing.preview.checkedIn")}</p>
                        <p className="text-sm text-slate-500">Sophia Rivera</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {[
                      t("landing.preview.addAttendee"),
                      t("landing.preview.createSession"),
                      t("landing.preview.export"),
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-[8px] bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-[8px] bg-[var(--color-surface-soft)] p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-slate-900">{t("landing.preview.attendanceMatrix")}</h3>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    {t("landing.preview.exportable")}
                  </span>
                </div>

                <div className="mt-4 grid min-w-[520px] grid-cols-[1.2fr_repeat(3,0.8fr)] gap-3 text-sm">
                  <div className="text-slate-500">{t("session.attendee")}</div>
                  <div className="text-slate-500">S1</div>
                  <div className="text-slate-500">S2</div>
                  <div className="text-slate-500">S3</div>
                  {[
                    { name: "Ava", states: [true, true, false] },
                    { name: "Liam", states: [true, false, true] },
                    { name: "Mia", states: [true, true, true] },
                  ].map((row) => (
                    <div key={row.name} className="contents">
                      <div className="rounded-[8px] bg-white px-4 py-3 font-medium text-slate-800">
                        {row.name}
                      </div>
                      {row.states.map((joined, index) => (
                        <div
                          key={`${row.name}-${index}`}
                          className={
                            joined
                              ? "rounded-[8px] bg-emerald-50 px-4 py-3 text-center font-semibold text-emerald-700"
                              : "rounded-[8px] bg-white px-4 py-3 text-center font-semibold text-slate-400"
                          }
                        >
                          {joined ? t("landing.preview.in") : t("landing.preview.out")}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="py-4" id="features">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">{t("landing.featuresEyebrow")}</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-slate-900 md:text-4xl">
                {t("landing.featuresTitle")}
              </h2>
            </div>
            <p className="max-w-md text-sm text-slate-500">{t("landing.featuresSubtitle")}</p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featureDetails.map((item) => (
              <Card key={item.title} className="p-5">
                <div className="w-fit rounded-[8px] bg-amber-50 p-3 text-amber-700">
                  <item.icon className="size-5" />
                </div>
                <h3 className="mt-4 break-words text-xl font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{item.copy}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="py-4" id="workflow">
          <Card className="p-6 md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">{t("landing.workflowEyebrow")}</p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-slate-900 md:text-4xl">
                  {t("landing.workflowTitle")}
                </h2>
              </div>
              <p className="max-w-md text-sm text-slate-500">{t("landing.workflowSubtitle")}</p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
              {workflowSteps.map((item, index) => (
                <div key={item.title} className="contents">
                  <div className="rounded-[8px] bg-[var(--color-surface-soft)] p-5">
                    <div className={`w-fit rounded-[8px] p-3 ${item.tone}`}>
                      <item.icon className="size-6" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-slate-500">{item.title}</p>
                    <h3 className="mt-1 break-words text-2xl font-semibold text-slate-900">{item.subtitle}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-500">{item.detail}</p>
                  </div>

                  {index < 2 ? (
                    <>
                      <div className="hidden text-slate-300 lg:block">
                        <ArrowRight className="size-8" />
                      </div>
                      <div className="flex justify-center text-slate-300 lg:hidden">
                        <ArrowDown className="size-7" />
                      </div>
                    </>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                { icon: QrCode, title: t("landing.workflowBadges.secureToken") },
                { icon: ScanLine, title: t("landing.workflowBadges.duplicateProtected") },
                { icon: CheckCircle2, title: t("landing.workflowBadges.liveResult") },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-center gap-3 rounded-[8px] bg-white px-4 py-4 shadow-[var(--shadow-card)]"
                >
                  <div className="rounded-[8px] bg-slate-50 p-3 text-slate-700">
                    <item.icon className="size-5" />
                  </div>
                  <p className="font-semibold text-slate-800">{item.title}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid gap-4 py-4 md:grid-cols-3" id="start">
          {[
            { icon: CalendarDays, title: t("landing.startSteps.createSeries") },
            { icon: QrCode, title: t("landing.startSteps.addAttendees") },
            { icon: ScanLine, title: t("landing.startSteps.scanSession") },
          ].map((item) => (
            <Card key={item.title} className="flex items-center gap-4 p-5">
              <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
                <item.icon className="size-5" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
            </Card>
          ))}
        </section>

        <footer className="py-6">
          <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">EventQR</p>
              <p className="text-sm text-slate-500">{t("landing.footer.tagline")}</p>
              <p className="mt-1 text-sm text-slate-500">
                {t("landing.footer.support")}{" "}
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
