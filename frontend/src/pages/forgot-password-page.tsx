import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { BrandBadge } from "../components/brand/brand-badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Seo } from "../components/seo/seo";
import { api, getErrorMessage } from "../lib/api";

const forgotSchema = z.object({
  email: z.email(),
});

type ForgotValues = z.infer<typeof forgotSchema>;

export function ForgotPasswordPage() {
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
      <Seo noindex pathname="/forgot-password" title="Forgot password" />
      <div className="mx-auto max-w-xl">
        <Link className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900" to="/login">
          <ArrowLeft className="size-4" />
          Back to login
        </Link>

        <Card className="mt-4 p-8">
          <p className="text-sm font-semibold text-slate-900">Reset password</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Email link request</h1>
          <p className="mt-2 text-sm text-slate-500">
            Enter your account email. If it exists, we will send a reset link.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Email</span>
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
                If that email exists, a reset link has been sent.
              </p>
            ) : null}

            <Button className="w-full" disabled={mutation.isPending} type="submit">
              {mutation.isPending ? "Sending..." : "Send reset link"}
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
