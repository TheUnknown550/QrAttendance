import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { CircleCheck, Download, Lock } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useParams } from "react-router-dom";
import { FormCard, FormHeader, FormRenderer, FormThemeFrame, type FormAnswers } from "../components/forms/form-renderer";
import { primaryButtonClass } from "../components/forms/form-theme";
import { Seo } from "../components/seo/seo";
import { LanguageToggle } from "../components/ui/language-toggle";
import { api, getErrorMessage, unwrapResponse } from "../lib/api";
import type { FormSubmitResult, PublicForm } from "../types/api";

function SuccessCard({ result }: { result: FormSubmitResult }) {
  const { t } = useTranslation();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!result.qrToken) return;
    void QRCode.toDataURL(result.qrToken, { width: 480, margin: 1 }).then(setQrDataUrl);
  }, [result.qrToken]);

  return (
    <FormCard accentTop className="text-center">
      <CircleCheck className="mx-auto size-12 text-[var(--form-accent)]" />
      <h2 className="mt-4 text-2xl font-semibold">
        {t("forms.public.thanks", { name: `${result.firstName} ${result.surname}` })}
      </h2>
      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[var(--form-muted)]">
        {result.confirmationMessage || t("forms.public.defaultConfirmation")}
      </p>

      {qrDataUrl ? (
        <div className="mt-6">
          <p className="text-sm font-medium">{t("forms.public.yourQr")}</p>
          <img alt="QR code" className="mx-auto mt-3 size-56 rounded-[var(--form-control-radius)] bg-white p-2" src={qrDataUrl} />
          <a
            className={`mt-4 ${primaryButtonClass}`}
            download={`qr-${result.firstName}-${result.surname}.png`}
            href={qrDataUrl}
          >
            <Download className="size-4" />
            {t("forms.public.downloadQr")}
          </a>
        </div>
      ) : null}

      {result.emailSent ? <p className="mt-5 text-sm text-[var(--form-muted)]">{t("forms.public.emailSent")}</p> : null}
      {result.matchedExisting && !result.emailSent ? (
        <p className="mt-5 text-sm text-[var(--form-muted)]">{t("forms.public.alreadyRegistered")}</p>
      ) : null}
    </FormCard>
  );
}

export function PublicFormPage() {
  const { token } = useParams();
  const location = useLocation();
  const { t } = useTranslation();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<FormSubmitResult | null>(null);

  const formQuery = useQuery({
    queryKey: ["public-form", token],
    enabled: Boolean(token),
    retry: false,
    queryFn: async () => unwrapResponse<PublicForm>(await api.get(`/public/forms/${token}`)),
  });

  const submitMutation = useMutation({
    mutationFn: async (answers: FormAnswers) =>
      unwrapResponse<FormSubmitResult>(await api.post(`/public/forms/${token}/submit`, { answers })),
    onMutate: () => setServerErrors({}),
    onSuccess: (data) => {
      setResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const fieldErrors = error.response?.data?.details?.fieldErrors;
        if (fieldErrors && typeof fieldErrors === "object") setServerErrors(fieldErrors as Record<string, string>);
      }
    },
  });

  const form = formQuery.data;

  return (
    <div className="min-h-screen">
      <Seo noindex pathname={location.pathname} title={form?.title ?? t("forms.public.pageTitle")} />
      <div className="fixed right-3 top-3 z-50">
        <LanguageToggle />
      </div>

      {formQuery.isLoading ? (
        <FormThemeFrame className="min-h-screen" theme={null}>
          <FormCard>
            <p className="text-sm text-[var(--form-muted)]">{t("common.loading")}</p>
          </FormCard>
        </FormThemeFrame>
      ) : !form ? (
        <FormThemeFrame className="min-h-screen" theme={null}>
          <FormCard accentTop>
            <h1 className="text-xl font-semibold">{t("forms.public.notFoundTitle")}</h1>
            <p className="mt-2 text-sm text-[var(--form-muted)]">{t("forms.public.notFoundBody")}</p>
          </FormCard>
        </FormThemeFrame>
      ) : result ? (
        <FormThemeFrame className="min-h-screen" theme={form.theme}>
          <FormHeader form={{ ...form, items: [] }} />
          <SuccessCard result={result} />
        </FormThemeFrame>
      ) : form.isClosed ? (
        <FormThemeFrame className="min-h-screen" theme={form.theme}>
          <FormHeader form={{ ...form, items: [] }} />
          <FormCard className="text-center">
            <Lock className="mx-auto size-10 text-[var(--form-faint)]" />
            <p className="mt-3 text-lg font-semibold">{t("forms.public.closedTitle")}</p>
            <p className="mt-1 text-sm text-[var(--form-muted)]">{t("forms.public.closedBody")}</p>
          </FormCard>
        </FormThemeFrame>
      ) : (
        <FormRenderer
          className="min-h-screen"
          footer={<p className="pt-4 text-center text-xs text-[var(--form-faint)]">{t("forms.public.poweredBy")}</p>}
          form={form}
          onSubmit={(answers) => submitMutation.mutate(answers)}
          serverErrors={serverErrors}
          submitError={submitMutation.isError ? getErrorMessage(submitMutation.error) : null}
          submitting={submitMutation.isPending}
        />
      )}
    </div>
  );
}
