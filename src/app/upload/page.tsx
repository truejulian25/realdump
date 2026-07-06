"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

export default function UploadPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setError("Solo se permiten archivos de video");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("El video no puede superar los 50MB");
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

    const fileExt = videoFile.name.split(".").pop();
    const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("videos")
      .upload(filePath, videoFile);

    if (uploadError) {
      setError("Error al subir video: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("videos")
      .getPublicUrl(filePath);
    const videoUrl = urlData.publicUrl;

    const hashtagList = hashtags
      .split(/\s+/)
      .filter((tag) => tag.length > 0);

    const { error: insertError } = await supabase.from("videos").insert({
      user_id: user.id,
      title: title || null,
      description: description || null,
      video_url: videoUrl,
      hashtags: hashtagList.length > 0 ? hashtagList : null,
    });

    if (insertError) {
      setError("Error al guardar metadata: " + insertError.message);
      setUploading(false);
      return;
    }

    setSuccess(true);
    setUploading(false);

    setTimeout(() => router.push("/profile"), 1500);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black pt-14">
        <p className="text-zinc-400">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    router.push("/auth/login");
    return null;
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
          <h1 className="text-lg font-bold text-white">Subir video</h1>
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
              <span className="text-sm">Seleccionar video</span>
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
          placeholder="Título"
          className="w-full bg-transparent px-0 py-2 text-sm text-white placeholder-zinc-500 outline-none caret-blue-500"
        />
 
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción"
          rows={2}
          className="w-full resize-none bg-transparent px-0 py-2 text-sm text-white placeholder-zinc-500 outline-none caret-blue-500"
        />
 
        <input
          type="text"
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
          placeholder="Hashtags (separados por espacio)"
          className="w-full bg-transparent px-0 py-2 text-sm text-white placeholder-zinc-500 outline-none caret-blue-500"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-green-400">¡Video subido con éxito!</p>}

        <button
          type="submit"
          disabled={uploading || !videoFile}
          className="self-start rounded-lg bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? "Subiendo..." : "Subir video"}
        </button>
      </form>
      </div>
    </div>
  );
}
