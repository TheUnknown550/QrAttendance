import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { BrandBadge } from "../components/brand/brand-badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
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
      return "This reset link is invalid. Request a new link from forgot password.";
    }

    return "Set a new password for your account.";
  }, [hasToken]);

  return (
    <div className="min-h-screen px-4 py-6">
      <Seo noindex pathname="/reset-password" title="Reset password" />
      <div className="mx-auto max-w-xl">
        <Link className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900" to="/login">
          <ArrowLeft className="size-4" />
          Back to login
        </Link>

        <Card className="mt-4 p-8">
          <p className="text-sm font-semibold text-slate-900">Reset password</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Choose a new password</h1>
          <p className="mt-2 text-sm text-slate-500">{helperText}</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">New password</span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-3.5 size-4 text-slate-400" />
                <Input className="pl-11" type="password" {...register("password")} />
              </div>
              {errors.password ? <p className="mt-2 text-xs text-rose-500">{errors.password.message}</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Confirm new password</span>
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
                Password reset successful. You can now log in.
              </p>
            ) : null}

            <Button className="w-full" disabled={!hasToken || mutation.isPending} type="submit">
              {mutation.isPending ? "Updating..." : "Reset password"}
            </Button>
          </form>

          <div className="mt-8 border-t border-[var(--color-border)] pt-5">
            <BrandBadge compact />
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
              <Link className="hover:text-slate-900" to="/privacy">
                Privacy Policy
              </Link>
              <Link className="hover:text-slate-900" to="/terms">
                Terms of Service
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
