"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import CustomVideoPlayer from "./CustomVideoPlayer";
import ProfileRow from "./ProfileRow";
import InteractionBar from "./InteractionBar";

interface VideoData {
  id: number;
  src: string;
  username: string;
  description: string;
  hashtags: string[];
  date: string;
}

const baseVideos: Omit<VideoData, "id">[] = [
  {
    src: "/videos/video1.mp4",
    username: "joan",
    description: "Mi primer tatuaje en time-lapse",
    hashtags: ["#tatuaje", "#timelapse", "#arte"],
    date: "2 de julio, 2026",
  },
  {
    src: "/videos/video2.mp4",
    username: "joan",
    description: "Diseño personalizado para cliente",
    hashtags: ["#tattoo", "#blackwork"],
    date: "1 de julio, 2026",
  },
  {
    src: "/videos/video3.mp4",
    username: "joan",
    description: "Proceso completo de la sesión",
    hashtags: ["#tatuajecolombiano", "#realismo"],
    date: "28 de junio, 2026",
  },
];

const BATCH_SIZE = 10;

function generateBatch(page: number): VideoData[] {
  const start = page * BATCH_SIZE;
  return Array.from({ length: BATCH_SIZE }, (_, i) => ({
    ...baseVideos[(start + i) % baseVideos.length],
    id: start + i + 1,
  }));
}

export default function VideoFeed() {
  const [items, setItems] = useState<VideoData[]>(() => generateBatch(0));
  const pageRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    pageRef.current += 1;
    const newItems = generateBatch(pageRef.current);
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  // Sentinel observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [items, loadMore]);

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
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.7 }
    );

    videoElements.forEach((video) => observer.observe(video));

    return () => observer.disconnect();
  }, [items]);

  return (
    <div
      ref={containerRef}
      className="h-screen w-full snap-y snap-mandatory overflow-y-scroll bg-black pt-14 pb-20"
    >
      {items.map((video) => (
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
                <InteractionBar />
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
      <div ref={sentinelRef} />
    </div>
  );
}
