import { Link } from "react-router-dom";
import { BrandLogo } from "../brand/brand-logo";
import { Button } from "../ui/button";
import { ThemeToggle } from "../ui/theme-toggle";

interface SiteHeaderProps {
  eyebrow: string;
}

const headerLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/docs", label: "Docs" },
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
  { to: "/help", label: "Help / FAQ" },
];

export function SiteHeader({ eyebrow }: SiteHeaderProps) {
  return (
    <>
      <ThemeToggle className="fixed right-3 top-3 z-50 lg:right-6 lg:top-6" />
      <header className="rounded-[10px] bg-[var(--color-panel)] px-4 py-4 shadow-[var(--shadow-panel)] backdrop-blur sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-4 pr-14 sm:items-center sm:pr-16">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo imageClassName="h-10 sm:h-11" />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.22em] text-amber-700">EventQR</p>
              <p className="truncate font-display text-lg font-semibold text-slate-900 sm:text-xl">{eyebrow}</p>
            </div>
          </div>

          <nav className="hidden items-center gap-5 text-sm font-medium text-slate-500 md:flex">
            {headerLinks.map((item) => (
              <Link key={item.to} to={item.to}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end sm:gap-3">
            <Link className="flex-1 sm:flex-none" to="/login">
              <Button className="w-full" variant="ghost">Login</Button>
            </Link>
            <Link className="flex-1 sm:flex-none" to="/register">
              <Button className="w-full">Create account</Button>
            </Link>
          </div>
        </div>

        <nav className="mt-4 flex flex-wrap gap-2 md:hidden">
          {headerLinks.map((item) => (
            <Link
              key={item.to}
              className="rounded-[8px] bg-[var(--color-surface-soft)] px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
