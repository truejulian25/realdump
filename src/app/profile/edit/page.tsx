"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { createClient } from "@/lib/supabase/client";

export default function EditProfilePage() {
  const { t } = useLanguage();
  const { profile, user, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setUsername(profile.username ?? "");
      setBio(profile.bio ?? "");
      setWebsite(profile.website ?? "");
    }
  }, [profile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    let avatar_url = profile?.avatar_url ?? null;

    if (avatarFile) {
      const fileExt = avatarFile.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        setError("Error al subir avatar: " + uploadError.message);
        setSaving(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      avatar_url = urlData.publicUrl;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        username,
        bio,
        website: website || null,
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    await refreshProfile();
    setSuccess(true);
    setSaving(false);

    setTimeout(() => router.push("/profile"), 1500);
  };

  if (authLoading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black pt-14">
        <p className="text-zinc-400">{t("profile.loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-black pt-14 pb-20">
      <form onSubmit={handleSave} className="flex w-full max-w-sm flex-col gap-5 px-4 py-6">
        <h1 className="text-center text-xl font-bold text-white">{t("profileEdit.title")}</h1>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
            <img
              src={avatarPreview ?? profile.avatar_url ?? `https://ui-avatars.com/api/?name=${profile.display_name ?? profile.username ?? "user"}&background=6366f1&color=fff&size=96`}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            {t("profileEdit.changeAvatar")}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* Display name */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400">{t("profileEdit.displayName")}</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("profileEdit.displayNamePlaceholder")}
            className="rounded-lg bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Username */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400">{t("profileEdit.username")}</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t("profileEdit.usernamePlaceholder")}
            className="rounded-lg bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400">{t("profileEdit.bio")}</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t("profileEdit.bioPlaceholder")}
            rows={3}
            className="resize-none rounded-lg bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Website */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400">{t("profileEdit.website")}</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder={t("profileEdit.websitePlaceholder")}
            className="rounded-lg bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-green-400">{t("profileEdit.saved")}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? t("profileEdit.saving") : t("profileEdit.save")}
        </button>
      </form>
    </div>
  );
}
