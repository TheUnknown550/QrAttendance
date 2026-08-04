import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { BrandBadge } from "../components/brand/brand-badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { LanguageToggle } from "../components/ui/language-toggle";
import { ThemeToggle } from "../components/ui/theme-toggle";
import { Seo } from "../components/seo/seo";
import { api, getErrorMessage } from "../lib/api";

const resetSchema = z.object({
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetValues = z.infer<typeof resetSchema>;

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const hasToken = token.length >= 32;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
  });

  const mutation = useMutation({
    mutationFn: async (values: ResetValues) =>
      api.post("/auth/reset-password", {
        token,
        newPassword: values.password,
      }),
  });

  const helperText = useMemo(() => {
    if (!hasToken) {
      return t("auth.resetPassword.invalidLink");
    }

    return t("auth.resetPassword.hint");
  }, [hasToken, t]);

  return (
    <div className="min-h-screen px-4 py-6">
      <Seo noindex pathname="/reset-password" title={t("auth.resetPassword.seoTitle")} />
      <div className="fixed right-3 top-3 z-50 flex items-center gap-2 lg:right-6 lg:top-6">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <div className="mx-auto max-w-xl">
        <Link className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900" to="/login">
          <ArrowLeft className="size-4" />
          {t("auth.forgotPassword.backToLogin")}
        </Link>

        <Card className="mt-4 p-8">
          <p className="text-sm font-semibold text-slate-900">{t("auth.forgotPassword.eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{t("auth.resetPassword.title")}</h1>
          <p className="mt-2 text-sm text-slate-500">{helperText}</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">{t("auth.resetPassword.newPassword")}</span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-3.5 size-4 text-slate-400" />
                <Input className="pl-11" type="password" {...register("password")} />
              </div>
              {errors.password ? <p className="mt-2 text-xs text-rose-500">{errors.password.message}</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">{t("auth.resetPassword.confirmNewPassword")}</span>
              <Input type="password" {...register("confirmPassword")} />
              {errors.confirmPassword ? <p className="mt-2 text-xs text-rose-500">{errors.confirmPassword.message}</p> : null}
            </label>

            {mutation.isError ? (
              <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {getErrorMessage(mutation.error)}
              </p>
            ) : null}

            {mutation.isSuccess ? (
              <p className="rounded-[8px] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {t("auth.resetPassword.successMessage")}
              </p>
            ) : null}

            <Button className="w-full" disabled={!hasToken || mutation.isPending} type="submit">
              {mutation.isPending ? t("auth.resetPassword.updating") : t("auth.resetPassword.resetPassword")}
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
      </div>
    </div>
  );
}
