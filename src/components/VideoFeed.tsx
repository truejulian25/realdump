"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useVideoFeed } from "@/hooks/useVideos";
import type { Video } from "@/types";
import MuxVideoPlayer from "./MuxVideoPlayer";
import ProfileRow from "./ProfileRow";
import InteractionBar from "./InteractionBar";
import FeedSkeleton from "./FeedSkeleton";
import VideoMenu from "./VideoMenu";
import ReportModal from "./ReportModal";

interface VideoWithProfile extends Video {
  profiles: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function VideoFeed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useVideoFeed();

  const items: VideoWithProfile[] = useMemo(() => {
    const seen = new Set<string>();
    return (data?.pages.flat() ?? []).filter((v) => {
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });
  }, [data?.pages]);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef(createClient());
  const [reportVideoId, setReportVideoId] = useState<string | null>(null);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
  }, [loadMore]);

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

  if (isLoading) {
    return (
      <div className="flex h-screen items-start justify-center bg-black pt-14">
        <FeedSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center bg-black pt-14 pb-20">
        <p className="text-red-400">Error al cargar videos</p>
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
      className="scroll-container h-screen w-full overflow-y-auto overflow-x-hidden bg-black pt-14 pb-20"
    >
      <div className="mx-auto w-full max-w-md border-x border-zinc-800">
        {items.map((video, idx) => (
        <div
          key={`${video.id}-${idx}`}
          className="flex w-full flex-col pb-5"
        >
            <ProfileRow
              header
              username={video.profiles?.username ?? "usuario"}
              avatarUrl={video.profiles?.avatar_url}
            />
            <div className="relative mt-3 w-full overflow-hidden rounded-lg bg-zinc-900">
              <MuxVideoPlayer playbackId={video.mux_playback_id} src={video.video_url} />
              <div className="absolute right-2 top-2 z-30">
                <VideoMenu
                  videoId={video.id}
                  onReport={() => setReportVideoId(video.id)}
                />
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-1.5 px-3">
              <InteractionBar videoId={video.id} />
              {video.description && (
                <p className="text-sm leading-relaxed text-zinc-300">{video.description}</p>
              )}
              {video.hashtags && video.hashtags.length > 0 && (
                <p className="text-sm text-blue-400">
                  {video.hashtags.map((h) => h.startsWith("#") ? h : `#${h}`).join(" ")}
                </p>
              )}
              <p className="text-xs text-zinc-500">{formatDate(video.created_at)}</p>
            </div>
        </div>
        ))}

        {isFetchingNextPage && (
          <div className="flex justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
          </div>
        )}

        {hasNextPage && <div ref={sentinelRef} />}
      </div>

      <ReportModal
        open={!!reportVideoId}
        videoId={reportVideoId ?? ""}
        onClose={() => setReportVideoId(null)}
      />
    </div>
  );
}
