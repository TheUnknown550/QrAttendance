import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, Building2, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { api, getErrorMessage, unwrapResponse } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { AuthResponse } from "../types/api";

const accountSchema = z.object({
  name: z.string().trim().min(2),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type AccountValues = z.infer<typeof accountSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export function AccountSettingsPage() {
  const { auth, activeMembership, setAuthState } = useAuth();
  const queryClient = useQueryClient();

  const accountForm = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
  });
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (auth) {
      accountForm.reset({
        name: auth.user.name,
      });
    }
  }, [accountForm, auth]);

  const accountMutation = useMutation({
    mutationFn: async (values: AccountValues) =>
      unwrapResponse<AuthResponse>(await api.patch("/auth/account", values)),
    onSuccess: (result) => setAuthState(result),
  });

  const switchMutation = useMutation({
    mutationFn: async (organizationId: string) =>
      unwrapResponse<AuthResponse>(await api.post("/auth/switch-organization", { organizationId })),
    onSuccess: (result) => {
      queryClient.removeQueries({ queryKey: ["attendees"] });
      queryClient.removeQueries({ queryKey: ["attendees-summary"] });
      queryClient.removeQueries({ queryKey: ["event-series"] });
      queryClient.removeQueries({ queryKey: ["series-report"] });
      queryClient.removeQueries({ queryKey: ["scanner-share-link"] });
      queryClient.removeQueries({ queryKey: ["organization-current"] });
      queryClient.removeQueries({ queryKey: ["organization-current-banner"] });
      setAuthState(result);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (values: PasswordValues) =>
      unwrapResponse(await api.post("/auth/change-password", values)),
    onSuccess: () => passwordForm.reset(),
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card className="p-8">
        <p className="text-sm font-semibold text-slate-900">Account settings</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-slate-900">Profile</h1>

        <form className="mt-8 space-y-4" onSubmit={accountForm.handleSubmit((values) => accountMutation.mutate(values))}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">Name</span>
            <Input {...accountForm.register("name")} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">Email</span>
            <Input disabled value={auth?.user.email ?? ""} />
          </label>

          {accountMutation.isError ? (
            <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getErrorMessage(accountMutation.error)}
            </p>
          ) : null}

          <Button type="submit">{accountMutation.isPending ? "Saving..." : "Save account"}</Button>
        </form>

        <form className="mt-10 space-y-4" onSubmit={passwordForm.handleSubmit((values) => passwordMutation.mutate(values))}>
          <h2 className="text-xl font-semibold text-slate-900">Password</h2>
          <Input placeholder="Current password" type="password" {...passwordForm.register("currentPassword")} />
          <Input placeholder="New password" type="password" {...passwordForm.register("newPassword")} />
          <Input placeholder="Confirm new password" type="password" {...passwordForm.register("confirmPassword")} />
          {passwordMutation.isError ? (
            <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getErrorMessage(passwordMutation.error)}
            </p>
          ) : null}
          <Button type="submit" variant="secondary">
            {passwordMutation.isPending ? "Updating password..." : "Update password"}
          </Button>
        </form>

        <div className="mt-10 rounded-[8px] bg-[var(--color-surface-soft)] p-5">
          <p className="text-sm font-semibold text-slate-900">Workspace</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/app/onboarding">
              <Button icon={<Building2 className="size-4" />} variant="secondary">
                Create or join organization
              </Button>
            </Link>
            <Link to="/app/settings/organization">
              <Button icon={<ShieldCheck className="size-4" />} variant="ghost">
                Open organization settings
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <Card className="p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Organizations</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">{auth?.memberships.length ?? 0}</h2>
          </div>
          {activeMembership ? (
            <span className="max-w-full break-words rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
              Active: {activeMembership.organizationName}
            </span>
          ) : null}
        </div>

        <div className="mt-6 space-y-3">
          {auth?.memberships.map((membership) => (
            <div key={membership.membershipId} className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="break-words font-semibold text-slate-900">{membership.organizationName}</p>
                  <p className="mt-1 text-sm text-slate-500">{membership.role.toLowerCase()} membership</p>
                </div>

                {membership.organizationId === auth?.activeOrganizationId ? (
                  <Button type="button" variant="ghost">
                    Current org
                  </Button>
                ) : (
                  <Button
                    disabled={switchMutation.isPending}
                    icon={<ArrowRightLeft className="size-4" />}
                    onClick={() => switchMutation.mutate(membership.organizationId)}
                    type="button"
                    variant="secondary"
                  >
                    Switch
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
