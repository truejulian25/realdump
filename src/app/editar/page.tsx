"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import type { Video } from "@/types";

export default function EditarPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [video, setVideo] = useState<Video | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const videoId = params.get("video_id");
    if (!videoId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const fetchVideo = async () => {
      const { data, error: fetchError } = await supabase
        .from("videos")
        .select("*")
        .eq("id", videoId)
        .eq("user_id", user.id)
        .single();

      if (fetchError || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setVideo(data);
      setTitle(data.title ?? "");
      setDescription(data.description ?? "");
      setHashtags((data.hashtags ?? []).join(" "));
      setLoading(false);
    };

    fetchVideo();
  }, [authLoading, user, supabase, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !video) return;

    setSaving(true);
    setError(null);

    const hashtagList = hashtags
      .split(/\s+/)
      .filter((tag) => tag.length > 0);

    const { error: updateError } = await supabase
      .from("videos")
      .update({
        title: title || null,
        description: description || null,
        hashtags: hashtagList.length > 0 ? hashtagList : null,
      })
      .eq("id", video.id)
      .eq("user_id", user.id);

    if (updateError) {
      setError("Error al guardar: " + updateError.message);
      setSaving(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/profile"), 1200);
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black pt-14">
        <p className="text-zinc-400">Cargando...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black pt-14 pb-20 px-4">
        <p className="text-zinc-400">Video no encontrado</p>
        <Link href="/profile" className="mt-4 text-sm text-blue-500 hover:underline">
          Volver a mi perfil
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-black pt-14 pb-20">
      <div className="mx-auto w-full max-w-sm px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/profile" className="text-zinc-400 transition-colors hover:text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-white">Editar descripción</h1>
        </div>

        {video?.mux_playback_id && (
          <div className="mb-4 overflow-hidden rounded-lg bg-zinc-900">
            <img
              src={`https://image.mux.com/${video.mux_playback_id}/thumbnail.jpg?width=400`}
              alt=""
              className="w-full object-cover"
            />
          </div>
        )}

        <form onSubmit={handleSave} className="flex w-full max-w-sm flex-col gap-3">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            className="w-full bg-transparent px-0 py-2 text-sm text-white placeholder-zinc-500 outline-none caret-blue-500"
          />

          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción"
            rows={3}
            className="w-full resize-none bg-transparent px-0 py-2 text-sm text-white placeholder-zinc-500 outline-none caret-blue-500"
          />

          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Hashtag</label>
          <input
            type="text"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="Hashtags (separados por espacio)"
            className="w-full bg-transparent px-0 py-2 text-sm text-white placeholder-zinc-500 outline-none caret-blue-500"
          />

          {error && <p className="text-sm text-red-400">{error}</p>}
          {success && <p className="text-sm text-green-400">¡Video actualizado!</p>}

          <button
            type="submit"
            disabled={saving}
            className="self-start rounded-lg bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}
