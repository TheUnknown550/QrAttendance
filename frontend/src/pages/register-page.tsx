import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { LockKeyhole, Mail, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { BrandBadge } from "../components/brand/brand-badge";
import { BrandLogo } from "../components/brand/brand-logo";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { LanguageToggle } from "../components/ui/language-toggle";
import { ThemeToggle } from "../components/ui/theme-toggle";
import { Seo } from "../components/seo/seo";
import { api, getErrorMessage, unwrapResponse } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { RegisterPayload } from "../types/api";

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.email(),
  password: z.string().min(6),
  acceptedTerms: z.boolean().refine((value) => value === true, {
    message: "You must agree before creating an account",
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { auth, isInitializing } = useAuth();
  const registerSideContent = {
    terms: {
      title: t("auth.register.legal.terms.title"),
      body: t("auth.register.legal.terms.body"),
    },
    privacy: {
      title: t("auth.register.legal.privacy.title"),
      body: t("auth.register.legal.privacy.body"),
    },
  } as const;
  const [activeDocument, setActiveDocument] = useState<keyof typeof registerSideContent | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (!isInitializing && auth) {
      navigate("/app", { replace: true });
    }
  }, [auth, isInitializing, navigate]);

  const mutation = useMutation({
    mutationFn: async (values: RegisterPayload) =>
      unwrapResponse<null>(await api.post("/auth/register", values)),
    onSuccess: () => {
      navigate("/login");
    },
  });

  const sideDocument = activeDocument ? registerSideContent[activeDocument] : null;

  return (
    <div className="min-h-screen px-4 py-6">
      <Seo
        description={t("auth.register.seoDescription")}
        noindex
        pathname="/register"
        title={t("auth.register.seoTitle")}
      />
      <div className="fixed right-3 top-3 z-50 flex items-center gap-2 lg:right-6 lg:top-6">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between pr-24 lg:pr-28">
          <Link className="font-display text-2xl font-semibold text-slate-900" to="/">
            EventQR
          </Link>
          <Link to="/login">
            <Button variant="ghost">{t("siteHeader.login")}</Button>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="p-8">
            <div className="flex items-center gap-3">
              <BrandLogo imageClassName="h-12" />
              <div>
                <p className="text-sm font-semibold text-slate-900">{t("auth.register.eyebrow")}</p>
                <p className="text-sm text-slate-500">{t("auth.register.eyebrowSub")}</p>
              </div>
            </div>

            <h1 className="mt-6 font-display text-4xl font-semibold text-slate-900">{t("auth.register.title")}</h1>

            <form className="mt-8 grid gap-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">{t("auth.register.name")}</span>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-3.5 size-4 text-slate-400" />
                  <Input autoComplete="name" className="pl-11" placeholder="Jordan Lee" {...register("name")} />
                </div>
                {errors.name ? <p className="mt-2 text-xs text-rose-500">{errors.name.message}</p> : null}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">{t("auth.login.email")}</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-3.5 size-4 text-slate-400" />
                  <Input autoComplete="email" className="pl-11" placeholder="jordan@example.com" {...register("email")} />
                </div>
                {errors.email ? <p className="mt-2 text-xs text-rose-500">{errors.email.message}</p> : null}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">{t("auth.login.password")}</span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-3.5 size-4 text-slate-400" />
                  <Input
                    autoComplete="new-password"
                    className="pl-11"
                    placeholder={t("auth.register.passwordPlaceholder")}
                    type="password"
                    {...register("password")}
                  />
                </div>
                {errors.password ? <p className="mt-2 text-xs text-rose-500">{errors.password.message}</p> : null}
              </label>

              <label className="flex items-start gap-3 rounded-[8px] bg-[var(--color-surface-soft)] px-4 py-3">
                <input
                  className="mt-1 size-4 rounded-[4px] border border-[var(--color-border)] text-amber-600 focus:ring-amber-300"
                  type="checkbox"
                  {...register("acceptedTerms")}
                />
                <span className="text-sm leading-6 text-slate-600">
                  {t("auth.register.agreeToThe")}{" "}
                  <button
                    className="font-medium text-amber-700 hover:text-amber-800"
                    onClick={() => setActiveDocument("terms")}
                    type="button"
                  >
                    {t("auth.login.termsOfService")}
                  </button>{" "}
                  {t("auth.register.and")}{" "}
                  <button
                    className="font-medium text-amber-700 hover:text-amber-800"
                    onClick={() => setActiveDocument("privacy")}
                    type="button"
                  >
                    {t("auth.login.privacyPolicy")}
                  </button>
                  .
                </span>
              </label>
              {errors.acceptedTerms ? (
                <p className="-mt-2 text-xs text-rose-500">{errors.acceptedTerms.message}</p>
              ) : null}

              {mutation.isError ? (
                <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {getErrorMessage(mutation.error)}
                </p>
              ) : null}

              <Button className="mt-2 w-full py-3 text-base" disabled={mutation.isPending} type="submit">
                {mutation.isPending ? t("auth.register.creating") : t("siteHeader.createAccount")}
              </Button>
            </form>

            <div className="mt-8 border-t border-[var(--color-border)] pt-5">
              <BrandBadge compact />
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                <Link className="hover:text-slate-900" to="/privacy">
                  {t("auth.login.privacyPolicy")}
                </Link>
                <Link className="hover:text-slate-900" to="/terms">
                  {t("auth.login.termsOfService")}
                </Link>
              </div>
            </div>
          </Card>

          <div className="grid gap-6">
            <Card className="p-8">
              {sideDocument ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t("auth.register.agreement")}</p>
                      <h2 className="mt-2 font-display text-4xl font-semibold text-slate-900">{sideDocument.title}</h2>
                    </div>
                    <button
                      aria-label={t("auth.register.closeDocument")}
                      className="rounded-[8px] bg-[var(--color-surface-soft)] p-2 text-slate-500 transition hover:text-slate-900"
                      onClick={() => setActiveDocument(null)}
                      type="button"
                    >
                      <X className="size-5" />
                    </button>
                  </div>
                  <div className="mt-6 h-[320px] overflow-y-auto rounded-[8px] bg-[var(--color-surface-soft)] px-5 py-4 sm:h-[420px]">
                    <p className="whitespace-pre-line text-sm leading-7 text-slate-600">{sideDocument.body}</p>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="font-display text-4xl font-semibold text-slate-900">{t("auth.register.afterSignUp")}</h2>
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {[
                      t("auth.register.steps.createWorkspace"),
                      t("auth.register.steps.joinByCode"),
                      t("auth.register.steps.openInviteLink"),
                      t("auth.register.steps.startScanning"),
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-[8px] bg-[var(--color-surface-soft)] p-5"
                      >
                        <p className="text-lg font-semibold text-slate-900">{item}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>

            <Card className="flex items-center justify-between gap-4 p-6">
              <div>
                <p className="text-sm font-semibold text-slate-900">{t("auth.register.alreadyHaveAccount")}</p>
                <p className="text-sm text-slate-500">{t("auth.register.goToLogin")}</p>
              </div>
              <Link to="/login">
                <Button variant="secondary">{t("siteHeader.login")}</Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
