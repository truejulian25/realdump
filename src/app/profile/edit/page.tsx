"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const [paypalUrl, setPaypalUrl] = useState("");
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
      setPaypalUrl(profile.paypal_url ?? "");
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
        setError(t("profileEdit.avatarError") + ": " + uploadError.message);
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
        paypal_url: paypalUrl || null,
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
      <div className="flex min-h-screen items-center justify-center bg-app-bg pt-14">
        <p className="text-zinc-600">{t("profile.loading")}</p>
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
          <h1 className="text-lg font-bold text-zinc-900">{t("profileEdit.title")}</h1>
        </div>
      <form onSubmit={handleSave} className="flex w-full max-w-sm flex-col gap-3">

        {/* Avatar */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-zinc-200">
            <img
              src={avatarPreview ?? profile.avatar_url ?? `https://ui-avatars.com/api/?name=${profile.display_name ?? profile.username ?? "user"}&background=6366f1&color=fff&size=80`}
              alt={t("profileEdit.avatarAlt")}
              className="h-full w-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-blue-600 hover:text-blue-500"
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
          <label className="text-xs text-zinc-600">{t("profileEdit.displayName")}</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("profileEdit.displayNamePlaceholder")}
            className="w-full bg-transparent px-0 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none caret-blue-500"
          />
        </div>

        {/* Username */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-600">{t("profileEdit.username")}</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t("profileEdit.usernamePlaceholder")}
            className="w-full bg-transparent px-0 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none caret-blue-500"
          />
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-600">{t("profileEdit.bio")}</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t("profileEdit.bioPlaceholder")}
            rows={2}
            className="w-full resize-none bg-transparent px-0 py-2 text-sm text-white placeholder-zinc-500 outline-none caret-blue-500"
          />
        </div>

        {/* Website */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-600">{t("profileEdit.website")}</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder={t("profileEdit.websitePlaceholder")}
            className="w-full bg-transparent px-0 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none caret-blue-500"
          />
        </div>

        {/* PayPal / Donation */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-600">{t("profileEdit.paypalLabel")}</label>
          <input
            type="text"
            value={paypalUrl}
            onChange={(e) => setPaypalUrl(e.target.value)}
            placeholder={t("profileEdit.paypalPlaceholder")}
            className="w-full bg-transparent px-0 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none caret-blue-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-emerald-600">{t("profileEdit.saved")}</p>}

        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-lg bg-[#0f6b68] px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#0b5451] disabled:opacity-50"
        >
          {saving ? t("profileEdit.saving") : t("profileEdit.save")}
        </button>
      </form>
      </div>
    </div>
  );
}
