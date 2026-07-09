"use client";

import { useRef, useCallback } from "react";
import type { Video } from "@/types";

interface Props {
  video: Video;
  onClick?: (video: Video) => void;
}

export default function ProfileVideoCard({ video, onClick }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = useCallback(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  const handleMouseLeave = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.pause();
    videoEl.currentTime = 0;
  }, []);

  const handleClick = useCallback(() => {
    onClick?.(video);
  }, [onClick, video]);

  return (
    <div
      className="group relative aspect-square cursor-pointer overflow-hidden bg-zinc-800"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <video
        ref={videoRef}
        src={video.video_url}
        muted
        playsInline
        preload="auto"
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      </div>
    </div>
  );
}
