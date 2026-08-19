"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function BlockedPage() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [blockedUsers, setBlockedUsers] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("blockedUsers") ?? "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [loading, user, router]);

  const unblock = (username: string) => {
    const updated = blockedUsers.filter((u) => u !== username);
    setBlockedUsers(updated);
    localStorage.setItem("blockedUsers", JSON.stringify(updated));
  };

  if (loading || !user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-app-bg pt-14 pb-20">
      <div className="mx-auto w-full max-w-sm px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/profile" className="text-zinc-500 transition-colors hover:text-zinc-900">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-zinc-900">{t("blocked.title")}</h1>
        </div>

        {blockedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 rounded-full bg-zinc-200 p-4 text-zinc-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" />
                <line x1="18" y1="8" x2="23" y2="13" /><line x1="23" y1="8" x2="18" y2="13" />
              </svg>
            </div>
            <p className="text-sm text-zinc-600">{t("blocked.emptyTitle")}</p>
            <p className="mt-1 text-xs text-zinc-600">{t("blocked.emptyDesc")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {blockedUsers.map((username) => (
              <div
                key={username}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs text-zinc-600">
                    {username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-zinc-700">@{username}</span>
                </div>
                <button
                  onClick={() => unblock(username)}
                  className="rounded-lg bg-zinc-200 px-3 py-1 text-xs text-zinc-700 transition-colors hover:bg-zinc-300 hover:text-zinc-900"
                >
                  {t("blocked.unblock")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
