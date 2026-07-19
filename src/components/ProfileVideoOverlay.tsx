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
import VideoControls from "./VideoControls";
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
}

function VideoSlide({ video, index, currentIndex, selectedIndex, hasScrolled, profile }: VideoSlideProps) {
  const { user } = useAuth();
  const { isFollowing, toggling, toggle: toggleFollow } = useFollowToggle(video.user_id);
  const isSelf = user?.id === video.user_id;
  const isNearby = Math.abs(index - currentIndex) <= 3;
  const slideRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(true);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isNearby) return;
    let mounted = true;

    const sync = () => {
      const player = slideRef.current?.querySelector<HTMLMediaElement>(
        "mux-player, video"
      );
      if (!player) {
        if (mounted) requestAnimationFrame(sync);
        return;
      }

      const onPlay = () => {
        if (mounted) setPaused(false);
      };
      const onPause = () => {
        if (mounted) setPaused(true);
      };

      player.addEventListener("play", onPlay);
      player.addEventListener("pause", onPause);
      setPaused(player.paused);

      return () => {
        player.removeEventListener("play", onPlay);
        player.removeEventListener("pause", onPause);
      };
    };

    const cleanup = sync();
    return () => {
      mounted = false;
      if (typeof cleanup === "function") cleanup();
    };
  }, [video.id, isNearby, currentIndex]);

  const togglePlay = useCallback(() => {
    const player = slideRef.current?.querySelector<HTMLMediaElement>("mux-player, video");
    if (!player) return;
    if (player.paused) player.play().catch(() => {});
    else player.pause();
  }, []);

  useEffect(() => {
    const el = videoContainerRef.current;
    if (!el) return;
    el.addEventListener("click", togglePlay, { capture: true });
    return () => el.removeEventListener("click", togglePlay, { capture: true });
  }, [togglePlay]);

  const showPlayer = index === currentIndex;

  return (
    <div
      ref={slideRef}
      data-video-id={video.id}
      className="relative flex h-dvh w-full flex-shrink-0 snap-start items-center justify-center h-screen-fix"
    >
      {isNearby ? (
        <>
          <div
            ref={videoContainerRef}
            className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-black cursor-pointer"
            style={{ maxHeight: "calc(100dvh - 9rem)" }}
          >
            {showPlayer && paused && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 pointer-events-none">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            )}
            {showPlayer ? (
              <MuxVideoPlayer
                playbackId={video.mux_playback_id}
                src={video.video_url}
                autoPlay
                muted={muted}
              />
            ) : (
              <div className="h-full w-full" />
            )}
            {showPlayer && (
              <button
                onClick={(e) => { e.stopPropagation(); setMuted(p => !p); }}
                className="absolute bottom-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                aria-label={muted ? "Activar sonido" : "Silenciar"}
              >
                {muted ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                )}
              </button>
            )}
          </div>
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-end">
            <div className="pointer-events-auto bg-gradient-to-t from-black/70 via-black/40 to-transparent px-4 pt-8 pb-3 text-left"
                 style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}>
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
                      className={`rounded-lg border px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50 min-h-11 ${
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
                <p className="mt-2 text-sm leading-relaxed text-zinc-200 break-words">{video.description}</p>
              )}
              {video.hashtags && video.hashtags.length > 0 && (
                <p className="mt-1 text-sm text-blue-400 break-words">
                  {video.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}
                </p>
              )}
              <VideoControls containerRef={slideRef} variant="overlay" />
            </div>
          </div>
        </>
      ) : (
        <div className="h-full w-full bg-black" />
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !open) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const v = entry.target as HTMLMediaElement;
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
      const players = container.querySelectorAll<HTMLMediaElement>("mux-player, video");
      observer.disconnect();
      players.forEach((v) => observer.observe(v));
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
      <div className="relative mx-auto h-full w-full max-w-md md:max-w-lg lg:max-w-xl">
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
