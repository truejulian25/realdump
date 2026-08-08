"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

interface Props {
  open: boolean;
  onClose: () => void;
  videoId: string;
}

export default function ReportModal({ open, onClose, videoId }: Props) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<"video" | "profile">("video");
  const [videoOwnerId, setVideoOwnerId] = useState<string | null>(null);
  const reasons = t<string[]>(mode === "video" ? "report.reasons" : "report.profileReasons");
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !videoId) return;
    let cancelled = false;
    setMode("video");
    setSelectedReason("");
    setDescription("");
    setSent(false);
    setError(null);
    setVideoOwnerId(null);
    supabase
      .from("videos")
      .select("user_id")
      .eq("id", videoId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setVideoOwnerId(data?.user_id ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, videoId, supabase]);

  useEffect(() => {
    setSelectedReason("");
    setError(null);
  }, [mode]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((mode === "video" && !selectedReason) || !description.trim()) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "video"
            ? {
                video_id: videoId,
                reason: selectedReason,
                description: description.trim(),
              }
            : {
                profile_id: videoOwnerId,
                reason: selectedReason,
                description: description.trim(),
              },
        ),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("report.errorSend"));
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.unknownError"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-zinc-900 p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {!user ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white">{t("report.guestTitle")}</h2>
            <p className="text-sm text-zinc-400">{t("report.guestDesc")}</p>
            <div className="mt-2 flex w-full flex-col gap-2">
              <Link
                href="/auth/register"
                onClick={onClose}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                {t("report.guestRegister")}
              </Link>
              <Link
                href="/auth/login"
                onClick={onClose}
                className="w-full rounded-lg border border-zinc-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
              >
                {t("report.guestLogin")}
              </Link>
            </div>
            <button
              onClick={onClose}
              className="mt-1 rounded-lg bg-zinc-800 px-5 py-2 text-sm text-white transition-colors hover:bg-zinc-700"
            >
              {t("report.close")}
            </button>
          </div>
        ) : sent ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white">{t("report.sentTitle")}</h2>
            <p className="text-sm text-zinc-400">{t("report.sentDesc")}</p>
            <button
              onClick={onClose}
              className="mt-2 rounded-lg bg-zinc-800 px-5 py-2 text-sm text-white transition-colors hover:bg-zinc-700"
            >
              {t("report.close")}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {t(mode === "video" ? "report.title" : "report.profileTitle")}
              </h2>
              <button onClick={onClose} className="text-zinc-400 hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <p className="text-sm text-zinc-400">
                {t(mode === "video" ? "report.question" : "report.profileQuestion")}
              </p>

              <div className="flex flex-col gap-2">
                {reasons.map((reason) => (
                  <label
                    key={reason}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors ${
                      selectedReason === reason
                        ? "border-blue-500 bg-blue-500/10 text-white"
                        : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="accent-blue-500"
                    />
                    {reason}
                  </label>
                ))}
              </div>

              {videoOwnerId && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-px flex-1 bg-zinc-700" />
                    <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                      {t("report.or")}
                    </span>
                    <span className="h-px flex-1 bg-zinc-700" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setMode(mode === "video" ? "profile" : "video")}
                    aria-pressed={mode === "profile"}
                    className={`w-full rounded-lg border py-2.5 text-sm font-semibold transition-colors ${
                      mode === "profile"
                        ? "border-blue-500 bg-blue-500/10 text-white"
                        : "border-zinc-600 text-zinc-300 hover:border-zinc-400 hover:text-white"
                    }`}
                  >
                    {mode === "profile"
                      ? t("report.profileSelected")
                      : t("report.profileButton")}
                  </button>
                </div>
              )}

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("report.describePlaceholder")}
                rows={3}
                required
                className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500"
              />

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={
                  (mode === "video" && !selectedReason) ||
                  !description.trim() ||
                  sending
                }
                className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {sending ? t("report.sending") : t("report.send")}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
