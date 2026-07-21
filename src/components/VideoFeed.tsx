"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useVideoFeed } from "@/hooks/useVideos";
import { toast } from "sonner";
import type { Video } from "@/types";
import MuxVideoPlayer from "./MuxVideoPlayer";
import VideoControls from "./VideoControls";
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
    isLoading,
    isError,
  } = useVideoFeed();

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [cycles, setCycles] = useState(1);
  const lastExtend = useRef(0);

  const items: VideoWithProfile[] = useMemo(() => {
    const flat = data?.pages.flat() ?? [];
    if (flat.length === 0) return [];
    return Array.from(
      { length: flat.length * cycles },
      (_, i) => flat[i % flat.length],
    );
  }, [data?.pages, cycles]);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [reportVideoId, setReportVideoId] = useState<string | null>(null);

  const handleDeleteVideo = useCallback(async (videoId: string) => {
    if (!window.confirm("¿Estás seguro de eliminar esta publicación?")) return;
    queryClient.setQueryData<InfiniteData<VideoWithProfile[]>>(["videos", "feed"], (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => page.filter((v) => v.id !== videoId)),
      };
    });
    try {
      const res = await fetch(`/api/videos/${videoId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al eliminar");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error desconocido";
      toast.error(message);
      queryClient.invalidateQueries({ queryKey: ["videos", "feed"] });
      console.error("Error al eliminar video:", e);
    }
  }, [queryClient]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 300 && Date.now() - lastExtend.current > 1000) {
        lastExtend.current = Date.now();
        setCycles((c) => c + 1);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const players = container.querySelectorAll<HTMLMediaElement>("mux-player, video");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLMediaElement;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.7 }
    );

    players.forEach((video) => observer.observe(video));

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

  function VideoCard({ video }: { video: VideoWithProfile }) {
    const playerContainerRef = useRef<HTMLDivElement>(null);

    return (
      <div className="flex w-full flex-col pb-5">
        <ProfileRow
          header
          username={video.profiles?.username ?? "usuario"}
          avatarUrl={video.profiles?.avatar_url}
          userId={video.user_id}
        />
        <div
          ref={playerContainerRef}
          className="relative mt-3 w-full overflow-hidden rounded-lg bg-black"
          style={{ maxHeight: "calc(100dvh - 9rem)" }}
        >
          <MuxVideoPlayer playbackId={video.mux_playback_id} src={video.video_url} muted={true} />
          <VideoControls containerRef={playerContainerRef} variant="feed" />
          <div className="absolute right-2 top-2 z-30">
            <VideoMenu
              videoId={video.id}
              isOwner={video.user_id === user?.id}
              onDelete={() => handleDeleteVideo(video.id)}
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
    );
  }

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
          <VideoCard key={`${video.id}-${idx}`} video={video} />
        ))}

        <div ref={sentinelRef} />
      </div>

      <ReportModal
        open={!!reportVideoId}
        videoId={reportVideoId ?? ""}
        onClose={() => setReportVideoId(null)}
      />
    </div>
  );
}
