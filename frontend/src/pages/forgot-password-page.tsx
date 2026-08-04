import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { z } from "zod";
import { BrandBadge } from "../components/brand/brand-badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { LanguageToggle } from "../components/ui/language-toggle";
import { ThemeToggle } from "../components/ui/theme-toggle";
import { Seo } from "../components/seo/seo";
import { api, getErrorMessage } from "../lib/api";

const forgotSchema = z.object({
  email: z.email(),
});

type ForgotValues = z.infer<typeof forgotSchema>;

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
  });

  const mutation = useMutation({
    mutationFn: async (values: ForgotValues) => api.post("/auth/forgot-password", values),
  });

  return (
    <div className="min-h-screen px-4 py-6">
      <Seo noindex pathname="/forgot-password" title={t("auth.forgotPassword.seoTitle")} />
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
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{t("auth.forgotPassword.title")}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {t("auth.forgotPassword.hint")}
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">{t("auth.login.email")}</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-3.5 size-4 text-slate-400" />
                <Input className="pl-11" {...register("email")} />
              </div>
              {errors.email ? <p className="mt-2 text-xs text-rose-500">{errors.email.message}</p> : null}
            </label>

            {mutation.isError ? (
              <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {getErrorMessage(mutation.error)}
              </p>
            ) : null}

            {mutation.isSuccess ? (
              <p className="rounded-[8px] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {t("auth.forgotPassword.successMessage")}
              </p>
            ) : null}

            <Button className="w-full" disabled={mutation.isPending} type="submit">
              {mutation.isPending ? t("auth.forgotPassword.sending") : t("auth.forgotPassword.sendResetLink")}
            </Button>
          </form>

          <div className="mt-8 border-t border-[var(--color-border)] pt-5">
            <BrandBadge compact />
          </div>
        </Card>
      </div>
    </div>
  );
}
