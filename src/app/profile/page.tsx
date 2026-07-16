"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import ProfileVideoCard from "@/components/ProfileVideoCard";
import ProfileVideoOverlay from "@/components/ProfileVideoOverlay";
import ProfileGridSkeleton from "@/components/ProfileGridSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfileVideos } from "@/hooks/useVideos";
import { useFollowerCount, useFollowingCount } from "@/hooks/useFollow";
import { createClient } from "@/lib/supabase/client";
import type { Video } from "@/types";

export default function ProfilePage() {
  const { t } = useLanguage();
  const { profile, user, loading } = useAuth();
  const supabase = createClient();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: videosLoading,
  } = useProfileVideos(user?.id);
  const followerCount = useFollowerCount(profile?.id);
  const followingCount = useFollowingCount(profile?.id);

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
    if (!loading && !user) {
      window.location.href = "/auth/login";
    }
  }, [loading, user]);

  // Infinite scroll sentinel
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
    if (!profile?.role) return;
    const checkRequest = async () => {
      const { data } = await supabase
        .from("role_requests")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "pending")
        .maybeSingle();
      if (data) setRequestSent(true);
    };
    if (profile?.role === "viewer" || profile?.role === "pending") {
      checkRequest();
    }
  }, [profile?.role, user?.id, supabase]);

  // popstate: cerrar overlay con el botón Atrás del navegador
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

  const handleRequestCreator = async () => {
    setRequestLoading(true);
    const res = await fetch("/api/role-request", { method: "POST" });
    if (res.ok) {
      setRequestSent(true);
    }
    setRequestLoading(false);
  };

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black pt-14">
        <p className="text-zinc-400">{t("profile.loading")}</p>
      </div>
    );
  }

  const avatarSrc = profile.avatar_url
    ?? `https://ui-avatars.com/api/?name=${profile.display_name ?? profile.username ?? "user"}&background=6366f1&color=fff&size=96`;

  const isCreator = profile.role === "creator";
  const isPending = profile.role === "pending";

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

        <h1 className="text-lg font-black text-white">{profile.display_name ?? t("profile.noName")}</h1>

        <p className="text-sm text-zinc-500">@{profile.username}</p>

        <div className="flex items-center gap-2">
          <p className="text-sm text-zinc-500 whitespace-pre-wrap">{profile.bio ?? t("profile.noBio")}</p>
          <Link
            href="/profile/edit"
            className="text-zinc-400 transition-colors hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </Link>
        </div>

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
            <p className="text-lg font-bold text-white">{isCreator ? videos.length : "—"}</p>
            <p className="text-sm text-zinc-500">{t("profile.videos")}</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">{followerCount}</p>
            <p className="text-sm text-zinc-500">{t("profile.followers")}</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">{followingCount}</p>
            <p className="text-sm text-zinc-500">{t("profile.following")}</p>
          </div>
        </div>
      </div>

      {isPending && (
        <div className="flex flex-col items-center gap-2 py-12 px-4 text-center">
          <p className="text-sm text-zinc-400">
            Tu solicitud para ser creador está pendiente de aprobación.
          </p>
        </div>
      )}

      {!isCreator && !isPending && (
        <div className="flex flex-col items-center gap-3 py-12 px-4 text-center">
          <p className="text-sm text-zinc-400">
            Aún no eres creador. Solicita convertirte en creador para empezar a subir videos.
          </p>
          <button
            onClick={handleRequestCreator}
            disabled={requestLoading || requestSent}
            className="rounded-lg bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {requestLoading ? "Enviando..." : requestSent ? "Solicitud enviada" : "Solicitar ser creador"}
          </button>
        </div>
      )}

      {isCreator && (
        <>
          {videosLoading ? (
            <ProfileGridSkeleton />
          ) : videos.length === 0 ? (
            <p className="py-8 text-center text-zinc-500">{t("profile.noVideosYet")}</p>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-0.5 p-0.5">
              {videos.map((video) => (
                <ProfileVideoCard key={video.id} video={video} onClick={handleVideoClick} />
              ))}
            </div>
          )}

          {/* Infinite scroll sentinel */}
          {hasNextPage && (
            <div ref={sentinelRef} className="h-10" />
          )}

          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
            </div>
          )}
        </>
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
