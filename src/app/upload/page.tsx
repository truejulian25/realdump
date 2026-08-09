"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import CollaboratorInput, { type Collaborator } from "@/components/CollaboratorInput";

const POLL_INTERVAL = 2000;
const MAX_POLLS = 60;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function UploadPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setError(t("upload.errorNotVideo"));
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setError(t("upload.errorTooLarge"));
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !videoFile) return;

    setUploading(true);
    setError(null);
    setUploadStatus(t("upload.preparing"));

    try {
      // 1. Create Mux upload URL
      setUploadStatus(t("upload.gettingUrl"));
      const uploadResp = await fetch("/api/mux/upload", { method: "POST" });
      if (!uploadResp.ok) {
        const err = await uploadResp.json();
        throw new Error(err.error || t("upload.createUploadError"));
      }
      const { uploadUrl, uploadId } = await uploadResp.json();

      // 2. Upload file directly to Mux
      setUploadStatus(t("upload.uploadingToMux"));
      const fileResp = await fetch(uploadUrl, {
        method: "PUT",
        body: videoFile,
        headers: { "Content-Type": videoFile.type },
      });

      if (!fileResp.ok) {
        throw new Error(t("upload.uploadFileError"));
      }

      // 3. Poll for asset creation
      setUploadStatus(t("upload.processing"));
      let assetId: string | null = null;

      for (let i = 0; i < MAX_POLLS; i++) {
        await wait(POLL_INTERVAL);
        const statusResp = await fetch(`/api/mux/asset-status?uploadId=${uploadId}`);
        if (!statusResp.ok) continue;
        const statusData = await statusResp.json();
        if (statusData.assetId) {
          assetId = statusData.assetId;
          break;
        }
      }

      if (!assetId) {
        throw new Error(t("upload.timeoutError"));
      }

      // 4. Poll for playback ID
      setUploadStatus(t("upload.generatingPlayback"));
      let playbackId: string | null = null;

      for (let i = 0; i < MAX_POLLS; i++) {
        await wait(POLL_INTERVAL);
        const assetResp = await fetch(`/api/mux/asset-status?assetId=${assetId}`);
        if (!assetResp.ok) continue;
        const assetData = await assetResp.json();
        if (assetData.playbackId) {
          playbackId = assetData.playbackId;
          break;
        }
      }

      if (!playbackId) {
        throw new Error(t("upload.playbackError"));
      }

      // 5. Save to database
      setUploadStatus(t("upload.saving"));
      const hashtagList = hashtags
        .split(/\s+/)
        .filter((tag) => tag.length > 0);

      const { data: inserted, error: insertError } = await supabase
        .from("videos")
        .insert({
          user_id: user.id,
          title: title || null,
          description: description || null,
          video_url: "",
          hashtags: hashtagList.length > 0 ? hashtagList : null,
          mux_playback_id: playbackId,
          mux_asset_id: assetId,
        })
        .select("id")
        .single();

      if (insertError) {
        throw new Error(t("upload.saveError") + ": " + insertError.message);
      }

      if (!inserted?.id) {
        throw new Error(t("upload.saveError"));
      }

      // 6. Etiquetar colaboradores (opcional)
      if (collaborators.length > 0) {
        const tagResp = await fetch("/api/video-tags/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoId: inserted.id,
            userIds: collaborators.map((c) => c.id),
          }),
        });
        if (!tagResp.ok) {
          const err = await tagResp.json().catch(() => ({}));
          throw new Error(err.error || t("videoTags.tagError"));
        }
      }

      setSuccess(true);
      setUploadStatus("");
      setTimeout(() => router.push("/profile"), 1500);
    } catch (e) {
      const message = e instanceof Error ? e.message : t("common.unknownError");
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black pt-14">
        <p className="text-zinc-400">{t("common.loading")}</p>
      </div>
    );
  }

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  if (profile?.role !== "creator") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black pt-14 pb-20 px-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <h1 className="text-lg font-bold text-white">{t("upload.title")}</h1>
          <p className="text-sm text-zinc-400">
            {t("upload.onlyCreatorDesc")}
          </p>
          <button
            onClick={() => router.push("/profile")}
            className="rounded-lg bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            {t("upload.goToProfile")}
          </button>
        </div>
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
          <h1 className="text-lg font-bold text-white">{t("upload.title")}</h1>
        </div>
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3">

        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex h-96 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-zinc-600 bg-zinc-900 transition-colors hover:border-blue-500 overflow-hidden"
        >
          {videoPreview ? (
            <video
              src={videoPreview}
              className="h-full w-full object-cover"
              controls
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-400">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <span className="text-sm">{t("upload.selectVideo")}</span>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("common.titleLabel")}
          className="w-full bg-transparent px-0 py-2 text-sm text-white placeholder-zinc-500 outline-none caret-blue-500"
        />
 
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("common.descriptionLabel")}
          rows={2}
          className="w-full resize-none bg-transparent px-0 py-2 text-sm text-white placeholder-zinc-500 outline-none caret-blue-500"
        />
 
        <input
          type="text"
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
          placeholder={t("common.hashtagsPlaceholder")}
          className="w-full bg-transparent px-0 py-2 text-sm text-white placeholder-zinc-500 outline-none caret-blue-500"
        />

        <div className="mt-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            {t("videoTags.collaboratorsLabel")}
          </label>
          <CollaboratorInput
            selected={collaborators}
            onChange={setCollaborators}
            excludeId={user.id}
            disabled={uploading}
          />
          <p className="mt-1 text-xs text-zinc-500">{t("videoTags.collaboratorsHint")}</p>
        </div>

        {uploadStatus && !error && !success && (
          <div className="flex items-center gap-2 text-sm text-blue-400">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
            {uploadStatus}
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-green-400">{t("upload.success")}</p>}

        <button
          type="submit"
          disabled={uploading || !videoFile}
          className="self-start rounded-lg bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? t("upload.uploading") : t("upload.title")}
        </button>
      </form>
      </div>
    </div>
  );
}
