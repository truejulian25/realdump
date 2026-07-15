"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Video, Profile } from "@/types";
import ProfileVideoCard from "@/components/ProfileVideoCard";
import ProfileVideoOverlay from "@/components/ProfileVideoOverlay";
import ProfileGridSkeleton from "@/components/ProfileGridSkeleton";
import { usePublicacionesVideos } from "@/hooks/useVideos";

export default function UserPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: videosLoading,
  } = usePublicacionesVideos(id);

  const videos = useMemo(() => {
    const seen = new Set<string>();
    return (data?.pages.flat() ?? []).filter((v) => {
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });
  }, [data?.pages]);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      setProfile(profileData);
      setProfileLoading(false);
    };
    fetchProfile();
  }, [id, supabase]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const handlePopState = () => setSelectedVideo(null);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleVideoClick = useCallback((video: Video) => {
    window.history.pushState(null, "");
    setSelectedVideo(video);
  }, []);

  const handleCloseOverlay = useCallback(() => {
    setSelectedVideo(null);
    window.history.back();
  }, []);

  const avatarSrc = profile?.avatar_url
    ?? `https://ui-avatars.com/api/?name=${profile?.display_name ?? profile?.username ?? "user"}&background=6366f1&color=fff&size=96`;

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black pt-14">
        <p className="text-zinc-400">Cargando...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black pt-14">
        <p className="text-zinc-500">Usuario no encontrado</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black pt-14 pb-20">
      <div className="flex flex-col items-center gap-2 border-b border-zinc-800 bg-black px-4 py-6">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
          <img
            src={avatarSrc}
            alt="Perfil"
            className="h-full w-full object-cover"
          />
        </div>

        <h1 className="text-lg font-black text-white">{profile.display_name ?? "Sin nombre"}</h1>

        <p className="text-sm text-zinc-500">@{profile.username}</p>

        {profile.bio && (
          <p className="text-sm text-zinc-500 whitespace-pre-wrap">{profile.bio}</p>
        )}

        {profile.website && (
          <a
            href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 hover:underline"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {profile.website.replace(/^https?:\/\//, "")}
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

      {videosLoading ? (
        <ProfileGridSkeleton />
      ) : videos.length === 0 ? (
        <p className="py-8 text-center text-zinc-500">Sin videos</p>
      ) : (
        <div className="grid grid-cols-3 gap-0.5 p-0.5">
          {videos.map((video) => (
            <ProfileVideoCard key={video.id} video={video} onClick={handleVideoClick} />
          ))}
        </div>
      )}

      {hasNextPage && (
        <div ref={sentinelRef} className="h-10" />
      )}

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
        </div>
      )}

      <ProfileVideoOverlay
        video={selectedVideo}
        allVideos={videos}
        open={!!selectedVideo}
        onClose={handleCloseOverlay}
        onLoadMore={hasNextPage ? fetchNextPage : undefined}
      />
    </div>
  );
}
