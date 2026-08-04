import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, DoorOpen, RotateCw, Shield, Trash2, UserCog } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { api, getErrorMessage, unwrapResponse } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatDate } from "../lib/utils";
import type { AuthResponse, OrganizationDetail } from "../types/api";

export function OrganizationSettingsPage() {
  const navigate = useNavigate();
  const { activeMembership, auth, setAuthState } = useAuth();
  const queryClient = useQueryClient();
  const [organizationName, setOrganizationName] = useState("");
  const [inviteExpiryDays, setInviteExpiryDays] = useState("30");
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [joinCodeCopied, setJoinCodeCopied] = useState(false);
  const [deleteConfirmationName, setDeleteConfirmationName] = useState("");
  const joinCodeTimeoutRef = useRef<number | null>(null);
  const inviteLinkTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (joinCodeTimeoutRef.current) window.clearTimeout(joinCodeTimeoutRef.current);
      if (inviteLinkTimeoutRef.current) window.clearTimeout(inviteLinkTimeoutRef.current);
    };
  }, []);

  const organizationQuery = useQuery({
    queryKey: ["organization-current", auth?.activeOrganizationId],
    enabled: Boolean(activeMembership),
    queryFn: async () => unwrapResponse<OrganizationDetail>(await api.get("/organizations/current")),
  });

  const organization = organizationQuery.data;
  const canManageOrganization = organization?.permissions.canManageOrganization ?? false;
  const canManageMembers = organization?.permissions.canManageMembers ?? false;
  const canCreateInvites = organization?.permissions.canCreateInvites ?? false;
  const isInactive = organization?.lifecycle.status === "INACTIVE";

  useEffect(() => {
    if (organization?.name) {
      setOrganizationName(organization.name);
    }
  }, [organization?.name]);

  const updateMutation = useMutation({
    mutationFn: async (name: string) => unwrapResponse(await api.patch("/organizations/current", { name })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organization-current", auth?.activeOrganizationId] }),
  });

  const regenerateMutation = useMutation({
    mutationFn: async () =>
      unwrapResponse<{ joinCode: string }>(await api.post("/organizations/current/regenerate-join-code")),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organization-current", auth?.activeOrganizationId] }),
  });

  const inviteMutation = useMutation({
    mutationFn: async () =>
      unwrapResponse(
        await api.post("/organizations/current/invites", { expiresInDays: Number(inviteExpiryDays) }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organization-current", auth?.activeOrganizationId] }),
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ membershipId, role }: { membershipId: string; role: "ADMIN" | "MEMBER" }) =>
      unwrapResponse(await api.patch(`/organizations/current/members/${membershipId}`, { role })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organization-current", auth?.activeOrganizationId] }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (membershipId: string) =>
      unwrapResponse(await api.delete(`/organizations/current/members/${membershipId}`)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organization-current", auth?.activeOrganizationId] }),
  });

  const leaveOrganizationMutation = useMutation({
    mutationFn: async () => unwrapResponse<AuthResponse>(await api.post("/organizations/current/leave")),
    onSuccess: (result) => {
      setAuthState(result);
      queryClient.removeQueries({ queryKey: ["organization-current"] });
      navigate(result.activeOrganizationId ? "/app" : "/app/onboarding");
    },
  });

  const deleteOrganizationMutation = useMutation({
    mutationFn: async () => unwrapResponse<AuthResponse>(await api.delete("/organizations/current")),
    onSuccess: (result) => {
      setAuthState(result);
      queryClient.removeQueries({ queryKey: ["organization-current"] });
      queryClient.removeQueries({ queryKey: ["organization-current-banner"] });
      queryClient.invalidateQueries({ queryKey: ["attendees"] });
      queryClient.invalidateQueries({ queryKey: ["attendees-summary"] });
      setDeleteConfirmationName("");
      navigate(result.activeOrganizationId ? "/app" : "/app/onboarding");
    },
  });

  const inviteBaseUrl = typeof window === "undefined" ? "" : window.location.origin;

  async function copyJoinCode() {
    if (!organization?.joinCode) {
      return;
    }

    await navigator.clipboard.writeText(organization.joinCode);
    setJoinCodeCopied(true);
    if (joinCodeTimeoutRef.current) window.clearTimeout(joinCodeTimeoutRef.current);
    joinCodeTimeoutRef.current = window.setTimeout(() => setJoinCodeCopied(false), 1800);
  }

  async function copyInviteLink(inviteId: string, inviteUrl: string) {
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedInviteId(inviteId);
    if (inviteLinkTimeoutRef.current) window.clearTimeout(inviteLinkTimeoutRef.current);
    inviteLinkTimeoutRef.current = window.setTimeout(() => {
      setCopiedInviteId((current) => (current === inviteId ? null : current));
    }, 1800);
  }

  const deleteNameMatches = organization ? deleteConfirmationName.trim() === organization.name : false;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
      <Card className="p-8">
        <p className="text-sm font-semibold text-slate-900">Organization settings</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-slate-900">Workspace</h1>
        <div className="mt-5 flex flex-wrap gap-3">
          <span className="max-w-full break-words rounded-[8px] bg-[var(--color-surface-soft)] px-4 py-2 text-sm text-slate-700">
            Your role: {organization?.currentUserRole ?? activeMembership?.role ?? "MEMBER"}
          </span>
          {isInactive ? (
            <span className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
              Inactive workspace
            </span>
          ) : null}
          {!canManageOrganization ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
              View-only access
            </span>
          ) : null}
        </div>

        {organization ? (
          <div className={isInactive ? "mt-6 rounded-[8px] bg-rose-50 p-5" : "mt-6 rounded-[8px] bg-[var(--color-surface-soft)] p-5"}>
            <p className="text-sm font-semibold text-slate-900">Lifecycle</p>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>Last activity: {formatDate(organization.lifecycle.lastActivityAt)}</p>
              <p>Inactive warning after: {organization.lifecycle.warningThresholdDays} days</p>
              <p>Hard delete after: {organization.lifecycle.hardDeleteThresholdDays} days</p>
              {organization.lifecycle.scheduledDeletionAt ? (
                <p className={isInactive ? "font-semibold text-rose-700" : ""}>
                  Scheduled deletion: {formatDate(organization.lifecycle.scheduledDeletionAt)}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">Organization name</span>
            <Input
              disabled={!canManageOrganization}
              onChange={(event) => setOrganizationName(event.target.value)}
              value={organizationName}
            />
          </label>

          {updateMutation.isError ? (
            <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getErrorMessage(updateMutation.error)}
            </p>
          ) : null}

          <Button
            disabled={!canManageOrganization || updateMutation.isPending}
            onClick={() => updateMutation.mutate(organizationName)}
            type="button"
          >
            {updateMutation.isPending ? "Saving..." : "Save organization"}
          </Button>
        </div>

        <div className="mt-10 rounded-[8px] bg-[var(--color-surface-soft)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Join code</p>
              <p className="mt-1 text-sm text-slate-500">Share for manual joins.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button icon={<Copy className="size-4" />} onClick={copyJoinCode} type="button" variant="ghost">
                {joinCodeCopied ? "Copied" : "Copy"}
              </Button>
              <Button
                disabled={!canManageOrganization || regenerateMutation.isPending}
                icon={<RotateCw className="size-4" />}
                onClick={() => regenerateMutation.mutate()}
                type="button"
                variant="secondary"
              >
                Regenerate
              </Button>
            </div>
          </div>
          <div className="mt-4 break-all rounded-[8px] bg-white px-4 py-3 font-mono text-lg text-amber-700">
            {organization?.joinCode ?? "Loading..."}
          </div>
        </div>

        <div className="mt-6 rounded-[8px] bg-[var(--color-surface-soft)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Invite links</p>
              <p className="mt-1 text-sm text-slate-500">Create a shareable auto-join link.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                className="min-w-[140px]"
                disabled={!canCreateInvites || inviteMutation.isPending}
                onChange={(event) => setInviteExpiryDays(event.target.value)}
                value={inviteExpiryDays}
              >
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </Select>
              <Button
                disabled={!canCreateInvites || inviteMutation.isPending}
                onClick={() => inviteMutation.mutate()}
                type="button"
                variant="secondary"
              >
                Create invite
              </Button>
            </div>
          </div>
          {!canCreateInvites ? (
            <p className="mt-4 rounded-[8px] bg-white px-4 py-3 text-sm text-slate-500">
              Invite creation is available to organization admins and owners.
            </p>
          ) : null}
        </div>

        <div className="mt-6 rounded-[8px] bg-rose-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Leave organization</p>
              <p className="mt-1 text-sm text-slate-500">
                Remove your own access to this workspace. Your account will remain active.
              </p>
            </div>
            <Button
              disabled={leaveOrganizationMutation.isPending}
              icon={<DoorOpen className="size-4" />}
              onClick={() => leaveOrganizationMutation.mutate()}
              type="button"
              variant="danger"
            >
              {leaveOrganizationMutation.isPending ? "Leaving..." : "Leave workspace"}
            </Button>
          </div>
          {leaveOrganizationMutation.isError ? (
            <p className="mt-4 rounded-[8px] bg-white px-4 py-3 text-sm text-rose-700">
              {getErrorMessage(leaveOrganizationMutation.error)}
            </p>
          ) : null}
        </div>

        {canManageOrganization ? (
          <div className="mt-6 rounded-[8px] border border-rose-200 bg-rose-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Delete organization</p>
            <p className="mt-1 text-sm text-slate-600">
              Permanently delete this workspace, all attendees, check-ins, sessions, invites, and organization data.
            </p>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Type <span className="font-semibold">{organization?.name ?? "the workspace name"}</span> to confirm
              </span>
              <Input
                disabled={deleteOrganizationMutation.isPending || !organization}
                onChange={(event) => setDeleteConfirmationName(event.target.value)}
                value={deleteConfirmationName}
              />
            </label>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                disabled={!deleteNameMatches || deleteOrganizationMutation.isPending}
                icon={<Trash2 className="size-4" />}
                onClick={() => deleteOrganizationMutation.mutate()}
                type="button"
                variant="danger"
              >
                {deleteOrganizationMutation.isPending ? "Deleting workspace..." : "Delete workspace"}
              </Button>
              <p className="text-xs text-slate-500">This cannot be undone.</p>
            </div>
            {deleteOrganizationMutation.isError ? (
              <p className="mt-4 rounded-[8px] bg-white px-4 py-3 text-sm text-rose-700">
                {getErrorMessage(deleteOrganizationMutation.error)}
              </p>
            ) : null}
          </div>
        ) : null}
      </Card>

      <div className="grid gap-6">
        <Card className="p-8">
          <p className="text-sm font-semibold text-slate-900">Members</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">{organization?.members.length ?? 0} team members</h2>
          {!canManageMembers ? (
            <p className="mt-4 rounded-[8px] bg-[var(--color-surface-soft)] px-4 py-3 text-sm text-slate-500">
              Only owners can update roles or remove members.
            </p>
          ) : null}

          <div className="mt-6 space-y-3">
            {organization?.members.map((member) => (
              <div key={member.membershipId} className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-slate-900">{member.name}</p>
                    <p className="break-words text-sm text-slate-500">{member.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="max-w-full break-words rounded-[6px] bg-white px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-600">
                      {member.role}
                    </span>
                    {member.userId === auth?.user.id ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs uppercase tracking-[0.18em] text-emerald-700">
                        You
                      </span>
                    ) : null}
                    {canManageMembers && member.userId !== auth?.user.id && member.role !== "OWNER" ? (
                      <>
                        <Select
                          className="min-w-[130px]"
                          disabled={updateMemberRoleMutation.isPending}
                          onChange={(event) =>
                            updateMemberRoleMutation.mutate({
                              membershipId: member.membershipId,
                              role: event.target.value as "ADMIN" | "MEMBER",
                            })
                          }
                          value={member.role}
                        >
                          <option value="ADMIN">Admin</option>
                          <option value="MEMBER">Member</option>
                        </Select>
                        <Button
                          disabled={removeMemberMutation.isPending}
                          icon={<Trash2 className="size-4" />}
                          onClick={() => removeMemberMutation.mutate(member.membershipId)}
                          type="button"
                          variant="danger"
                        >
                          Remove
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-8">
          <p className="text-sm font-semibold text-slate-900">Invite history</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">{organization?.invites.length ?? 0} invite links</h2>

          <div className="mt-6 space-y-3">
            {organization?.invites.map((invite) => {
              const inviteUrl = `${inviteBaseUrl}/invite/${invite.token}`;

              return (
                <div key={invite.id} className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-semibold text-slate-900">Invite created by {invite.createdByName}</p>
                      <p className="mt-2 break-all text-sm text-slate-500">{inviteUrl}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                        Created {formatDate(invite.createdAt)} - Used {invite.usedCount} times
                      </p>
                    </div>
                    <Button
                      icon={<Copy className="size-4" />}
                      onClick={() => copyInviteLink(invite.id, inviteUrl)}
                      type="button"
                      variant="ghost"
                    >
                      {copiedInviteId === invite.id ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-8">
          <p className="text-sm font-semibold text-slate-900">Admin controls</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Permissions</h2>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              {
                title: "Workspace config",
                enabled: canManageOrganization,
                icon: Shield,
              },
              {
                title: "Invite creation",
                enabled: canCreateInvites,
                icon: UserCog,
              },
              {
                title: "Member management",
                enabled: canManageMembers,
                icon: UserCog,
              },
            ].map((item) => (
              <div key={item.title} className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                <item.icon className="size-5 text-amber-700" />
                <p className="mt-4 font-semibold text-slate-900">{item.title}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {item.enabled ? "Enabled for your role" : "Requires higher organization access"}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
