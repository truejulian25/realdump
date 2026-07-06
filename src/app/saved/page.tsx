"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import type { Video } from "@/types";
import ProfileVideoCard from "@/components/ProfileVideoCard";

interface SavedVideoWithVideo {
  id: string;
  video_id: string;
  created_at: string;
  videos: Video | null;
}

export default function SavedPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [items, setItems] = useState<SavedVideoWithVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    const fetchSaved = async () => {
      const { data } = await supabase
        .from("saved_videos")
        .select("*, videos(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setItems(data);
      setLoading(false);
    };

    fetchSaved();
  }, [user, supabase]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black pt-14 pb-20">
        <p className="text-zinc-400">Cargando...</p>
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
          <div className="grid grid-cols-3 gap-0.5">
            {items.map(
              (item) =>
                item.videos && (
                  <ProfileVideoCard key={item.id} video={item.videos} />
                )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
