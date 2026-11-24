import { CircleCheckBig, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";

export function PhotoCaptureOverlay({
  onConfirm,
  onCancel,
  isSubmitting,
  submitError,
}: {
  onConfirm: (photo: Blob) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitError: string;
}) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<{ blob: Blob; previewUrl: string } | null>(null);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    if (capturedPhoto) {
      return;
    }

    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setCameraError(t("scanner.photoCapture.cameraError"));
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [capturedPhoto, t]);

  useEffect(() => {
    return () => {
      if (capturedPhoto) {
        URL.revokeObjectURL(capturedPhoto.previewUrl);
      }
    };
  }, [capturedPhoto]);

  function handleCapture() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedPhoto({ blob, previewUrl: URL.createObjectURL(blob) });
        }
      },
      "image/jpeg",
      0.9,
    );

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function handleRetake() {
    if (capturedPhoto) {
      URL.revokeObjectURL(capturedPhoto.previewUrl);
    }
    setCapturedPhoto(null);
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black">
      <div className="flex items-center justify-between px-5 pb-4 pt-6">
        <p className="text-sm font-semibold text-white">{t("scanner.photoCapture.title")}</p>
        <button
          className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white"
          onClick={onCancel}
          type="button"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {capturedPhoto ? (
          <img alt={t("scanner.photoCapture.capturedAlt")} className="h-full w-full object-cover" src={capturedPhoto.previewUrl} />
        ) : (
          <video autoPlay className="h-full w-full object-cover" muted playsInline ref={videoRef} />
        )}

        {cameraError ? (
          <div className="absolute inset-x-4 top-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {cameraError}
          </div>
        ) : null}
      </div>

      {submitError ? (
        <p className="mx-5 mb-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</p>
      ) : null}

      <div className="flex items-center justify-center gap-4 px-6 py-8">
        {capturedPhoto ? (
          <>
            <Button
              disabled={isSubmitting}
              icon={<X className="size-4" />}
              onClick={handleRetake}
              type="button"
              variant="secondary"
            >
              {t("scanner.photoCapture.retake")}
            </Button>
            <Button
              disabled={isSubmitting}
              icon={<CircleCheckBig className="size-4" />}
              onClick={() => onConfirm(capturedPhoto.blob)}
              type="button"
            >
              {isSubmitting ? t("scanner.photoCapture.confirming") : t("scanner.photoCapture.confirmCheckIn")}
            </Button>
          </>
        ) : (
          <button
            aria-label={t("scanner.photoCapture.takePhoto")}
            className="flex size-16 items-center justify-center rounded-full border-4 border-white bg-white/20"
            onClick={handleCapture}
            type="button"
          >
            <span className="size-12 rounded-full bg-white" />
          </button>
        )}
      </div>
    </div>
  );
}
