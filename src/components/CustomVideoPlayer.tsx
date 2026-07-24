"use client";

import { useRef, useState, useCallback } from "react";

interface Props {
  src: string;
  autoPlay?: boolean;
  fill?: boolean;
  hideControls?: boolean;
  muted?: boolean;
}

export default function CustomVideoPlayer({ src, autoPlay = true, fill = false, muted = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [aspectRatio, setAspectRatio] = useState<{ w: number; h: number } | null>(null);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setAspectRatio({ w: video.videoWidth, h: video.videoHeight });
  }, []);

  return (
    <div
      className={`group relative w-full overflow-hidden ${fill ? "h-full bg-black" : "rounded-lg bg-black"}`}
      style={fill ? undefined : { aspectRatio: aspectRatio ? `${aspectRatio.w}/${aspectRatio.h}` : "9/16" }}
    >
      {!fill && !aspectRatio && (
        <div className="absolute inset-0 z-10 bg-zinc-900 animate-pulse" />
      )}

      <video
        ref={videoRef}
        className={`h-full w-full ${fill ? "object-cover" : "object-contain"}`}
        src={src}
        loop
        playsInline
        muted={muted}
        onLoadedMetadata={handleLoadedMetadata}
      />
    </div>
  );
}
