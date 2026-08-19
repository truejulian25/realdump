"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface Props {
  src: string;
  autoPlay?: boolean;
  fill?: boolean;
  hideControls?: boolean;
  muted?: boolean;
  poster?: string | null;
}

export default function CustomVideoPlayer({ src, autoPlay = true, fill = false, muted = false, poster }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [aspectRatio, setAspectRatio] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (!autoPlay) return;
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = videoRef.current;
          if (!video) return;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.7 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [autoPlay]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setAspectRatio({ w: video.videoWidth, h: video.videoHeight });
  }, []);

  return (
    <div
      ref={containerRef}
      className={`group relative w-full overflow-hidden ${fill ? "h-full bg-app-bg" : "rounded-lg bg-app-bg"}`}
      style={fill ? undefined : { aspectRatio: aspectRatio ? `${aspectRatio.w}/${aspectRatio.h}` : "9/16" }}
    >
      {!fill && !aspectRatio && (
        <div className="absolute inset-0 z-10 bg-zinc-200 animate-pulse" />
      )}

      <video
        ref={videoRef}
        className={`h-full w-full ${fill ? "object-cover" : "object-contain"}`}
        src={src}
        poster={poster ?? undefined}
        loop
        playsInline
        muted={muted}
        onLoadedMetadata={handleLoadedMetadata}
      />
    </div>
  );
}
