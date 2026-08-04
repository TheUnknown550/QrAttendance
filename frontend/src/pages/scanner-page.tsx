import { useMutation, useQuery } from "@tanstack/react-query";
import { Scanner } from "@yudiel/react-qr-scanner";
import {
  Camera,
  CircleCheckBig,
  Copy,
  OctagonAlert,
  ScanLine,
  Share2,
  Sheet,
  Smartphone,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BrandBadge } from "../components/brand/brand-badge";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { api, getErrorMessage, unwrapResponse } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatDate, resolveMediaUrl } from "../lib/utils";
import type { EventSeries, PublicScannerSession, ScanResult, ScannerShareLink } from "../types/api";

type CheckInPayload = {
  qrToken: string;
  eventSessionId: string;
};

export function ScannerPage() {
  const { token } = useParams();
  const { auth } = useAuth();
  const isPublicScanner = Boolean(token);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [scannerError, setScannerError] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [shareFeedback, setShareFeedback] = useState("");
  const recentTokenRef = useRef("");
  const resumeTimeoutRef = useRef<number | null>(null);
  const shareFeedbackTimeoutRef = useRef<number | null>(null);
  const recentTokenTimeoutRef = useRef<number | null>(null);
  const [paused, setPaused] = useState(false);

  const seriesQuery = useQuery({
    queryKey: ["event-series", auth?.activeOrganizationId],
    queryFn: async () => unwrapResponse<EventSeries[]>(await api.get("/event-series")),
    enabled: !isPublicScanner,
  });

  const publicSessionQuery = useQuery({
    queryKey: ["public-scanner-session", token],
    queryFn: async () =>
      unwrapResponse<PublicScannerSession>(await api.get(`/public/scan/${token}`)),
    enabled: isPublicScanner && Boolean(token),
  });

  const sessionOptions = useMemo(
    () =>
      (seriesQuery.data ?? []).flatMap((series) =>
        series.sessions.map((session) => ({
          id: session.id,
          label: `${series.name} - ${session.title}`,
          seriesId: series.id,
          seriesName: series.name,
          title: session.title,
          sessionDate: session.sessionDate,
        })),
      ),
    [seriesQuery.data],
  );

  const selectedSession = sessionOptions.find((session) => session.id === selectedSessionId);
  const publicSession = publicSessionQuery.data?.session;
  const currentSessionId = isPublicScanner ? publicSession?.id ?? "" : selectedSessionId;
  const currentSeriesId = isPublicScanner ? publicSession?.eventSeries.id : selectedSession?.seriesId;
  const currentSeriesName = isPublicScanner ? publicSession?.eventSeries.name : selectedSession?.seriesName;
  const currentSessionTitle = isPublicScanner ? publicSession?.title : selectedSession?.title;

  useEffect(() => {
    if (!isPublicScanner && !selectedSessionId && sessionOptions[0]) {
      setSelectedSessionId(sessionOptions[0].id);
    }
  }, [isPublicScanner, selectedSessionId, sessionOptions]);

  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) {
        window.clearTimeout(resumeTimeoutRef.current);
      }

      if (shareFeedbackTimeoutRef.current) {
        window.clearTimeout(shareFeedbackTimeoutRef.current);
      }
      if (recentTokenTimeoutRef.current) {
        window.clearTimeout(recentTokenTimeoutRef.current);
      }
    };
  }, []);

  const shareLinkQuery = useQuery({
    queryKey: ["scanner-share-link", auth?.activeOrganizationId, selectedSessionId],
    queryFn: async () =>
      unwrapResponse<ScannerShareLink>(
        await api.get(`/scan/sessions/${selectedSessionId}/share-link`),
      ),
    enabled: !isPublicScanner && Boolean(selectedSessionId),
  });

  const shareUrl = shareLinkQuery.data
    ? new URL(shareLinkQuery.data.path, window.location.origin).toString()
    : "";

  const checkInMutation = useMutation({
    mutationFn: async (payload: CheckInPayload | { qrToken: string }) =>
      isPublicScanner
        ? unwrapResponse<ScanResult>(await api.post(`/public/scan/${token}/check-in`, payload))
        : unwrapResponse<ScanResult>(await api.post("/scan/check-in", payload)),
    onSuccess: (result) => {
      setLastResult(result);
      setPaused(true);
      if (resumeTimeoutRef.current) {
        window.clearTimeout(resumeTimeoutRef.current);
      }
      resumeTimeoutRef.current = window.setTimeout(() => setPaused(false), 2200);
    },
  });

  function submitToken(qrToken: string) {
    if (!currentSessionId || checkInMutation.isPending || !qrToken) {
      return;
    }

    if (recentTokenRef.current === qrToken) {
      return;
    }

    recentTokenRef.current = qrToken;
    setScannerError("");
    checkInMutation.mutate(isPublicScanner ? { qrToken } : { qrToken, eventSessionId: currentSessionId }, {
      onSettled: () => {
        if (recentTokenTimeoutRef.current) window.clearTimeout(recentTokenTimeoutRef.current);
        recentTokenTimeoutRef.current = window.setTimeout(() => {
          recentTokenRef.current = "";
        }, 1800);
      },
    });
  }

  function pushShareFeedback(message: string) {
    setShareFeedback(message);
    if (shareFeedbackTimeoutRef.current) {
      window.clearTimeout(shareFeedbackTimeoutRef.current);
    }
    shareFeedbackTimeoutRef.current = window.setTimeout(() => setShareFeedback(""), 2200);
  }

  async function copyShareUrl() {
    if (!shareUrl) {
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    pushShareFeedback("Link copied");
  }

  async function shareScannerUrl() {
    if (!shareUrl) {
      return;
    }

    if (navigator.share) {
      await navigator.share({
        title: `EventQR scanner for ${currentSessionTitle ?? "session"}`,
        text: `${currentSeriesName ?? "Event session"} scanner`,
        url: shareUrl,
      });
      pushShareFeedback("Share ready");
      return;
    }

    await copyShareUrl();
  }

  if (isPublicScanner && publicSessionQuery.isLoading) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card>
          <p className="text-sm text-slate-500">Loading scanner...</p>
        </Card>
      </div>
    );
  }

  if (isPublicScanner && publicSessionQuery.isError) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card>
          <p className="text-lg font-semibold text-slate-900">Scanner link unavailable</p>
          <p className="mt-2 text-sm text-slate-500">{getErrorMessage(publicSessionQuery.error)}</p>
        </Card>
      </div>
    );
  }

  if (isPublicScanner) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        {currentSessionId ? (
          <Scanner
            allowMultiple={false}
            classNames={{
              container: "h-full w-full",
              video: "h-full w-full object-cover",
            }}
            constraints={{ facingMode: "environment" }}
            onError={(error) => setScannerError(error.message)}
            onScan={(detectedCodes) => {
              const code = detectedCodes[0]?.rawValue;
              if (code) submitToken(code);
            }}
            paused={paused}
            sound={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-white/60">
              <Camera className="mx-auto size-12" />
              <p className="mt-3 text-sm">Scanner unavailable.</p>
            </div>
          </div>
        )}

        {/* Top session info bar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent px-5 pb-10 pt-6">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Active session</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {currentSessionTitle && currentSeriesName
              ? `${currentSeriesName} — ${currentSessionTitle}`
              : "No session selected"}
          </p>
        </div>

        {/* Scan frame */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="size-64 rounded-2xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
        </div>

        {/* Result bottom sheet */}
        {lastResult ? (
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white px-6 pb-10 pt-5 shadow-2xl">
            <button
              className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              onClick={() => setLastResult(null)}
              type="button"
            >
              ✕
            </button>
            <div className="mb-4 flex items-center gap-3">
              <div
                className={
                  lastResult.status === "success"
                    ? "rounded-lg bg-emerald-50 p-2 text-emerald-700"
                    : "rounded-lg bg-amber-50 p-2 text-amber-700"
                }
              >
                {lastResult.status === "success" ? (
                  <CircleCheckBig className="size-5" />
                ) : (
                  <OctagonAlert className="size-5" />
                )}
              </div>
              <p className="text-base font-semibold capitalize text-slate-900">
                {lastResult.status.replaceAll("_", " ")}
              </p>
            </div>

            {lastResult.attendee ? (
              lastResult.attendee.profileImageUrl ? (
                <div className="flex flex-col gap-3">
                  <img
                    alt={lastResult.attendee.name}
                    className="h-52 w-full rounded-xl object-cover object-top ring-1 ring-slate-200"
                    src={resolveMediaUrl(lastResult.attendee.profileImageUrl)!}
                  />
                  <div className="min-w-0">
                    <p className="break-words text-xl font-semibold text-slate-900">{lastResult.attendee.name}</p>
                    <p className="mt-1 break-words text-sm text-slate-500">{lastResult.attendee.email ?? "No email"}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl font-semibold text-slate-600">
                    {lastResult.attendee.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="break-words text-xl font-semibold text-slate-900">{lastResult.attendee.name}</p>
                    <p className="mt-1 break-words text-sm text-slate-500">{lastResult.attendee.email ?? "No email"}</p>
                  </div>
                </div>
              )
            ) : null}
          </div>
        ) : null}

        {scannerError ? (
          <div className="absolute inset-x-4 bottom-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {scannerError}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-slate-900">Scanner</p>
            <h1 className="mt-2 break-words font-display text-4xl font-semibold text-slate-900">
              Live check-in
            </h1>
          </div>
          <Badge>{sessionOptions.length} available sessions</Badge>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">Target session</span>
            <Select onChange={(event) => setSelectedSessionId(event.target.value)} value={selectedSessionId}>
              <option value="">Select a session</option>
              {sessionOptions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.label}
                </option>
              ))}
            </Select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">Manual token</span>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input onChange={(event) => setManualToken(event.target.value)} value={manualToken} />
              <Button className="shrink-0 sm:w-auto" onClick={() => submitToken(manualToken)} type="button" variant="secondary">
                Submit
              </Button>
            </div>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[8px] bg-[var(--color-surface-soft)] px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Current target</p>
            <p className="mt-1 break-words text-sm font-semibold text-slate-900">
              {currentSessionTitle && currentSeriesName
                ? `${currentSeriesName} - ${currentSessionTitle}`
                : "No session selected"}
            </p>
            {selectedSession?.sessionDate ? (
              <p className="mt-1 text-xs text-slate-500">{formatDate(selectedSession.sessionDate)}</p>
            ) : null}
          </div>
          {currentSeriesId ? (
            <Link to={`/app/reports/event-series/${currentSeriesId}`}>
              <Button icon={<Sheet className="size-4" />} variant="ghost">
                Open report
              </Button>
            </Link>
          ) : null}
        </div>

        {selectedSessionId ? (
          <div className="mt-4 rounded-[8px] bg-[var(--color-surface-soft)] px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">Phone scanner</p>
                <p className="mt-1 break-all text-xs text-slate-500">{shareUrl || "Preparing link..."}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={!shareUrl || shareLinkQuery.isLoading}
                  icon={<Copy className="size-4" />}
                  onClick={() => void copyShareUrl()}
                  type="button"
                  variant="secondary"
                >
                  Copy URL
                </Button>
                <Button
                  disabled={!shareUrl || shareLinkQuery.isLoading}
                  icon={<Share2 className="size-4" />}
                  onClick={() => void shareScannerUrl()}
                  type="button"
                >
                  Share
                </Button>
              </div>
            </div>
            {shareFeedback ? <p className="mt-3 text-xs font-medium text-emerald-700">{shareFeedback}</p> : null}
          </div>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-[10px] bg-[var(--color-surface-soft)] p-3">
          <div className="aspect-video overflow-hidden rounded-[8px] bg-slate-900">
            {currentSessionId ? (
              <Scanner
                allowMultiple={false}
                classNames={{
                  container: "h-full w-full",
                  video: "h-full w-full object-cover",
                }}
                constraints={{ facingMode: "environment" }}
                onError={(error) => setScannerError(error.message)}
                onScan={(detectedCodes) => {
                  const code = detectedCodes[0]?.rawValue;
                  if (code) submitToken(code);
                }}
                paused={paused}
                sound={false}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-slate-400">
                  <Camera className="mx-auto size-10" />
                  <p className="mt-4 text-sm">Choose a session first.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {scannerError ? (
          <p className="mt-4 rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {scannerError}
          </p>
        ) : null}

        <div className="mt-6 rounded-[8px] bg-[var(--color-surface-soft)] px-4 py-4">
          <BrandBadge compact />
        </div>
      </Card>

      <div className="space-y-6">
        <Card>
          <p className="text-sm font-semibold text-slate-900">Latest scan</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Result</h2>

          {lastResult ? (
            <div className="mt-6 rounded-[8px] bg-[var(--color-surface-soft)] p-5">
              <div className="flex items-start gap-4">
                <div
                  className={
                    lastResult.status === "success"
                      ? "rounded-[8px] bg-emerald-50 p-3 text-emerald-700"
                      : "rounded-[8px] bg-amber-50 p-3 text-amber-700"
                  }
                >
                  {lastResult.status === "success" ? (
                    <CircleCheckBig className="size-6" />
                  ) : (
                    <OctagonAlert className="size-6" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold capitalize text-slate-900">
                    {lastResult.status.replaceAll("_", " ")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {lastResult.checkedInAt ? formatDate(lastResult.checkedInAt) : "No timestamp available"}
                  </p>
                </div>
              </div>

              {lastResult.attendee ? (
                <div className="mt-6 flex flex-col gap-3 rounded-[8px] bg-white p-4">
                  {lastResult.attendee.profileImageUrl ? (
                    <img
                      alt={lastResult.attendee.name}
                      className="h-56 w-full rounded-[8px] object-cover object-top ring-1 ring-[var(--color-border)]"
                      src={resolveMediaUrl(lastResult.attendee.profileImageUrl)!}
                    />
                  ) : (
                    <div className="flex size-12 items-center justify-center rounded-[8px] bg-slate-100 text-lg font-semibold text-slate-600">
                      {lastResult.attendee.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-slate-900">{lastResult.attendee.name}</p>
                    <p className="break-words text-sm text-slate-500">{lastResult.attendee.email ?? "No email"}</p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-6 rounded-[8px] bg-[var(--color-surface-soft)] p-5 text-sm text-slate-500">
              Scan a QR code.
            </div>
          )}

          {checkInMutation.isError ? (
            <p className="mt-4 rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getErrorMessage(checkInMutation.error)}
            </p>
          ) : null}
        </Card>

        <Card>
          <p className="text-sm font-semibold text-slate-900">Flow</p>
          <div className="mt-5 space-y-3">
            {[
              { title: "Pick session", icon: ScanLine },
              { title: "Share to phone", icon: Smartphone },
              { title: "Scan or paste", icon: Camera },
            ].map((item) => (
              <div key={item.title} className="flex gap-3 rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                <div className="rounded-[6px] bg-amber-50 p-2 text-amber-700">
                  <item.icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-slate-900">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
