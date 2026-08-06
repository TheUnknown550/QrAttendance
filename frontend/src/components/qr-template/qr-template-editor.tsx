import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, ImageIcon, Trash2 } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, getErrorMessage, unwrapResponse } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { resolveMediaUrl } from "../../lib/utils";
import type { QrTemplate } from "../../types/api";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";

const PREVIEW_WIDTH = 320;
const MIN_QR_SIZE = 40;

export function QrTemplateEditor() {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const previewRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    mode: "move" | "resize";
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    startSize: number;
  } | null>(null);

  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [backgroundPreviewUrl, setBackgroundPreviewUrl] = useState("");
  const [imageInputKey, setImageInputKey] = useState(0);
  const [box, setBox] = useState<{ x: number; y: number; size: number } | null>(null);
  const [sampleQrDataUrl, setSampleQrDataUrl] = useState("");

  const templateQuery = useQuery({
    queryKey: ["qr-template", auth?.activeOrganizationId],
    queryFn: async () => unwrapResponse<QrTemplate>(await api.get("/organizations/current/qr-template")),
  });

  const template = templateQuery.data;

  useEffect(() => {
    if (template && !box) {
      setBox({ x: template.qrX, y: template.qrY, size: template.qrSize });
    }
  }, [template, box]);

  useEffect(() => {
    QRCode.toDataURL("PREVIEW", { width: 480, margin: 1 }).then(setSampleQrDataUrl);
  }, []);

  useEffect(() => {
    if (!backgroundFile) {
      setBackgroundPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(backgroundFile);
    setBackgroundPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [backgroundFile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!box) {
        throw new Error("Template not loaded");
      }

      const formData = new FormData();
      formData.append("qrX", String(Math.round(box.x)));
      formData.append("qrY", String(Math.round(box.y)));
      formData.append("qrSize", String(Math.round(box.size)));
      if (backgroundFile) {
        formData.append("image", backgroundFile);
      }

      return unwrapResponse<QrTemplate>(await api.patch("/organizations/current/qr-template", formData));
    },
    onSuccess: (result) => {
      setBackgroundFile(null);
      setImageInputKey((value) => value + 1);
      setBox({ x: result.qrX, y: result.qrY, size: result.qrSize });
      queryClient.setQueryData(["qr-template", auth?.activeOrganizationId], result);
    },
  });

  const removeImageMutation = useMutation({
    mutationFn: async () => unwrapResponse<QrTemplate>(await api.delete("/organizations/current/qr-template/image")),
    onSuccess: (result) => {
      setBackgroundFile(null);
      setImageInputKey((value) => value + 1);
      setBox({ x: result.qrX, y: result.qrY, size: result.qrSize });
      queryClient.setQueryData(["qr-template", auth?.activeOrganizationId], result);
    },
  });

  if (!template || !box) {
    return (
      <Card>
        <p className="text-sm font-semibold text-slate-900">{t("qrTemplate.eyebrow")}</p>
        <p className="mt-2 text-sm text-slate-500">
          {templateQuery.isError ? getErrorMessage(templateQuery.error) : t("common.loading")}
        </p>
      </Card>
    );
  }

  const scale = PREVIEW_WIDTH / template.canvasWidth;
  const previewHeight = template.canvasHeight * scale;
  const currentBackgroundSrc = backgroundPreviewUrl || resolveMediaUrl(template.imageUrl);

  function clampBox(next: { x: number; y: number; size: number }) {
    const size = Math.min(
      Math.max(next.size, MIN_QR_SIZE),
      Math.min(template!.canvasWidth, template!.canvasHeight),
    );
    const x = Math.min(Math.max(next.x, 0), template!.canvasWidth - size);
    const y = Math.min(Math.max(next.y, 0), template!.canvasHeight - size);
    return { x, y, size };
  }

  function handlePointerMove(event: PointerEvent) {
    const drag = dragStateRef.current;
    if (!drag) {
      return;
    }

    const deltaX = (event.clientX - drag.startClientX) / scale;
    const deltaY = (event.clientY - drag.startClientY) / scale;

    if (drag.mode === "move") {
      setBox(clampBox({ x: drag.startX + deltaX, y: drag.startY + deltaY, size: drag.startSize }));
    } else {
      const delta = Math.max(deltaX, deltaY);
      setBox(clampBox({ x: drag.startX, y: drag.startY, size: drag.startSize + delta }));
    }
  }

  function handlePointerUp() {
    dragStateRef.current = null;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }

  function startDrag(mode: "move" | "resize", event: React.PointerEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragStateRef.current = {
      mode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: box!.x,
      startY: box!.y,
      startSize: box!.size,
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  function downloadGuideTemplate() {
    const canvas = document.createElement("canvas");
    canvas.width = template!.canvasWidth;
    canvas.height = template!.canvasHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = "#94a3b8";
    context.lineWidth = 1;
    for (let gridX = 0; gridX <= canvas.width; gridX += 50) {
      context.beginPath();
      context.moveTo(gridX, 0);
      context.lineTo(gridX, canvas.height);
      context.stroke();
    }
    for (let gridY = 0; gridY <= canvas.height; gridY += 50) {
      context.beginPath();
      context.moveTo(0, gridY);
      context.lineTo(canvas.width, gridY);
      context.stroke();
    }

    context.setLineDash([12, 8]);
    context.strokeStyle = "#d97706";
    context.lineWidth = 4;
    context.strokeRect(box!.x, box!.y, box!.size, box!.size);
    context.setLineDash([]);

    context.fillStyle = "rgba(217, 119, 6, 0.08)";
    context.fillRect(box!.x, box!.y, box!.size, box!.size);

    context.fillStyle = "#b45309";
    context.font = "600 24px sans-serif";
    context.textAlign = "center";
    context.fillText(
      t("qrTemplate.guideLabel", { size: Math.round(box!.size) }),
      box!.x + box!.size / 2,
      box!.y + box!.size / 2,
    );

    context.fillStyle = "#334155";
    context.font = "500 20px sans-serif";
    context.textAlign = "left";
    context.fillText(
      t("qrTemplate.guideCanvasSize", { width: canvas.width, height: canvas.height }),
      20,
      canvas.height - 20,
    );

    const link = document.createElement("a");
    link.download = "qr-template-guide.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <Card>
      <p className="text-sm font-semibold text-slate-900">{t("qrTemplate.eyebrow")}</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-900">{t("qrTemplate.title")}</h2>
      <p className="mt-2 text-sm text-slate-500">{t("qrTemplate.description")}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">{t("qrTemplate.backgroundImage")}</span>
            <Input
              accept="image/*"
              key={imageInputKey}
              onChange={(event) => setBackgroundFile(event.target.files?.[0] ?? null)}
              type="file"
            />
            <p className="mt-2 text-xs text-slate-500">
              {t("qrTemplate.backgroundImageHint", { width: template.canvasWidth, height: template.canvasHeight })}
            </p>
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-slate-600">{t("qrTemplate.qrX")}</span>
              <Input
                min={0}
                onChange={(event) => setBox(clampBox({ ...box, x: Number(event.target.value) || 0 }))}
                type="number"
                value={Math.round(box.x)}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-slate-600">{t("qrTemplate.qrY")}</span>
              <Input
                min={0}
                onChange={(event) => setBox(clampBox({ ...box, y: Number(event.target.value) || 0 }))}
                type="number"
                value={Math.round(box.y)}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-slate-600">{t("qrTemplate.qrSize")}</span>
              <Input
                min={MIN_QR_SIZE}
                onChange={(event) => setBox(clampBox({ ...box, size: Number(event.target.value) || MIN_QR_SIZE }))}
                type="number"
                value={Math.round(box.size)}
              />
            </label>
          </div>

          <p className="text-xs text-slate-500">{t("qrTemplate.dragHint")}</p>

          {(saveMutation.isError || removeImageMutation.isError) ? (
            <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getErrorMessage(saveMutation.error ?? removeImageMutation.error)}
            </p>
          ) : null}

          {saveMutation.isSuccess ? (
            <p className="rounded-[8px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {t("qrTemplate.saved")}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()} type="button">
              {saveMutation.isPending ? t("qrTemplate.saving") : t("common.save")}
            </Button>
            <Button
              icon={<Download className="size-4" />}
              onClick={downloadGuideTemplate}
              type="button"
              variant="secondary"
            >
              {t("qrTemplate.downloadGuide")}
            </Button>
            {template.imageUrl ? (
              <Button
                disabled={removeImageMutation.isPending}
                icon={<Trash2 className="size-4" />}
                onClick={() => removeImageMutation.mutate()}
                type="button"
                variant="danger"
              >
                {removeImageMutation.isPending ? t("qrTemplate.removing") : t("qrTemplate.removeImage")}
              </Button>
            ) : null}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            {t("qrTemplate.livePreview")}
          </p>
          <div
            className="relative select-none overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-slate-100"
            ref={previewRef}
            style={{ width: PREVIEW_WIDTH, height: previewHeight }}
          >
            {currentBackgroundSrc ? (
              <img
                alt=""
                className="pointer-events-none absolute inset-0 size-full object-cover"
                src={currentBackgroundSrc}
              />
            ) : (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-slate-400">
                <ImageIcon className="size-8" />
              </div>
            )}

            <div
              className="absolute cursor-move border-2 border-dashed border-amber-500 bg-amber-500/10"
              onPointerDown={(event) => startDrag("move", event)}
              style={{
                left: box.x * scale,
                top: box.y * scale,
                width: box.size * scale,
                height: box.size * scale,
              }}
            >
              {sampleQrDataUrl ? (
                <img alt="" className="size-full object-contain p-1" src={sampleQrDataUrl} />
              ) : null}
              <div
                className="absolute -bottom-1.5 -right-1.5 size-3 cursor-nwse-resize rounded-full border border-white bg-amber-600"
                onPointerDown={(event) => startDrag("resize", event)}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
