import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, Building2, Link2, Users } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  api,
  clearPendingInviteToken,
  getErrorMessage,
  getPendingInviteToken,
  unwrapResponse,
} from "../lib/api";
import { useAuth } from "../lib/auth";
import type { AuthResponse } from "../types/api";

const createOrganizationSchema = z.object({
  name: z.string().trim().min(2),
});

const joinOrganizationSchema = z.object({
  joinCode: z.string().trim().min(4),
});

type CreateOrganizationValues = z.infer<typeof createOrganizationSchema>;
type JoinOrganizationValues = z.infer<typeof joinOrganizationSchema>;

export function OnboardingPage() {
  const navigate = useNavigate();
  const { auth, setAuthState } = useAuth();
  const queryClient = useQueryClient();
  const pendingInviteToken = getPendingInviteToken();

  const createForm = useForm<CreateOrganizationValues>({
    resolver: zodResolver(createOrganizationSchema),
  });

  const joinForm = useForm<JoinOrganizationValues>({
    resolver: zodResolver(joinOrganizationSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (values: CreateOrganizationValues) =>
      unwrapResponse<AuthResponse>(await api.post("/organizations", values)),
    onSuccess: (result) => {
      clearPendingInviteToken();
      setAuthState(result);
      navigate("/app");
    },
  });

  const joinMutation = useMutation({
    mutationFn: async (values: JoinOrganizationValues) =>
      unwrapResponse<AuthResponse>(await api.post("/organizations/join", values)),
    onSuccess: (result) => {
      clearPendingInviteToken();
      setAuthState(result);
      navigate("/app");
    },
  });

  const switchMutation = useMutation({
    mutationFn: async (organizationId: string) =>
      unwrapResponse<AuthResponse>(await api.post("/auth/switch-organization", { organizationId })),
    onSuccess: (result) => {
      clearPendingInviteToken();
      queryClient.removeQueries({ queryKey: ["attendees"] });
      queryClient.removeQueries({ queryKey: ["attendees-summary"] });
      queryClient.removeQueries({ queryKey: ["event-series"] });
      queryClient.removeQueries({ queryKey: ["series-report"] });
      queryClient.removeQueries({ queryKey: ["scanner-share-link"] });
      queryClient.removeQueries({ queryKey: ["organization-current"] });
      queryClient.removeQueries({ queryKey: ["organization-current-banner"] });
      setAuthState(result);
      navigate("/app");
    },
  });

  const acceptInviteMutation = useMutation({
    mutationFn: async (token: string) =>
      unwrapResponse<AuthResponse>(await api.post(`/organizations/invites/${token}/accept`)),
    onSuccess: (result) => {
      clearPendingInviteToken();
      setAuthState(result);
      navigate("/app");
    },
  });

  useEffect(() => {
    if (auth && pendingInviteToken && !acceptInviteMutation.isPending && !acceptInviteMutation.isSuccess) {
      acceptInviteMutation.mutate(pendingInviteToken);
    }
  }, [acceptInviteMutation, auth, pendingInviteToken]);

  if (!auth) {
    return <Navigate replace to="/login" />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <Card className="p-8">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
            <Building2 className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Workspace setup</p>
            <p className="text-sm text-slate-500">Choose how to continue</p>
          </div>
        </div>

        {pendingInviteToken ? (
          <div className="mt-6 rounded-[8px] bg-emerald-50 p-4 text-sm text-emerald-700">
            Invite detected. Joining...
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { title: "Create", icon: Building2 },
            { title: "Join code", icon: Users },
            { title: "Invite", icon: Link2 },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[8px] bg-[var(--color-surface-soft)] p-5"
            >
              <div className="w-fit rounded-[8px] bg-white p-3 text-amber-700">
                <item.icon className="size-5" />
              </div>
              <p className="mt-4 text-lg font-semibold text-slate-900">{item.title}</p>
            </div>
          ))}
        </div>

        {auth.memberships.length > 0 ? (
          <div className="mt-8">
            <div className="flex items-center gap-3">
              <ArrowRightLeft className="size-4 text-slate-500" />
              <p className="text-sm font-semibold text-slate-600">Your organizations</p>
            </div>
            <div className="mt-4 grid gap-3">
              {auth.memberships.map((membership) => (
                <button
                  key={membership.membershipId}
                  className="rounded-[8px] bg-[var(--color-surface-soft)] p-4 text-left transition hover:bg-white"
                  onClick={() => switchMutation.mutate(membership.organizationId)}
                  type="button"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{membership.organizationName}</p>
                      <p className="mt-1 text-sm text-slate-500">{membership.role.toLowerCase()}</p>
                    </div>
                    <Button disabled={switchMutation.isPending} type="button" variant="ghost">
                      Open
                    </Button>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      <div className="grid gap-6">
        <Card className="p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
              <Building2 className="size-5" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900">Create organization</h2>
          </div>

          <form className="mt-6 space-y-4" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Organization name</span>
              <Input placeholder="Acme Learning Lab" {...createForm.register("name")} />
              {createForm.formState.errors.name ? (
                <p className="mt-2 text-xs text-rose-500">{createForm.formState.errors.name.message}</p>
              ) : null}
            </label>

            {createMutation.isError ? (
              <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {getErrorMessage(createMutation.error)}
              </p>
            ) : null}

            <Button className="w-full" disabled={createMutation.isPending} type="submit">
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </form>
        </Card>

        <Card className="p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-[8px] bg-emerald-50 p-3 text-emerald-700">
              <Users className="size-5" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900">Join with code</h2>
          </div>

          <form className="mt-6 space-y-4" onSubmit={joinForm.handleSubmit((values) => joinMutation.mutate(values))}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Join code</span>
              <Input placeholder="AB12CD34" {...joinForm.register("joinCode")} />
              {joinForm.formState.errors.joinCode ? (
                <p className="mt-2 text-xs text-rose-500">{joinForm.formState.errors.joinCode.message}</p>
              ) : null}
            </label>

            {joinMutation.isError ? (
              <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {getErrorMessage(joinMutation.error)}
              </p>
            ) : null}

            <Button className="w-full" disabled={joinMutation.isPending} type="submit" variant="secondary">
              {joinMutation.isPending ? "Joining..." : "Join"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
