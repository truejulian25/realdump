"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProfileVideoCard from "@/components/ProfileVideoCard";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import type { Video } from "@/types";

export default function ProfilePage() {
  const { profile, user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [videos, setVideos] = useState<Video[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;

    const fetchVideos = async () => {
      const { data } = await supabase
        .from("videos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setVideos(data);
      setVideosLoading(false);
    };

    fetchVideos();
  }, [user, supabase]);

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black pt-14">
        <p className="text-zinc-400">Cargando...</p>
      </div>
    );
  }

  const avatarSrc = profile.avatar_url
    ?? `https://ui-avatars.com/api/?name=${profile.display_name ?? profile.username ?? "user"}&background=6366f1&color=fff&size=96`;

  return (
    <div className="flex min-h-screen flex-col pt-14 pb-20">
      <div className="flex flex-col items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-4 py-6">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
          <img
            src={avatarSrc}
            alt="Perfil"
            className="h-full w-full object-cover"
          />
        </div>

        <h1 className="text-lg font-black text-white">{profile.display_name ?? "Sin nombre"}</h1>

        <p className="text-sm text-zinc-500">@{profile.username}</p>

        <div className="flex items-center gap-2">
          <p className="text-sm text-zinc-500 whitespace-pre-wrap">{profile.bio ?? "Sin bio"}</p>
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
            <p className="text-lg font-bold text-white">{videos.length}</p>
            <p className="text-sm text-zinc-500">Videos</p>
          </div>
          <Link href="/saved" className="flex flex-col items-center gap-1 text-zinc-500 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-[10px] leading-tight">Guardados</p>
          </Link>
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

      <div className="grid grid-cols-3 gap-0.5 p-0.5">
        {videosLoading ? (
          <p className="col-span-3 py-8 text-center text-zinc-500">Cargando videos...</p>
        ) : videos.length === 0 ? (
          <p className="col-span-3 py-8 text-center text-zinc-500">Sin videos aún</p>
        ) : (
          videos.map((video) => (
            <ProfileVideoCard key={video.id} video={video} />
          ))
        )}
      </div>
    </div>
  );
}
