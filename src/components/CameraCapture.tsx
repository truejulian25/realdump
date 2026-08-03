"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CameraCaptureProps {
  preview: string | null;
  onCapture: (file: File) => void;
  onRetake: () => void;
  disabled?: boolean;
}

export default function CameraCapture({
  preview,
  onCapture,
  onRetake,
  disabled,
}: CameraCaptureProps) {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setStatus("loading");
    setErrorMsg(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(t("camera.notSecure"));
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "user" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStatus("ready");
    } catch (e) {
      stopStream();
      setStatus("error");
      setErrorMsg(
        e instanceof DOMException &&
          (e.name === "NotAllowedError" || e.name === "PermissionDeniedError")
          ? t("camera.denied")
          : e instanceof Error && e.message
            ? e.message
            : t("camera.error")
      );
    }
  }, [stopStream, t]);

  useEffect(() => {
    if (preview) {
      stopStream();
      setStatus("ready");
      return;
    }
    startCamera();
    return stopStream;
  }, [preview, startCamera, stopStream]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || disabled) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      onCapture(new File([blob], "selfie.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  };

  if (preview) {
    return (
      <div>
        <div className="flex h-48 w-full items-center justify-center overflow-hidden rounded-lg border-2 border-solid border-zinc-600 bg-zinc-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={t("camera.selfieAlt")} className="h-full w-full object-cover" />
        </div>
        <button
          type="button"
          onClick={onRetake}
          disabled={disabled}
          className="mt-3 w-full rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-600 disabled:opacity-50"
        >
          {t("camera.retakeSelfie")}
        </button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-48 w-full flex-col items-center justify-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-center">
        <p className="text-sm text-red-400">{errorMsg}</p>
        <button
          type="button"
          onClick={startCamera}
          disabled={disabled}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {t("camera.retry")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-48 w-full overflow-hidden rounded-lg border-2 border-solid border-zinc-600 bg-zinc-900">
        <video ref={videoRef} playsInline muted autoPlay className="h-full w-full object-cover" />
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80">
            <p className="text-sm text-zinc-400">{t("camera.requesting")}</p>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={capture}
        disabled={disabled || status !== "ready"}
        className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {t("camera.takePhoto")}
      </button>
    </div>
  );
}
