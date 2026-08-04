import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, LockKeyhole, Mail, QrCode, ScanLine, Sheet } from "lucide-react";
import { startTransition, useEffect } from "react";
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
import { api, getErrorMessage, getPendingInviteToken, unwrapResponse } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { AuthResponse } from "../types/api";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { auth, isInitializing, login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!isInitializing && auth) {
      navigate("/app", { replace: true });
    }
  }, [auth, isInitializing, navigate]);

  const mutation = useMutation({
    mutationFn: async (values: LoginFormValues) =>
      unwrapResponse<AuthResponse>(await api.post("/auth/login", values)),
    onSuccess: (result) => {
      login(result);
      const pendingInviteToken = getPendingInviteToken();
      startTransition(() => navigate(pendingInviteToken ? `/invite/${pendingInviteToken}` : "/app"));
    },
  });

  return (
    <div className="min-h-screen px-4 py-6">
      <Seo
        description={t("auth.login.seoDescription")}
        noindex
        pathname="/login"
        title={t("auth.login.seoTitle")}
      />
      <div className="fixed right-3 top-3 z-50 flex items-center gap-2 lg:right-6 lg:top-6">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between pr-24 lg:pr-28">
          <Link className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900" to="/">
            <ArrowLeft className="size-4" />
            {t("common.back")}
          </Link>
          <Link to="/register">
            <Button variant="secondary">{t("auth.login.register")}</Button>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="self-center p-8">
            <div className="flex items-center gap-3">
              <BrandLogo imageClassName="h-12" />
              <div>
                <p className="text-sm font-semibold text-slate-900">{t("auth.login.eyebrow")}</p>
                <p className="text-sm text-slate-500">{t("auth.login.eyebrowSub")}</p>
              </div>
            </div>

            <h1 className="mt-6 font-display text-4xl font-semibold text-slate-900">{t("auth.login.title")}</h1>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">{t("auth.login.email")}</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-3.5 size-4 text-slate-400" />
                  <Input autoComplete="email" className="pl-11" {...register("email")} />
                </div>
                {errors.email ? <p className="mt-2 text-xs text-rose-500">{errors.email.message}</p> : null}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">{t("auth.login.password")}</span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-3.5 size-4 text-slate-400" />
                  <Input
                    autoComplete="current-password"
                    className="pl-11"
                    type="password"
                    {...register("password")}
                  />
                </div>
                {errors.password ? (
                  <p className="mt-2 text-xs text-rose-500">{errors.password.message}</p>
                ) : null}
              </label>

              {mutation.isError ? (
                <p className="rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {getErrorMessage(mutation.error)}
                </p>
              ) : null}

              <Button className="w-full" disabled={mutation.isPending} type="submit">
                {mutation.isPending ? t("auth.login.signingIn") : t("auth.login.logIn")}
              </Button>
              <div className="text-center">
                <Link className="text-sm font-medium text-amber-700 hover:text-amber-800" to="/forgot-password">
                  {t("auth.login.forgotPassword")}
                </Link>
              </div>
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
              <h2 className="font-display text-4xl font-semibold text-slate-900">{t("auth.login.tagline")}</h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { title: "QR", icon: QrCode },
                  { title: t("auth.login.checkIn"), icon: ScanLine },
                  { title: "Excel", icon: Sheet },
                ].map((item) => (
                  <div key={item.title} className="rounded-[8px] bg-[var(--color-surface-soft)] p-5">
                    <div className="w-fit rounded-[8px] bg-amber-50 p-3 text-amber-700">
                      <item.icon className="size-5" />
                    </div>
                    <p className="mt-4 text-lg font-semibold text-slate-900">{item.title}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="flex items-center justify-between gap-4 p-6">
              <div>
                <p className="text-sm font-semibold text-slate-900">{t("auth.login.newHere")}</p>
                <p className="text-sm text-slate-500">{t("auth.login.newHereHint")}</p>
              </div>
              <Link to="/register">
                <Button variant="secondary">{t("siteHeader.createAccount")}</Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
