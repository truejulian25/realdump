"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Video } from "@/types";
import ProfileVideoCard from "@/components/ProfileVideoCard";

interface VideoWithProfile extends Video {
  profiles: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface ProfileResult {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

type SearchType = "exact" | "partial" | "recommended";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [profiles, setProfiles] = useState<ProfileResult[]>([]);
  const [videos, setVideos] = useState<VideoWithProfile[]>([]);
  const [searchType, setSearchType] = useState<SearchType>("exact");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setProfiles([]);
      setVideos([]);
      setSearched(false);
      setSearchType("exact");
      return;
    }

    setLoading(true);
    window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(async () => {
      let foundProfiles: ProfileResult[] = [];
      let foundVideos: VideoWithProfile[] = [];
      let currentType: SearchType = "exact";

      // 1. Exact search
      const [profileRes, videoRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .or(`username.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%`)
          .limit(10),
        supabase
          .from("videos")
          .select("*, profiles(username, display_name, avatar_url)")
          .or(`title.ilike.%${trimmed}%,description.ilike.%${trimmed}%`)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      foundProfiles = profileRes.data ?? [];
      foundVideos = videoRes.data ?? [];

      // 2. Fallback: word-by-word
      if (foundProfiles.length === 0 && foundVideos.length === 0) {
        currentType = "partial";
        const words = trimmed.split(/\s+/).filter(Boolean);

        const wordResults = await Promise.all(
          words.map((word) =>
            Promise.all([
              supabase
                .from("profiles")
                .select("id, username, display_name, avatar_url")
                .or(`username.ilike.%${word}%,display_name.ilike.%${word}%`)
                .limit(10),
              supabase
                .from("videos")
                .select("*, profiles(username, display_name, avatar_url)")
                .or(`title.ilike.%${word}%,description.ilike.%${word}%`)
                .order("created_at", { ascending: false })
                .limit(50),
            ])
          )
        );

        const profileMap = new Map<string, ProfileResult>();
        const videoMap = new Map<string, VideoWithProfile>();

        wordResults.forEach(([pRes, vRes]) => {
          (pRes.data ?? []).forEach((p) => profileMap.set(p.id, p));
          (vRes.data ?? []).forEach((v) => videoMap.set(v.id, v));
        });

        foundProfiles = Array.from(profileMap.values());
        foundVideos = Array.from(videoMap.values());

        // 3. Recommend if still nothing
        if (foundProfiles.length === 0 && foundVideos.length === 0) {
          currentType = "recommended";
          const { data: recData } = await supabase
            .from("videos")
            .select("*, profiles(username, display_name, avatar_url)")
            .order("created_at", { ascending: false })
            .limit(20);

          foundVideos = recData ?? [];
        }
      }

      setProfiles(foundProfiles);
      setVideos(foundVideos);
      setSearchType(currentType);
      setLoading(false);
      setSearched(true);
    }, 300);

    return () => window.clearTimeout(debounceRef.current);
  }, [query, supabase]);

  return (
    <div className="flex min-h-screen flex-col pt-14 pb-20">
      <div className="sticky top-14 z-10 border-b border-zinc-800 bg-black px-4 py-3">
        <div className="relative mx-auto flex w-full max-w-sm items-center">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 text-zinc-500"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar perfiles o videos..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 pl-10 pr-10 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 text-zinc-500 hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-zinc-400">Buscando...</p>
          </div>
        ) : !searched ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-zinc-500">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p className="text-sm">Busca perfiles o videos</p>
          </div>
        ) : (
          <>
            {searchType === "partial" && (
              <p className="mb-4 text-sm text-zinc-500">Quizás quisiste decir:</p>
            )}

            {profiles.length > 0 && (
              <div className="mb-6">
                <h2 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                  Perfiles
                </h2>
                <div className="flex flex-col gap-2">
                  {profiles.map((p) => (
                    <Link
                      key={p.id}
                      href={`/publicaciones?user_id=${p.id}`}
                      className="flex items-center gap-3 rounded-lg bg-zinc-900 px-4 py-3 transition-colors hover:bg-zinc-800"
                    >
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-zinc-700">
                        <img
                          src={
                            p.avatar_url ??
                            `https://ui-avatars.com/api/?name=${p.display_name ?? p.username ?? "user"}&background=6366f1&color=fff&size=40`
                          }
                          alt={p.username ?? "usuario"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">
                          {p.display_name ?? "Sin nombre"}
                        </span>
                        <span className="text-xs text-zinc-500">@{p.username}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {videos.length > 0 && (
              <div>
                {profiles.length > 0 && (
                  <h2 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                    Videos
                  </h2>
                )}
                {searchType !== "recommended" && profiles.length === 0 && (
                  <p className="mb-3 text-sm text-zinc-500">
                    {videos.length} resultado{videos.length !== 1 ? "s" : ""}
                  </p>
                )}
                <div className="grid grid-cols-3 gap-0.5">
                  {videos.map((video) => (
                    <ProfileVideoCard key={video.id} video={video} />
                  ))}
                </div>
              </div>
            )}

            {profiles.length === 0 && videos.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-zinc-500">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p className="text-sm">No hay contenido disponible</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
