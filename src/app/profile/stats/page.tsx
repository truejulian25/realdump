"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { createClient } from "@/lib/supabase/client";

interface Stats {
  videos: number;
  likes: number;
  comments: number;
  saved: number;
}

export default function StatsPage() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [stats, setStats] = useState<Stats>({ videos: 0, likes: 0, comments: 0, saved: 0 });
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const videoIds: string[] = [];

      const { data: videos } = await supabase
        .from("videos")
        .select("id")
        .eq("user_id", user.id);

      const videoCount = videos?.length ?? 0;
      if (videos) videoIds.push(...videos.map((v) => v.id));

      let likesCount = 0;
      let commentsCount = 0;
      let savedCount = 0;

      if (videoIds.length > 0) {
        const [{ count: likes }, { count: comments }, { count: saved }] = await Promise.all([
          supabase.from("likes").select("*", { count: "exact", head: true }).in("video_id", videoIds),
          supabase.from("comments").select("*", { count: "exact", head: true }).in("video_id", videoIds),
          supabase.from("saved_videos").select("*", { count: "exact", head: true }).in("video_id", videoIds),
        ]);
        likesCount = likes ?? 0;
        commentsCount = comments ?? 0;
        savedCount = saved ?? 0;
      }

      setStats({ videos: videoCount, likes: likesCount, comments: commentsCount, saved: savedCount });
      setFetching(false);
    };

    fetchStats();
  }, [user, supabase]);

  if (loading || !user) return null;

  const statCards = [
    { label: t("stats.videos"), value: stats.videos, color: "text-blue-400" },
    { label: t("stats.likesReceived"), value: stats.likes, color: "text-rose-400" },
    { label: t("stats.comments"), value: stats.comments, color: "text-emerald-400" },
    { label: t("stats.timesSaved"), value: stats.saved, color: "text-amber-400" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-black pt-14 pb-20">
      <div className="mx-auto w-full max-w-sm px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/profile" className="text-zinc-400 transition-colors hover:text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-white">{t("stats.title")}</h1>
        </div>

        {fetching ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-zinc-500">{t("stats.loading")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {statCards.map((card) => (
              <div key={card.label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <p className={`text-2xl font-black ${card.color}`}>{card.value.toLocaleString()}</p>
                <p className="mt-1 text-xs text-zinc-500">{card.label}</p>
              </div>
            ))}
          </div>
        )}

        {!fetching && stats.videos === 0 && (
          <p className="mt-6 text-center text-xs text-zinc-600">{t("stats.noVideosYet")}</p>
        )}
      </div>
    </div>
  );
}
