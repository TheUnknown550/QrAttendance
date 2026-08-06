import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import type { z } from "zod";
import { CircleCheckBig, CircleX, Mail } from "lucide-react";
import { AttendeeTypeSelect } from "../components/attendees/attendee-type-select";
import { SendQrEmailsModal } from "../components/attendees/send-qr-emails-modal";
import { BrandBadge } from "../components/brand/brand-badge";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { api, getErrorMessage, unwrapResponse } from "../lib/api";
import { useAttendeeFormSchema } from "../lib/attendee-schema";
import { useAuth } from "../lib/auth";
import { cn, formatDate, resolveMediaUrl } from "../lib/utils";
import type { Attendee, AttendeeDetail, EventSeries, OrganizationDetail } from "../types/api";

export function AttendeeDetailPage() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { auth } = useAuth();

  const organizationQuery = useQuery({
    queryKey: ["organization-current"],
    queryFn: async () => unwrapResponse<OrganizationDetail>(await api.get("/organizations/current")),
  });
  const organization = organizationQuery.data;

  const updateAttendeeSchema = useAttendeeFormSchema(organization);
  type UpdateAttendeeValues = z.infer<typeof updateAttendeeSchema>;
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageInputKey, setImageInputKey] = useState(0);
  const [removeProfileImage, setRemoveProfileImage] = useState(false);
  const [sendQrEmailOpen, setSendQrEmailOpen] = useState(false);
  const [qrEmailToast, setQrEmailToast] = useState("");
  const attendeeQuery = useQuery({
    queryKey: ["attendee", id],
    queryFn: async () => unwrapResponse<AttendeeDetail>(await api.get(`/attendees/${id}`)),
  });

  const attendee = attendeeQuery.data;

  const seriesQuery = useQuery({
    queryKey: ["event-series", auth?.activeOrganizationId],
    queryFn: async () => unwrapResponse<EventSeries[]>(await api.get("/event-series")),
  });

  const allSessions = (seriesQuery.data ?? []).flatMap((series) =>
    series.sessions.map((session) => ({
      seriesId: series.id,
      seriesName: series.name,
      sessionId: session.id,
      title: session.title,
      sessionDate: session.sessionDate,
    })),
  );

  const attendanceBySessionId = new Map(
    (attendee?.attendance ?? []).map((record) => [record.eventSession.id, record]),
  );

  const markAttendedMutation = useMutation({
    mutationFn: async ({ seriesId, sessionId }: { seriesId: string; sessionId: string }) =>
      unwrapResponse(
        await api.post(`/event-series/${seriesId}/sessions/${sessionId}/attendance`, {
          attendeeId: id,
        }),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendee", id] });
    },
  });

  const markNotAttendedMutation = useMutation({
    mutationFn: async ({ seriesId, sessionId }: { seriesId: string; sessionId: string }) =>
      unwrapResponse(await api.delete(`/event-series/${seriesId}/sessions/${sessionId}/attendance/${id}`)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendee", id] });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<UpdateAttendeeValues>({
    resolver: zodResolver(updateAttendeeSchema),
  });

  useEffect(() => {
    if (!attendee?.qrToken) {
      return;
    }

    QRCode.toDataURL(attendee.qrToken, {
      width: 360,
      margin: 2,
      color: {
        dark: "#020617",
        light: "#f8fafc",
      },
    }).then(async (rawQrCodeUrl) => {
      const brandedQrCodeUrl = await createBrandedQrCode(rawQrCodeUrl);
      setQrCodeDataUrl(brandedQrCodeUrl);
    });
  }, [attendee?.qrToken]);

  useEffect(() => {
    if (!attendee) {
      return;
    }

    reset({
      firstName: attendee.firstName,
      surname: attendee.surname,
      organizationName: attendee.organizationName ?? "",
      attendeeType: attendee.attendeeType ?? "",
      email: attendee.email ?? "",
      phone: attendee.phone ?? "",
      attendeeNumber: attendee.attendeeNumber != null ? String(attendee.attendeeNumber) : "",
    });
    setProfileImageFile(null);
    setImagePreviewUrl("");
    setImageInputKey((value) => value + 1);
    setRemoveProfileImage(false);
  }, [attendee, reset]);

  useEffect(() => {
    if (!qrEmailToast) {
      return;
    }

    const timeout = window.setTimeout(() => setQrEmailToast(""), 4500);
    return () => window.clearTimeout(timeout);
  }, [qrEmailToast]);

  useEffect(() => {
    if (!profileImageFile) {
      setImagePreviewUrl("");
      return;
    }

    const preview = URL.createObjectURL(profileImageFile);
    setImagePreviewUrl(preview);
    setRemoveProfileImage(false);

    return () => URL.revokeObjectURL(preview);
  }, [profileImageFile]);

  const updateMutation = useMutation({
    mutationFn: async (values: UpdateAttendeeValues) =>
      unwrapResponse<Attendee>(
        await api.patch(
          `/attendees/${id}`,
          (() => {
            const formData = new FormData();
            formData.append("firstName", values.firstName);
            formData.append("surname", values.surname);
            if (values.organizationName) {
              formData.append("organizationName", values.organizationName);
            }
            if (values.attendeeType) {
              formData.append("attendeeType", values.attendeeType);
            }
            if (values.email) {
              formData.append("email", values.email);
            }
            if (values.phone) {
              formData.append("phone", values.phone);
            }
            // Always sent so an emptied field clears the stored number.
            formData.append("attendeeNumber", values.attendeeNumber?.trim() ?? "");
            if (profileImageFile) {
              formData.append("profileImage", profileImageFile);
            } else if (removeProfileImage) {
              formData.append("removeProfileImage", "true");
            }
            return formData;
          })(),
        ),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendee", id] });
      queryClient.invalidateQueries({ queryKey: ["attendees"] });
      queryClient.invalidateQueries({ queryKey: ["attendees-summary"] });
      setProfileImageFile(null);
      setImageInputKey((value) => value + 1);
      setRemoveProfileImage(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/attendees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendees"] });
      queryClient.invalidateQueries({ queryKey: ["attendees-summary"] });
      navigate("/app/attendees");
    },
  });

  if (!attendee) {
    return <Card>{t("attendeeDetail.loading")}</Card>;
  }

  const currentImageSrc =
    imagePreviewUrl ||
    (removeProfileImage ? null : resolveMediaUrl(attendee.profileImageUrl)) ||
    "https://placehold.co/160x160/f7f5f0/334155?text=QR";

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-6">
        <Card>
          <div className="flex flex-wrap items-start gap-4">
            <img
              alt={`${attendee.firstName} ${attendee.surname}`}
              className="size-24 rounded-[8px] object-cover ring-1 ring-[var(--color-border)]"
              src={currentImageSrc}
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">{t("attendeeDetail.attendee")}</p>
              <h1 className="mt-2 break-words font-display text-3xl font-semibold text-slate-900">
                {attendee.firstName} {attendee.surname}
              </h1>
              <p className="mt-2 break-words text-sm text-slate-500">{attendee.email ?? t("scanner.noEmail")}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {attendee.attendeeNumber != null ? <Badge>#{attendee.attendeeNumber}</Badge> : null}
                {attendee.organizationName ? <Badge>{attendee.organizationName}</Badge> : null}
                {attendee.attendeeType ? <Badge>{attendee.attendeeType}</Badge> : null}
                <Badge>{attendee.phone ?? t("session.noPhone")}</Badge>
                <Badge>{t("attendeeDetail.created", { date: formatDate(attendee.createdAt) })}</Badge>
              </div>

              <Button
                className="mt-5 w-full sm:w-auto"
                icon={<Mail className="size-4" />}
                onClick={() => setSendQrEmailOpen(true)}
                type="button"
              >
                {t("attendeeDetail.sendQrEmail")}
              </Button>

              {qrEmailToast ? (
                <div className="mt-4 rounded-[8px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {qrEmailToast}
                </div>
              ) : null}
            </div>
          </div>
        </Card>

        <SendQrEmailsModal
          attendeeIds={[attendee.id]}
          onClose={() => setSendQrEmailOpen(false)}
          onSent={() =>
            setQrEmailToast(
              t("attendeeDetail.qrEmailSendingToast", {
                name: `${attendee.firstName} ${attendee.surname}`,
              }),
            )
          }
          open={sendQrEmailOpen}
          recipientLabel={`${attendee.firstName} ${attendee.surname}`}
          totalAttendees={1}
        />

        <Card>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-slate-900">{t("attendeeDetail.qrCode")}</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">{t("attendeeDetail.checkInToken")}</h2>
            </div>

            {qrCodeDataUrl ? (
              <a
                className="rounded-[8px] bg-[var(--color-surface-soft)] px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-white"
                download={`${`${attendee.firstName}-${attendee.surname}`.replace(/\s+/g, "-").toLowerCase()}-qr.png`}
                href={qrCodeDataUrl}
              >
                {t("attendeeDetail.downloadQr")}
              </a>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col items-start gap-4 md:flex-row">
            <div className="rounded-[8px] bg-slate-50 p-4">
              {qrCodeDataUrl ? (
                <img alt={`${attendee.firstName} ${attendee.surname} QR`} className="size-64" src={qrCodeDataUrl} />
              ) : null}
            </div>
            <div className="flex-1 rounded-[8px] bg-[var(--color-surface-soft)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t("attendeeDetail.rawToken")}</p>
              <p className="mt-3 break-all font-mono text-sm leading-7 text-slate-700">{attendee.qrToken}</p>
              <div className="mt-6 border-t border-[var(--color-border)] pt-4">
                <BrandBadge compact />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <p className="text-sm font-semibold text-slate-900">{t("attendeeDetail.editAttendee")}</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{t("attendeeDetail.profile")}</h2>

          <form
            className="mt-6 space-y-4"
            onSubmit={handleSubmit((values) => updateMutation.mutate(values))}
          >
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">{t("attendees.name")}</span>
              <Input {...register("firstName")} />
              {errors.firstName ? <p className="mt-2 text-xs text-rose-500">{errors.firstName.message}</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">{t("attendees.surname")}</span>
              <Input {...register("surname")} />
              {errors.surname ? <p className="mt-2 text-xs text-rose-500">{errors.surname.message}</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">{t("attendees.organizationNameOptional")}</span>
              <Input {...register("organizationName")} />
              {errors.organizationName ? (
                <p className="mt-2 text-xs text-rose-500">{errors.organizationName.message}</p>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">{t("attendees.typeOfAttendeeOptional")}</span>
              <Controller
                control={control}
                name="attendeeType"
                render={({ field }) => (
                  <AttendeeTypeSelect onChange={field.onChange} value={field.value ?? ""} />
                )}
              />
              {errors.attendeeType ? (
                <p className="mt-2 text-xs text-rose-500">{errors.attendeeType.message}</p>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">
                {t("auth.login.email")}
                {organization && !organization.requireAttendeeEmail ? ` (${t("common.optional")})` : ""}
              </span>
              <Input {...register("email")} />
              {errors.email ? <p className="mt-2 text-xs text-rose-500">{errors.email.message}</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">
                {t("attendees.phone")}
                {organization && !organization.requireAttendeePhone ? ` (${t("common.optional")})` : ""}
              </span>
              <Input {...register("phone")} />
              {errors.phone ? <p className="mt-2 text-xs text-rose-500">{errors.phone.message}</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">
                {t("attendees.attendeeNumber")}
                {organization && !organization.requireAttendeeNumber ? ` (${t("common.optional")})` : ""}
              </span>
              <Input
                inputMode="numeric"
                placeholder={t("attendeeDetail.attendeeNumberPlaceholder")}
                type="number"
                min={0}
                {...register("attendeeNumber")}
              />
              {errors.attendeeNumber ? (
                <p className="mt-2 text-xs text-rose-500">{errors.attendeeNumber.message}</p>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">{t("attendees.photo")}</span>
              <Input
                key={imageInputKey}
                accept="image/*"
                onChange={(event) => {
                  setProfileImageFile(event.target.files?.[0] ?? null);
                  setRemoveProfileImage(false);
                }}
                type="file"
              />
              {profileImageFile ? (
                <p className="mt-2 text-xs text-slate-500">{t("attendees.selected", { name: profileImageFile.name })}</p>
              ) : null}
            </label>

            {attendee.profileImageUrl && !profileImageFile ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] bg-[var(--color-surface-soft)] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{t("attendeeDetail.currentPhoto")}</p>
                  <p className="text-xs text-slate-500">
                    {removeProfileImage
                      ? t("attendeeDetail.photoWillBeRemoved")
                      : t("attendeeDetail.photoWillStay")}
                  </p>
                </div>
                <Button
                  onClick={() => setRemoveProfileImage((value) => !value)}
                  type="button"
                  variant={removeProfileImage ? "secondary" : "ghost"}
                >
                  {removeProfileImage ? t("attendeeDetail.keepPhoto") : t("attendeeDetail.removePhoto")}
                </Button>
              </div>
            ) : null}

            {updateMutation.isError ? (
              <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {getErrorMessage(updateMutation.error)}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit">
                {updateMutation.isPending ? t("attendeeDetail.saving") : t("attendeeDetail.saveChanges")}
              </Button>
              <Button onClick={() => deleteMutation.mutate()} type="button" variant="danger">
                {deleteMutation.isPending ? t("attendeeDetail.deleting") : t("attendeeDetail.deleteAttendee")}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-slate-900">{t("attendeeDetail.attendanceHistory")}</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            {t("attendeeDetail.checkInsCount", { count: attendee.attendance.length })}
          </h2>
          <p className="mt-2 text-sm text-slate-500">{t("attendeeDetail.manageAttendanceHint")}</p>

          {(markAttendedMutation.isError || markNotAttendedMutation.isError) ? (
            <p className="mt-4 rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getErrorMessage(markAttendedMutation.error ?? markNotAttendedMutation.error)}
            </p>
          ) : null}

          <div className="mt-6 space-y-3">
            {allSessions.map((session) => {
              const record = attendanceBySessionId.get(session.sessionId);
              const isBusy =
                (markAttendedMutation.isPending &&
                  markAttendedMutation.variables?.sessionId === session.sessionId) ||
                (markNotAttendedMutation.isPending &&
                  markNotAttendedMutation.variables?.sessionId === session.sessionId);

              return (
                <div
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-3 rounded-[8px] border-l-4 p-4 transition",
                    record
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-300 bg-[var(--color-surface-soft)]",
                  )}
                  key={session.sessionId}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                        record ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500",
                      )}
                    >
                      {record ? <CircleCheckBig className="size-4" /> : <CircleX className="size-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="break-words font-medium text-slate-900">{session.title}</p>
                      <p className="mt-1 break-words text-sm text-slate-500">{session.seriesName}</p>
                      <span
                        className={cn(
                          "mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          record ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600",
                        )}
                      >
                        {record
                          ? t("attendeeDetail.checkedInAt", { date: formatDate(record.checkedInAt) })
                          : t("attendeeDetail.notAttended")}
                      </span>
                    </div>
                  </div>
                  <Button
                    disabled={isBusy}
                    icon={record ? undefined : <CircleCheckBig className="size-4" />}
                    onClick={() => {
                      const payload = { seriesId: session.seriesId, sessionId: session.sessionId };
                      if (record) {
                        markNotAttendedMutation.mutate(payload);
                        return;
                      }
                      markAttendedMutation.mutate(payload);
                    }}
                    type="button"
                    variant={record ? "ghost" : "secondary"}
                  >
                    {record ? t("session.markNotAttended") : t("session.markAttended")}
                  </Button>
                </div>
              );
            })}

            {allSessions.length === 0 ? (
              <p className="rounded-[8px] bg-[var(--color-surface-soft)] p-4 text-sm text-slate-500">
                {t("attendeeDetail.noAttendanceRecords")}
              </p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}

async function createBrandedQrCode(qrCodeUrl: string) {
  const qrImage = await loadImage(qrCodeUrl);
  const logoImage = await loadImage("/logo.png");
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    return qrCodeUrl;
  }

  canvas.width = 900;
  canvas.height = 1120;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "#e5ddd1";
  context.lineWidth = 4;
  roundRect(context, 24, 24, canvas.width - 48, canvas.height - 48, 40);
  context.stroke();

  const logoWidth = 280;
  const logoHeight = (logoImage.height / logoImage.width) * logoWidth;
  context.drawImage(logoImage, (canvas.width - logoWidth) / 2, 70, logoWidth, logoHeight);

  const qrSize = 540;
  context.drawImage(qrImage, (canvas.width - qrSize) / 2, 260, qrSize, qrSize);

  context.fillStyle = "#1f2937";
  context.font = "700 38px 'DM Sans', sans-serif";
  context.textAlign = "center";
  context.fillText("EventQR", canvas.width / 2, 870);

  context.fillStyle = "#6b7280";
  context.font = "500 28px 'DM Sans', sans-serif";
  context.fillText("Powered by Magitecx", canvas.width / 2, 920);

  return canvas.toDataURL("image/png");
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}
