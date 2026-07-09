"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const supabase = createClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<{
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null>(null);

  const { newerVideos, olderVideos } = useMemo(() => {
    const idx = allVideos.findIndex((v) => v.id === video.id);
    if (idx === -1) return { newerVideos: [], olderVideos: [] };
    return {
      newerVideos: allVideos.slice(0, idx),
      olderVideos: allVideos.slice(idx + 1),
    };
  }, [allVideos, video.id]);

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
    if (!open) return;
    const el = document.getElementById(`overlay-video-${video.id}`);
    el?.scrollIntoView({ block: "start" });
  }, [open, video.id]);

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
      { threshold: 0.7 }
    );

    videoElements.forEach((v) => observer.observe(v));

    return () => observer.disconnect();
  }, [open, newerVideos, olderVideos]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderVideoCard = (v: Video, autoPlay: boolean) => (
    <div key={v.id} className="flex w-full flex-col pb-5">
      {profile && (
        <ProfileRow
          header
          username={profile.username ?? "usuario"}
          avatarUrl={profile.avatar_url}
        />
      )}
      <div className="relative mt-3 w-full overflow-hidden rounded-lg bg-zinc-900">
        <CustomVideoPlayer src={v.video_url} autoPlay={autoPlay} />
      </div>
      <div className="mt-3 flex flex-col gap-1.5 px-3">
        <InteractionBar videoId={v.id} />
        {v.description && (
          <p className="text-sm leading-relaxed text-zinc-300">{v.description}</p>
        )}
        {v.hashtags && v.hashtags.length > 0 && (
          <p className="text-sm text-blue-400">
            {v.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}
          </p>
        )}
        <p className="text-xs text-zinc-500">{formatDate(v.created_at)}</p>
      </div>
    </div>
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      <div className="flex items-center px-1 pt-1">
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
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-md border-x border-zinc-800">
          {newerVideos.map((v) => renderVideoCard(v, false))}
          <div id={`overlay-video-${video.id}`}>{renderVideoCard(video, true)}</div>
          {olderVideos.map((v) => renderVideoCard(v, false))}
        </div>
      </div>
    </div>
  );
}
