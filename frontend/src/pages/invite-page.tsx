import { useMutation, useQuery } from "@tanstack/react-query";
import { Link2 } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { LanguageToggle } from "../components/ui/language-toggle";
import { ThemeToggle } from "../components/ui/theme-toggle";
import { Seo } from "../components/seo/seo";
import {
  api,
  clearPendingInviteToken,
  getErrorMessage,
  setPendingInviteToken,
  unwrapResponse,
} from "../lib/api";
import { useAuth } from "../lib/auth";
import type { AuthResponse, InvitePublicInfo } from "../types/api";

export function InvitePage() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { auth, setAuthState } = useAuth();

  const inviteQuery = useQuery({
    queryKey: ["invite-public-info", token],
    enabled: Boolean(token),
    queryFn: async () => unwrapResponse<InvitePublicInfo>(await api.get(`/organizations/invites/${token}`)),
  });

  const acceptMutation = useMutation({
    mutationFn: async () =>
      unwrapResponse<AuthResponse>(await api.post(`/organizations/invites/${token}/accept`)),
    onSuccess: (result) => {
      clearPendingInviteToken();
      setAuthState(result);
      navigate("/app");
    },
  });

  useEffect(() => {
    if (auth && token && !acceptMutation.isPending && !acceptMutation.isSuccess) {
      acceptMutation.mutate();
    } else if (!auth && token) {
      setPendingInviteToken(token);
    }
  }, [acceptMutation, auth, token]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-slate-900">
      <Seo
        description={t("invite.seoDescription")}
        noindex
        pathname={`/invite/${token}`}
        title={t("invite.seoTitle")}
      />
      <div className="fixed right-3 top-3 z-50 flex items-center gap-2 lg:right-6 lg:top-6">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-2xl p-8">
        <div className="w-fit rounded-[8px] bg-emerald-50 p-3 text-emerald-700">
          <Link2 className="size-5" />
        </div>

        <p className="mt-5 text-sm font-semibold text-slate-900">{t("invite.eyebrow")}</p>
        <h1 className="mt-2 break-words font-display text-4xl font-semibold text-slate-900">
          {inviteQuery.data?.organizationName ?? t("invite.loading")}
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-500">
          {auth
            ? t("invite.joiningAutomatically")
            : t("invite.loginOrCreatePrompt")}
        </p>

        {acceptMutation.isError ? (
          <p className="mt-6 rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {getErrorMessage(acceptMutation.error)}
          </p>
        ) : null}

        {!auth ? (
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login">
              <Button>{t("auth.login.logIn")}</Button>
            </Link>
            <Link to="/register">
              <Button variant="secondary">{t("siteHeader.createAccount")}</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-8 rounded-[8px] bg-[var(--color-surface-soft)] p-4 text-sm text-slate-600">
            {acceptMutation.isPending ? t("invite.joiningOrganization") : t("invite.finishingAcceptance")}
          </div>
        )}
      </Card>
    </div>
  );
}
