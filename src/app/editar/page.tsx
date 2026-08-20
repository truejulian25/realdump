"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import type { Video } from "@/types";
import CollaboratorInput, { type Collaborator } from "@/components/CollaboratorInput";

export default function EditarPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLanguage();

  const [video, setVideo] = useState<Video | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [collaboratorsLoaded, setCollaboratorsLoaded] = useState(false);
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

      const { data: tagsData } = await supabase
        .from("video_tags")
        .select("profiles(id, username, display_name, avatar_url)")
        .eq("video_id", data.id);
      const prefilled: Collaborator[] = [];
      for (const row of (tagsData ?? []) as unknown as {
        profiles: Collaborator | Collaborator[] | null;
      }[]) {
        const profiles = row.profiles;
        if (!profiles) continue;
        if (Array.isArray(profiles)) prefilled.push(...profiles);
        else prefilled.push(profiles);
      }
      setCollaborators(prefilled);
      setCollaboratorsLoaded(true);
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
      setError(t("editar.saveError") + ": " + updateError.message);
      setSaving(false);
      return;
    }

    const tagResp = await fetch("/api/video-tags/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId: video.id,
        userIds: collaborators.map((c) => c.id),
      }),
    });

    if (!tagResp.ok) {
      const err = await tagResp.json().catch(() => ({}));
      setError(err.error || t("editar.saveError"));
      setSaving(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/profile"), 1200);
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg pt-14">
        <p className="text-zinc-600">{t("common.loading")}</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-app-bg pt-14 pb-20 px-4">
        <p className="text-zinc-600">{t("editar.notFound")}</p>
        <Link href="/profile" className="mt-4 text-sm text-blue-600 hover:underline">
          {t("editar.backToProfile")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-app-bg pt-14 pb-20">
      <div className="mx-auto w-full max-w-sm px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/profile" className="text-zinc-500 transition-colors hover:text-zinc-900">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-zinc-900">{t("editar.title")}</h1>
        </div>

        {video?.mux_playback_id && (
          <div className="mb-4 overflow-hidden rounded-lg bg-zinc-200">
            <img
              src={`https://image.mux.com/${video.mux_playback_id}/thumbnail.jpg?width=400`}
              alt=""
              className="w-full object-cover"
            />
          </div>
        )}

        <form onSubmit={handleSave} className="flex w-full max-w-sm flex-col gap-3">
          <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">{t("common.titleLabel")}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("common.titleLabel")}
            className="w-full bg-transparent px-0 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none caret-blue-500"
          />

          <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">{t("common.descriptionLabel")}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("common.descriptionLabel")}
            rows={3}
            className="w-full resize-none bg-transparent px-0 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none caret-blue-500"
          />

          <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">{t("common.hashtagsLabel")}</label>
          <input
            type="text"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder={t("common.hashtagsPlaceholder")}
            className="w-full bg-transparent px-0 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none caret-blue-500"
          />

          <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">
            {t("videoTags.collaboratorsLabel")}
          </label>
          <CollaboratorInput
            selected={collaborators}
            onChange={setCollaborators}
            excludeId={user?.id}
            disabled={saving || !collaboratorsLoaded}
          />
          <p className="text-xs text-zinc-500">{t("videoTags.collaboratorsHint")}</p>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-emerald-600">{t("editar.updatedSuccess")}</p>}

          <button
            type="submit"
            disabled={saving}
            className="self-start rounded-lg bg-[#0f6b68] px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#0b5451] disabled:opacity-50"
          >
            {saving ? t("editar.saving") : t("editar.saveChanges")}
          </button>
        </form>
      </div>
    </div>
  );
}
