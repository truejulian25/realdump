"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSavedVideos } from "@/hooks/useVideos";
import type { Video } from "@/types";
import ProfileVideoCard from "@/components/ProfileVideoCard";
import ProfileGridSkeleton from "@/components/ProfileGridSkeleton";

interface SavedVideoWithVideo {
  id: string;
  video_id: string;
  created_at: string;
  videos: Video | null;
}

export default function SavedPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useSavedVideos(user?.id);

  const items: SavedVideoWithVideo[] = data?.pages.flat() ?? [];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

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

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-black pt-14 pb-20">
        <div className="mx-auto w-full max-w-sm px-4 py-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-4 w-4 rounded bg-zinc-800 animate-pulse" />
            <div className="h-5 w-24 rounded bg-zinc-800 animate-pulse" />
          </div>
          <ProfileGridSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black pt-14 pb-20">
      <div className="mx-auto w-full max-w-sm px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/profile" className="text-zinc-400 transition-colors hover:text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-white">Guardados</h1>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 rounded-full bg-zinc-800 p-4 text-zinc-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm text-zinc-400">No has guardado ningún video</p>
            <p className="mt-1 text-xs text-zinc-600">Los videos que guardes aparecerán aquí</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-0.5">
              {items.map(
                (item) =>
                  item.videos && (
                    <ProfileVideoCard key={item.id} video={item.videos} />
                  )
              )}
            </div>

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
      </div>
    </div>
  );
}
