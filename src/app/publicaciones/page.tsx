"use client";

import { useEffect, useRef, useCallback } from "react";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";
import ProfileRow from "@/components/ProfileRow";
import InteractionBar from "@/components/InteractionBar";

const profileVideos = [
  {
    id: 1,
    src: "/videos/video1.mp4",
    username: "joan",
    description: "Mi primer tatuaje en time-lapse",
    hashtags: ["#tatuaje", "#timelapse", "#arte"],
    date: "2 de julio, 2026",
  },
  {
    id: 2,
    src: "/videos/video2.mp4",
    username: "joan",
    description: "Diseño personalizado para cliente",
    hashtags: ["#tattoo", "#blackwork"],
    date: "1 de julio, 2026",
  },
  {
    id: 3,
    src: "/videos/video3.mp4",
    username: "joan",
    description: "Proceso completo de la sesión",
    hashtags: ["#tatuajecolombiano", "#realismo"],
    date: "28 de junio, 2026",
  },
];

export default function PublicacionesPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentVideoRef = useRef<HTMLVideoElement | null>(null);

  const playVideo = useCallback((video: HTMLVideoElement) => {
    if (currentVideoRef.current && currentVideoRef.current !== video) {
      currentVideoRef.current.pause();
    }
    video.play().catch(() => {});
    currentVideoRef.current = video;
  }, []);

  // Video play/pause observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const videoElements = container.querySelectorAll<HTMLVideoElement>("video");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            playVideo(video);
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.7 }
    );

    videoElements.forEach((video) => observer.observe(video));

    return () => observer.disconnect();
  }, [playVideo]);

  return (
    <div
      ref={containerRef}
      className="h-screen w-full snap-y snap-mandatory overflow-y-scroll bg-black pt-14 pb-20"
    >
      {profileVideos.map((video) => (
        <div
          key={video.id}
          className="flex h-screen w-full snap-center items-center justify-center px-4"
        >
          <div className="flex w-full max-w-sm flex-col gap-3">
            <div className="relative h-[65vh] overflow-hidden rounded-lg bg-zinc-900">
              <CustomVideoPlayer src={video.src} />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <ProfileRow username={video.username} />
                <InteractionBar videoId={video.id} />
              </div>
              <p className="text-sm text-zinc-300">{video.description}</p>
              <p className="text-sm text-blue-400">
                {video.hashtags.join(" ")}
              </p>
              <p className="text-xs text-zinc-500">{video.date}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
