"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Video } from "@/types";
import CustomVideoPlayer from "./CustomVideoPlayer";
import ProfileRow from "./ProfileRow";
import InteractionBar from "./InteractionBar";

const PAGE_SIZE = 10;

interface VideoWithProfile extends Video {
  profiles: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function VideoFeed() {
  const [items, setItems] = useState<VideoWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const pageRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

  const fetchVideos = useCallback(async (page: number) => {
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("videos")
      .select("*, profiles(username, display_name, avatar_url)")
      .order("created_at", { ascending: false })
      .range(start, end);

    if (error) {
      console.error("Error fetching videos:", error);
      return;
    }

    if (!data || data.length === 0) {
      pageRef.current = 0;
      const { data: resetData } = await supabase
        .from("videos")
        .select("*, profiles(username, display_name, avatar_url)")
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (resetData) {
        setItems((prev) => [...prev, ...resetData]);
      }
      return;
    }

    setItems((prev) => [...prev, ...data]);
  }, [supabase]);

  useEffect(() => {
    fetchVideos(0).finally(() => setLoading(false));
  }, [fetchVideos]);

  const loadMore = useCallback(() => {
    pageRef.current += 1;
    fetchVideos(pageRef.current);
  }, [fetchVideos]);

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <p className="text-zinc-400">Cargando...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-black pt-14 pb-20">
        <p className="text-zinc-400">No hay videos aún</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen w-full snap-y snap-mandatory overflow-y-scroll bg-black pt-14 pb-20"
    >
      {items.map((video, idx) => (
        <div
          key={`${video.id}-${idx}`}
          className="flex h-screen w-full snap-center items-center justify-center px-4"
        >
          <div className="flex w-full max-w-sm flex-col gap-3">
            <div className="relative h-[65vh] overflow-hidden rounded-lg bg-zinc-900">
              <CustomVideoPlayer src={video.video_url} />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <ProfileRow
                  username={video.profiles?.username ?? "usuario"}
                  avatarUrl={video.profiles?.avatar_url}
                />
                <InteractionBar videoId={video.id} />
              </div>
              {video.description && (
                <p className="text-sm text-zinc-300">{video.description}</p>
              )}
              {video.hashtags && video.hashtags.length > 0 && (
                <p className="text-sm text-blue-400">
                  {video.hashtags.map((h) => h.startsWith("#") ? h : `#${h}`).join(" ")}
                </p>
              )}
              <p className="text-xs text-zinc-500">{formatDate(video.created_at)}</p>
            </div>
          </div>
        </div>
      ))}
      <div ref={sentinelRef} />
    </div>
  );
}
