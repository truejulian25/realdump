"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
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
import { useVideoThumbnail } from "@/lib/video-thumbnail";

interface VideoWithProfile extends Video {
  profiles: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

const formatDate = (dateStr: string, locale: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

function VideoCard({
  video,
  index,
  activeIndex,
  isOwner,
  onDelete,
  onReport,
  onCenter,
}: {
  video: VideoWithProfile;
  index: number;
  activeIndex: number;
  isOwner: boolean;
  onDelete: (videoId: string) => void;
  onReport: (videoId: string) => void;
  onCenter: (index: number) => void;
}) {
  const { t, locale } = useLanguage();
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const poster = useVideoThumbnail(video);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) onCenter(index);
        });
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onCenter, index]);

  const shouldMount = Math.abs(index - activeIndex) <= 1;

  return (
    <div ref={cardRef} className="flex w-full flex-col pb-5">
      <ProfileRow
        header
        username={video.profiles?.username ?? t("common.usernameAlt")}
        avatarUrl={video.profiles?.avatar_url}
        userId={video.user_id}
      />
      <div
        ref={playerContainerRef}
        className="relative mt-3 w-full overflow-hidden rounded-lg bg-black"
        style={{ maxHeight: "calc(100dvh - 9rem)" }}
      >
        {shouldMount ? (
          <>
            <MuxVideoPlayer
              playbackId={video.mux_playback_id}
              src={video.video_url}
              muted={true}
              poster={video.mux_playback_id ? undefined : poster}
            />
            <VideoControls containerRef={playerContainerRef} variant="feed" />
          </>
        ) : (
          <div className="aspect-[9/16] w-full bg-black" />
        )}
        <div className="absolute right-2 top-2 z-30">
          <VideoMenu
            videoId={video.id}
            isOwner={isOwner}
            onDelete={() => onDelete(video.id)}
            onReport={() => onReport(video.id)}
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
        <p className="text-xs text-zinc-500">{formatDate(video.created_at, locale)}</p>
      </div>
    </div>
  );
}

export default function VideoFeed() {
  const {
    data,
    isLoading,
    isError,
  } = useVideoFeed();

  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const items: VideoWithProfile[] = useMemo(() => data ?? [], [data]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [reportVideoId, setReportVideoId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleCenter = useCallback((index: number) => setActiveIndex(index), []);

  const handleDeleteVideo = useCallback(async (videoId: string) => {
    if (!window.confirm(t("common.deleteConfirm"))) return;
    queryClient.setQueryData<VideoWithProfile[]>(["videos", "feed"], (old) => {
      if (!old) return old;
      return old.filter((v) => v.id !== videoId);
    });
    try {
      const res = await fetch(`/api/videos/${videoId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || t("common.deleteError"));
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : t("common.unknownError");
      toast.error(message);
      queryClient.invalidateQueries({ queryKey: ["videos", "feed"] });
      console.error("Error al eliminar video:", e);
    }
  }, [queryClient, t]);

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
  }, [items, activeIndex]);

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
        <p className="text-red-400">{t("feed.errorLoading")}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-black pt-14 pb-20">
        <p className="text-zinc-400">{t("feed.noVideosYet")}</p>
      </div>
    );
  }

  const safeActiveIndex = Math.min(activeIndex, items.length - 1);

  return (
    <div
      ref={containerRef}
      className="scroll-container h-screen w-full overflow-y-auto overflow-x-hidden bg-black pt-14 pb-20"
    >
      <div className="mx-auto w-full max-w-md border-x border-zinc-800">
        {items.map((video, idx) => (
          <VideoCard
            key={`${video.id}-${idx}`}
            video={video}
            index={idx}
            activeIndex={safeActiveIndex}
            isOwner={video.user_id === user?.id}
            onCenter={handleCenter}
            onDelete={handleDeleteVideo}
            onReport={setReportVideoId}
          />
        ))}
      </div>

      <ReportModal
        open={!!reportVideoId}
        videoId={reportVideoId ?? ""}
        onClose={() => setReportVideoId(null)}
      />
    </div>
  );
}
