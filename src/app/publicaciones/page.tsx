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

interface ProfileData {
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
}

export default function PublicacionesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoWithProfile[]>([]);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
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

    const fetchData = async () => {
      const [videosResult, profileResult] = await Promise.all([
        supabase
          .from("videos")
          .select("*, profiles(username, display_name, avatar_url)")
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("username, display_name, avatar_url, bio, website")
          .eq("id", uid)
          .single(),
      ]);

      if (videosResult.data) setVideos(videosResult.data);
      if (profileResult.data) setProfileData(profileResult.data);
      setLoading(false);
    };

    fetchData();
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

  return (
    <div
      ref={containerRef}
      className="scroll-container h-screen w-full overflow-y-auto overflow-x-hidden bg-black pt-14 pb-20"
    >
      <div className="mx-auto w-full max-w-md border-x border-zinc-800">
        {/* Profile Header */}
        {profileData && (
          <div className="flex flex-col items-center gap-2 border-b border-zinc-800 bg-black px-4 py-6">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
              <img
                src={profileData.avatar_url ?? `https://ui-avatars.com/api/?name=${profileData.display_name ?? profileData.username ?? "user"}&background=6366f1&color=fff&size=96`}
                alt={profileData.display_name ?? "Perfil"}
                className="h-full w-full object-cover"
              />
            </div>

            <h1 className="text-lg font-black text-white">{profileData.display_name ?? "Sin nombre"}</h1>

            <p className="text-sm text-zinc-500">@{profileData.username}</p>

            {profileData.bio && (
              <p className="whitespace-pre-wrap text-sm text-zinc-500">{profileData.bio}</p>
            )}

            {profileData.website && (
              <a
                href={profileData.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 hover:underline"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                {profileData.website.replace(/^https?:\/\//, "")}
              </a>
            )}

            <div className="flex items-center gap-8 text-center">
              <div>
                <p className="text-lg font-bold text-white">{videos.length}</p>
                <p className="text-sm text-zinc-500">Videos</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">0</p>
                <p className="text-sm text-zinc-500">Seguidores</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">0</p>
                <p className="text-sm text-zinc-500">Siguiendo</p>
              </div>
            </div>
          </div>
        )}

        {/* Videos */}
        {videos.length === 0 ? (
          <p className="py-8 text-center text-zinc-500">No hay videos aún</p>
        ) : (
          videos.map((video) => (
          <div
            key={video.id}
            className="flex w-full flex-col pb-5"
          >
              <ProfileRow
                header
                username={video.profiles?.username ?? "usuario"}
                avatarUrl={video.profiles?.avatar_url}
              />
              <div className="relative mt-3 w-full overflow-hidden rounded-lg bg-zinc-900">
                <CustomVideoPlayer src={video.video_url} />
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
          ))
        )}
      </div>
    </div>
  );
}
