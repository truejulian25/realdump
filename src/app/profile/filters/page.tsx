"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FiltersPage() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [filterWords, setFilterWords] = useState("");
  const [hideOffensive, setHideOffensive] = useState(true);
  const [customWords, setCustomWords] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [loading, user, router]);

  useEffect(() => {
    setFilterWords(localStorage.getItem("filterWords") ?? "");
    setHideOffensive(localStorage.getItem("hideOffensive") !== "false");
    setCustomWords(localStorage.getItem("customWords") ?? "");
  }, []);

  const handleSave = () => {
    localStorage.setItem("filterWords", filterWords);
    localStorage.setItem("hideOffensive", JSON.stringify(hideOffensive));
    localStorage.setItem("customWords", customWords);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading || !user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-black pt-14 pb-20">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-4 px-4 py-6">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-zinc-400 transition-colors hover:text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-white">{t("filters.title")}</h1>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">{t("filters.filterWordsLabel")}</label>
          <textarea
            value={filterWords}
            onChange={(e) => setFilterWords(e.target.value)}
            placeholder={t("filters.filterWordsPlaceholder")}
            rows={2}
            className="w-full resize-none bg-transparent px-0 py-2 text-sm text-white placeholder-zinc-500 outline-none caret-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">{t("filters.hideOffensiveLabel")}</label>
          <button
            onClick={() => setHideOffensive(!hideOffensive)}
            className={`relative h-6 w-11 rounded-full transition-colors ${hideOffensive ? "bg-blue-600" : "bg-zinc-700"}`}
          >
            <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${hideOffensive ? "translate-x-5" : ""}`} />
          </button>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">{t("filters.customWordsLabel")}</label>
          <textarea
            value={customWords}
            onChange={(e) => setCustomWords(e.target.value)}
            placeholder={t("filters.customWordsPlaceholder")}
            rows={2}
            className="w-full resize-none bg-transparent px-0 py-2 text-sm text-white placeholder-zinc-500 outline-none caret-blue-500"
          />
        </div>

        <button
          onClick={handleSave}
          className="self-start rounded-lg bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          {saved ? t("filters.saved") : t("filters.savePreferences")}
        </button>
      </div>
    </div>
  );
}
