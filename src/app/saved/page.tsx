"use client";

import { useEffect, useState } from "react";
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
    <div className="flex min-h-screen flex-col pt-14 pb-20">
      <div className="border-b border-zinc-800 bg-black px-4 py-4">
        <h1 className="text-center text-lg font-bold text-white">Guardados</h1>
      </div>

      <div className="grid grid-cols-3 gap-0.5 p-0.5">
        {items.length === 0 ? (
          <p className="col-span-3 py-20 text-center text-zinc-500">
            No has guardado ningún video
          </p>
        ) : (
          items.map(
            (item) =>
              item.videos && (
                <ProfileVideoCard key={item.id} video={item.videos} />
              )
          )
        )}
      </div>
    </div>
  );
}
