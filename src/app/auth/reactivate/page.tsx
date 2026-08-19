"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

type Status = "idle" | "loading" | "success" | "error";

function ReactivateContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("idle");
  const [manualToken, setManualToken] = useState("");
  const { t } = useLanguage();

  const messages: Record<string, { title: string; desc: string }> = {
    idle: { title: t("auth.reactivate.idleTitle"), desc: t("auth.reactivate.idleDesc") },
    loading: { title: t("auth.reactivate.loadingTitle"), desc: t("auth.reactivate.loadingDesc") },
    success: { title: t("auth.reactivate.successTitle"), desc: t("auth.reactivate.successDesc") },
    error: { title: t("auth.reactivate.errorTitle"), desc: t("auth.reactivate.errorDesc") },
  };

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) return;
    setStatus("loading");
    fetch("/api/reactivate-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        if (res.ok) setStatus("success");
        else setStatus("error");
      })
      .catch(() => setStatus("error"));
  }, [searchParams]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/reactivate-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: manualToken.trim() }),
      });
      if (res.ok) setStatus("success");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  }, [manualToken]);

  const msg = messages[status];

  return (
    <div className="w-full max-w-sm rounded-xl border border-white/10 bg-zinc-900/50 p-8 text-center">
      {status === "loading" ? (
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-blue-500" />
      ) : status === "success" ? (
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
      ) : (
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
        </div>
      )}

      <h1 className="text-lg font-bold text-white">{msg.title}</h1>
      <p className="mt-2 text-sm text-zinc-400">{msg.desc}</p>

      {status === "idle" && (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="text"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder={t("auth.reactivate.tokenPlaceholder")}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!manualToken.trim()}
            className="rounded-lg bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {t("auth.reactivate.reactivateBtn")}
          </button>
        </form>
      )}

      {status === "success" && (
        <Link
          href="/auth/login"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          {t("auth.reactivate.signIn")}
        </Link>
      )}

      {(status === "error" || status === "idle") && (
        <Link
          href="/auth/login"
          className="mt-6 inline-block rounded-lg bg-zinc-800 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
        >
          {t("auth.reactivate.backToLogin")}
        </Link>
      )}
    </div>
  );
}

export default function ReactivatePage() {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-app-bg px-4">
      <Suspense fallback={
    <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500" />
          <h1 className="text-lg font-bold text-zinc-900">{t("auth.reactivate.loadingTitle")}</h1>
        </div>
      }>
        <ReactivateContent />
      </Suspense>
    </div>
  );
}
