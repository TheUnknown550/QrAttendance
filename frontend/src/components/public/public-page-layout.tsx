import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrandBadge } from "../brand/brand-badge";
import { SiteHeader } from "./site-header";
import { Seo } from "../seo/seo";
import type { SeoProps } from "../seo/seo";
import { Card } from "../ui/card";

interface PublicPageLayoutProps {
  title: string;
  description: string;
  pathname: string;
  eyebrow: string;
  structuredData?: SeoProps["structuredData"];
  children: ReactNode;
}

export function PublicPageLayout({
  title,
  description,
  pathname,
  eyebrow,
  structuredData,
  children,
}: PublicPageLayoutProps) {
  return (
    <div className="min-h-screen px-4 py-20 text-[var(--color-text)] lg:px-6 lg:py-5">
      <Seo description={description} pathname={pathname} structuredData={structuredData} title={title} />
      <div className="mx-auto max-w-[1320px]">
        <SiteHeader eyebrow={eyebrow} />

        <section className="py-8">{children}</section>

        <footer className="py-6">
          <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">EventQR</p>
              <p className="text-sm text-slate-500">
                Support{" "}
                <a className="font-medium text-amber-700 hover:text-amber-800" href="mailto:support@magitecx.com">
                  support@magitecx.com
                </a>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <Link className="hover:text-slate-900" to="/about">
                About
              </Link>
              <Link className="hover:text-slate-900" to="/contact">
                Contact
              </Link>
              <Link className="hover:text-slate-900" to="/help">
                Help / FAQ
              </Link>
              <Link className="hover:text-slate-900" to="/privacy">
                Privacy Policy
              </Link>
              <Link className="hover:text-slate-900" to="/terms">
                Terms of Service
              </Link>
              <BrandBadge compact />
            </div>
          </Card>
        </footer>
      </div>
    </div>
  );
}
