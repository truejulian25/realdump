"use client";

import { useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Props {
  src: string;
}

export default function ProfileVideoCard({ src }: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = useCallback(() => {
    videoRef.current?.play();
  }, []);

  const handleMouseLeave = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }, []);

  const handleClick = useCallback(() => {
    router.push("/publicaciones");
  }, [router]);

  return (
    <div
      className="group relative aspect-square cursor-pointer overflow-hidden bg-zinc-800"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <video
        ref={videoRef}
        src={src}
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
