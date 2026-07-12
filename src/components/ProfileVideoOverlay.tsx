"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CustomVideoPlayer from "./CustomVideoPlayer";
import ProfileRow from "./ProfileRow";
import InteractionBar from "./InteractionBar";
import type { Video } from "@/types";

interface Props {
  video: Video;
  allVideos: Video[];
  open: boolean;
  onClose: () => void;
}

export default function ProfileVideoOverlay({ video, allVideos, open, onClose }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<{
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const selectedIndex = useMemo(
    () => allVideos.findIndex((v) => v.id === video.id),
    [allVideos, video.id]
  );

  useEffect(() => {
    if (selectedIndex !== -1) {
      setCurrentIndex(selectedIndex);
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (!open || !video.user_id) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .eq("id", video.user_id)
        .single();
      if (data) setProfile(data);
    };

    fetchProfile();
  }, [open, video.user_id, supabase]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open || selectedIndex === -1) return;
    const container = containerRef.current;
    if (!container) return;
    const child = container.children[selectedIndex] as HTMLElement;
    child?.scrollIntoView({ block: "start" });
  }, [open, selectedIndex]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const index = Math.round(container.scrollTop / container.clientHeight);
    setCurrentIndex(index);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !open) return;

    const videoElements = container.querySelectorAll<HTMLVideoElement>("video");
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
    videoElements.forEach((v) => observer.observe(v));
    return () => observer.disconnect();
  }, [open, allVideos]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      <div className="relative mx-auto h-full w-full max-w-md">
        {/* Top bar */}
        <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-2 pt-1">
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white"
            aria-label="Volver"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          {allVideos.length > 1 && (
            <span className="text-sm text-white/70">
              {currentIndex + 1} / {allVideos.length}
            </span>
          )}
        </div>

        {/* TikTok-style snap feed */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto snap-y snap-mandatory scroll-container"
        >
        {allVideos.map((v, i) => (
          <div
            key={v.id}
            className="relative flex h-screen w-full flex-shrink-0 snap-start items-center justify-center"
          >
            <CustomVideoPlayer
              src={v.video_url}
              autoPlay={i === selectedIndex}
            />

            {/* Gradient overlays */}
            <div className="pointer-events-none absolute inset-0 z-10">
              {/* Top gradient + profile */}
              <div className="pointer-events-auto absolute left-0 right-0 top-0 bg-gradient-to-b from-black/50 to-transparent px-4 pb-12 pt-1">
                {profile && (
                  <ProfileRow
                    header
                    username={profile.username ?? "usuario"}
                    avatarUrl={profile.avatar_url}
                  />
                )}
              </div>

              {/* Bottom gradient + info */}
              <div className="pointer-events-auto absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-4 pt-12 pb-4">
                <InteractionBar videoId={v.id} />
                {v.description && (
                  <p className="mt-2 text-sm leading-relaxed text-zinc-200">{v.description}</p>
                )}
                {v.hashtags && v.hashtags.length > 0 && (
                  <p className="mt-1 text-sm text-blue-400">
                    {v.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}
                  </p>
                )}
                <p className="mt-1 text-xs text-zinc-400">{formatDate(v.created_at)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}
