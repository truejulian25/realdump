"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import type { Video } from "@/types";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";
import ProfileRow from "@/components/ProfileRow";
import InteractionBar from "@/components/InteractionBar";

interface VideoWithProfile extends Video {
  profiles: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function PublicacionesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTargetUserId(params.get("user_id"));
  }, []);

  useEffect(() => {
    if (!authLoading && !user && !targetUserId) {
      router.push("/auth/login");
    }
  }, [authLoading, user, targetUserId, router]);

  useEffect(() => {
    const uid = targetUserId ?? user?.id;
    if (!uid) return;

    const fetchVideos = async () => {
      const { data } = await supabase
        .from("videos")
        .select("*, profiles(username, display_name, avatar_url)")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (data) setVideos(data);
      setLoading(false);
    };

    fetchVideos();
  }, [user, targetUserId, supabase]);

  const playVideo = useCallback((video: HTMLVideoElement) => {
    if (currentVideoRef.current && currentVideoRef.current !== video) {
      currentVideoRef.current.pause();
    }
    video.play().catch(() => {});
    currentVideoRef.current = video;
  }, []);

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
  }, [playVideo, videos]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black pt-14 pb-20">
        <p className="text-zinc-400">Cargando...</p>
      </div>
    );
  }

  if (videos.length === 0) {
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
      {videos.map((video) => (
        <div
          key={video.id}
          className="flex h-screen w-full items-center justify-center"
        >
          <div className="flex w-full flex-col gap-3">
            <ProfileRow
              header
              username={video.profiles?.username ?? "usuario"}
              avatarUrl={video.profiles?.avatar_url}
            />
            <div className="relative h-[55vh] w-full overflow-hidden rounded-lg bg-zinc-900">
              <CustomVideoPlayer src={video.video_url} />
            </div>

            <div className="flex flex-col gap-1">
              <InteractionBar videoId={video.id} />
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
    </div>
  );
}
