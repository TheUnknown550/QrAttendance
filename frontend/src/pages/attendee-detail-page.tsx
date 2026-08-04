import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { BrandBadge } from "../components/brand/brand-badge";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { api, getErrorMessage, unwrapResponse } from "../lib/api";
import { formatDate, resolveMediaUrl } from "../lib/utils";
import type { Attendee, AttendeeDetail } from "../types/api";

const updateAttendeeSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  phone: z.string().optional(),
  attendeeNumber: z
    .string()
    .optional()
    .refine((value) => !value || /^\d+$/.test(value.trim()), {
      message: "Attendee number must be a whole number",
    }),
});

type UpdateAttendeeValues = z.infer<typeof updateAttendeeSchema>;

export function AttendeeDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageInputKey, setImageInputKey] = useState(0);
  const [removeProfileImage, setRemoveProfileImage] = useState(false);
  const attendeeQuery = useQuery({
    queryKey: ["attendee", id],
    queryFn: async () => unwrapResponse<AttendeeDetail>(await api.get(`/attendees/${id}`)),
  });

  const attendee = attendeeQuery.data;

  const {
    register,
    handleSubmit,
    reset,
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
      name: attendee.name,
      email: attendee.email,
      phone: attendee.phone ?? "",
      attendeeNumber: attendee.attendeeNumber != null ? String(attendee.attendeeNumber) : "",
    });
    setProfileImageFile(null);
    setImagePreviewUrl("");
    setImageInputKey((value) => value + 1);
    setRemoveProfileImage(false);
  }, [attendee, reset]);

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
            formData.append("name", values.name);
            formData.append("email", values.email);
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
    return <Card>Loading attendee profile...</Card>;
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
              alt={attendee.name}
              className="size-24 rounded-[8px] object-cover ring-1 ring-[var(--color-border)]"
              src={currentImageSrc}
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">Attendee</p>
              <h1 className="mt-2 break-words font-display text-3xl font-semibold text-slate-900">{attendee.name}</h1>
              <p className="mt-2 break-words text-sm text-slate-500">{attendee.email}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {attendee.attendeeNumber != null ? <Badge>#{attendee.attendeeNumber}</Badge> : null}
                <Badge>{attendee.phone ?? "No phone"}</Badge>
                <Badge>Created {formatDate(attendee.createdAt)}</Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-slate-900">QR code</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Check-in token</h2>
            </div>

            {qrCodeDataUrl ? (
              <a
                className="rounded-[8px] bg-[var(--color-surface-soft)] px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-white"
                download={`${attendee.name.replace(/\s+/g, "-").toLowerCase()}-qr.png`}
                href={qrCodeDataUrl}
              >
                Download QR
              </a>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col items-start gap-4 md:flex-row">
            <div className="rounded-[8px] bg-slate-50 p-4">
              {qrCodeDataUrl ? <img alt={`${attendee.name} QR`} className="size-64" src={qrCodeDataUrl} /> : null}
            </div>
            <div className="flex-1 rounded-[8px] bg-[var(--color-surface-soft)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Raw token</p>
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
          <p className="text-sm font-semibold text-slate-900">Edit attendee</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Profile</h2>

          <form
            className="mt-6 space-y-4"
            onSubmit={handleSubmit((values) => updateMutation.mutate(values))}
          >
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Full name</span>
              <Input {...register("name")} />
              {errors.name ? <p className="mt-2 text-xs text-rose-500">{errors.name.message}</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Email</span>
              <Input {...register("email")} />
              {errors.email ? <p className="mt-2 text-xs text-rose-500">{errors.email.message}</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Phone</span>
              <Input {...register("phone")} />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Attendee number</span>
              <Input
                inputMode="numeric"
                placeholder="Optional, e.g. 1"
                type="number"
                min={0}
                {...register("attendeeNumber")}
              />
              {errors.attendeeNumber ? (
                <p className="mt-2 text-xs text-rose-500">{errors.attendeeNumber.message}</p>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Photo</span>
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
                <p className="mt-2 text-xs text-slate-500">Selected: {profileImageFile.name}</p>
              ) : null}
            </label>

            {attendee.profileImageUrl && !profileImageFile ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] bg-[var(--color-surface-soft)] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">Current photo</p>
                  <p className="text-xs text-slate-500">
                    {removeProfileImage ? "Photo will be removed on save." : "Photo will stay unchanged."}
                  </p>
                </div>
                <Button
                  onClick={() => setRemoveProfileImage((value) => !value)}
                  type="button"
                  variant={removeProfileImage ? "secondary" : "ghost"}
                >
                  {removeProfileImage ? "Keep photo" : "Remove photo"}
                </Button>
              </div>
            ) : null}

            {updateMutation.isError ? (
              <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {getErrorMessage(updateMutation.error)}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit">{updateMutation.isPending ? "Saving..." : "Save changes"}</Button>
              <Button onClick={() => deleteMutation.mutate()} type="button" variant="danger">
                {deleteMutation.isPending ? "Deleting..." : "Delete attendee"}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-slate-900">Attendance history</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{attendee.attendance.length} check-ins</h2>

          <div className="mt-6 space-y-3">
            {attendee.attendance.map((record) => (
              <div key={record.id} className="rounded-[8px] bg-[var(--color-surface-soft)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="break-words font-medium text-slate-900">{record.eventSession.title}</p>
                    <p className="mt-1 break-words text-sm text-slate-500">{record.eventSession.eventSeries.name}</p>
                  </div>
                  <p className="text-sm text-slate-600">{formatDate(record.checkedInAt)}</p>
                </div>
              </div>
            ))}

            {attendee.attendance.length === 0 ? (
              <p className="rounded-[8px] bg-[var(--color-surface-soft)] p-4 text-sm text-slate-500">
                No attendance records yet.
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
