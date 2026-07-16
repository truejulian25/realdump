"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useFollowToggle } from "@/hooks/useFollow";
import { toast } from "sonner";
import MuxVideoPlayer from "./MuxVideoPlayer";
import InteractionBar from "./InteractionBar";
import VideoMenu from "./VideoMenu";
import ReportModal from "./ReportModal";
import type { Video } from "@/types";

interface VideoWithProfile extends Video {
  profiles: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function useMountAnimation(open: boolean) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else if (mounted) {
      setVisible(false);
    }
  }, [open]);

  useEffect(() => {
    if (!visible && mounted) {
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [visible, mounted]);

  return { mounted, visible };
}

interface VideoSlideProps {
  video: Video;
  index: number;
  currentIndex: number;
  selectedIndex: number;
  hasScrolled: boolean;
  profile: { username: string | null; display_name: string | null; avatar_url: string | null } | null;
  videoRef: (el: HTMLElement | null) => void;
  videoElementsRef: React.MutableRefObject<Map<string, HTMLVideoElement>>;
}

function VideoSlide({ video, index, currentIndex, selectedIndex, hasScrolled, profile, videoRef, videoElementsRef }: VideoSlideProps) {
  const { user } = useAuth();
  const { isFollowing, toggling, toggle: toggleFollow } = useFollowToggle(video.user_id);
  const isSelf = user?.id === video.user_id;
  const isNearby = Math.abs(index - currentIndex) <= 3;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isNearby) return;
    const videoEl = videoElementsRef.current.get(video.id);
    if (!videoEl) return;

    const handleTimeUpdate = () => {
      if (videoEl.duration) {
        setProgress(videoEl.currentTime / videoEl.duration);
      }
    };

    videoEl.addEventListener("timeupdate", handleTimeUpdate);
    return () => videoEl.removeEventListener("timeupdate", handleTimeUpdate);
  }, [video.id, isNearby, videoElementsRef]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const videoEl = videoElementsRef.current.get(video.id);
    if (!videoEl || !videoEl.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    videoEl.currentTime = (x / rect.width) * videoEl.duration;
  };

  const showPlayer = index === currentIndex;

  return (
    <div
      ref={videoRef}
      data-video-id={video.id}
      className="relative flex h-screen w-full flex-shrink-0 snap-start items-center justify-center"
    >
      {isNearby ? (
        <>
          <div
            className="relative flex h-full w-full items-center justify-center overflow-hidden bg-zinc-900"
            style={{ maxHeight: "calc(100dvh - 15rem)" }}
          >
            {showPlayer ? (
              <MuxVideoPlayer
                playbackId={video.mux_playback_id}
                src={video.video_url}
                autoPlay
                muted={showPlayer && index === selectedIndex && !hasScrolled}
                showControls={false}
              />
            ) : (
              <div className="h-full w-full" />
            )}
          </div>
          <div className="pointer-events-none absolute inset-0 z-10">
            <div className="pointer-events-auto absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent px-4 pt-0 pb-4 text-left backdrop-blur-[2px]">
              {profile && (
                <div className="mb-2 flex items-center justify-between">
                  <Link
                    href={`/user/${video.user_id}`}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-zinc-600 bg-zinc-800">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-semibold text-zinc-400">
                          {profile.username?.[0]?.toUpperCase() ?? "?"}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-white">{profile.username ?? "usuario"}</p>
                  </Link>
                  {!isSelf && (
                    <button
                      onClick={toggleFollow}
                      disabled={toggling}
                      className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                        isFollowing
                          ? "border-zinc-600 text-zinc-400"
                          : "border-blue-500 text-blue-500 hover:bg-blue-500/10"
                      }`}
                    >
                      {isFollowing ? "Siguiendo" : "Seguir"}
                    </button>
                  )}
                </div>
              )}
              <InteractionBar videoId={video.id} />
              {video.description && (
                <p className="mt-2 text-sm leading-relaxed text-zinc-200">{video.description}</p>
              )}
              {video.hashtags && video.hashtags.length > 0 && (
                <p className="mt-1 text-sm text-blue-400">
                  {video.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}
                </p>
              )}
              <div
                className="mt-2 h-1 w-full cursor-pointer rounded-full bg-zinc-600"
                onClick={handleSeek}
              >
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="h-full w-full bg-zinc-900" />
      )}
    </div>
  );
}

interface Props {
  video: Video | null;
  allVideos: Video[];
  open: boolean;
  onClose: () => void;
  onLoadMore?: () => void;
}

export default function ProfileVideoOverlay({ video, allVideos, open, onClose, onLoadMore }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const containerRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<{
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [reportVideoId, setReportVideoId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const initialIndexRef = useRef(0);

  const { mounted, visible } = useMountAnimation(open);

  const lastVideoRef = useRef(video);
  const lastVideosRef = useRef(allVideos);

  useEffect(() => {
    if (open) {
      lastVideoRef.current = video;
      lastVideosRef.current = allVideos;
    }
  }, [open, video, allVideos]);

  const activeVideo = open ? video : lastVideoRef.current;
  const activeVideos = open ? allVideos : lastVideosRef.current;

  const selectedIndex = useMemo(() => {
    if (!activeVideo) return -1;
    return activeVideos.findIndex((v) => v.id === activeVideo.id);
  }, [activeVideo, activeVideos]);

  useEffect(() => {
    if (selectedIndex !== -1) {
      setCurrentIndex(selectedIndex);
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (!open || !activeVideo?.user_id) return;

    const fetchProfile = async () => {
      const { data } = await supabaseRef.current
        .from("profiles")
        .select("username, display_name, avatar_url")
        .eq("id", activeVideo.user_id)
        .single();
      if (data) setProfile(data);
    };

    fetchProfile();
  }, [open, activeVideo?.user_id]);

  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mounted]);

  useEffect(() => {
    if (!open || selectedIndex === -1 || !mounted) return;
    initialIndexRef.current = selectedIndex;
    setHasScrolled(false);
    setCurrentIndex(selectedIndex);
    const container = containerRef.current;
    if (!container) return;
    const child = container.children[selectedIndex] as HTMLElement;
    child?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [open, selectedIndex, mounted]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const index = Math.round(container.scrollTop / container.clientHeight);
    setCurrentIndex(index);
    if (index !== initialIndexRef.current) {
      setHasScrolled(true);
    }

    if (onLoadMore && index >= activeVideos.length - 2) {
      onLoadMore();
    }
  }, [activeVideos.length, onLoadMore]);

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
      queryClient.invalidateQueries({ queryKey: ["videos", "profile"] });
      queryClient.invalidateQueries({ queryKey: ["videos", "publicaciones"] });
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error desconocido";
      toast.error(message);
      queryClient.invalidateQueries({ queryKey: ["videos", "feed"] });
      console.error("Error al eliminar video:", e);
    }
  }, [queryClient, onClose]);

  const videoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  const stableVideoRef = useCallback((el: HTMLElement | null) => {
    const id = el?.dataset.videoId;
    if (!id) return;
    if (el) {
      const video = el.querySelector<HTMLVideoElement>("video");
      if (video) videoElementsRef.current.set(id, video);
    } else {
      videoElementsRef.current.delete(id);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !open) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const v = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    const syncObserved = () => {
      const videos = container.querySelectorAll<HTMLVideoElement>("video");
      observer.disconnect();
      videos.forEach((v) => observer.observe(v));
    };

    syncObserved();

    const mutationObserver = new MutationObserver(syncObserved);
    mutationObserver.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "scale(1) translateY(0px)"
          : "scale(0.92) translateY(16px)",
        transition: "opacity 250ms cubic-bezier(0.16, 1, 0.3, 1), transform 300ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div className="relative mx-auto h-full w-full max-w-md">
        <div
          className="absolute left-0 right-0 top-0 z-30 bg-gradient-to-b from-black/85 to-transparent px-3 pb-14 pt-2"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(-12px)",
            transition: "opacity 200ms ease-out, transform 200ms ease-out",
            transitionDelay: visible ? "60ms" : "0ms",
          }}
        >
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
              aria-label="Volver"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <VideoMenu
              videoId={activeVideos[currentIndex]?.id}
              isOwner={activeVideos[currentIndex]?.user_id === user?.id}
              onEdit={() => {
                const id = activeVideos[currentIndex]?.id;
                if (id) router.push(`/editar?video_id=${id}`);
              }}
              onDelete={() => {
                const id = activeVideos[currentIndex]?.id;
                if (id) handleDeleteVideo(id);
              }}
              onReport={() => activeVideos[currentIndex]?.id && setReportVideoId(activeVideos[currentIndex].id)}
            />
          </div>
        </div>

        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto snap-y snap-mandatory scroll-container"
        >
          {activeVideos.map((v, i) => (
            <VideoSlide
              key={v.id}
              video={v}
              index={i}
              currentIndex={currentIndex}
              selectedIndex={selectedIndex}
              hasScrolled={hasScrolled}
              profile={profile}
              videoRef={stableVideoRef}
              videoElementsRef={videoElementsRef}
            />
          ))}
        </div>

        <ReportModal
          open={!!reportVideoId}
          videoId={reportVideoId ?? ""}
          onClose={() => setReportVideoId(null)}
        />
      </div>
    </div>
  );
}
