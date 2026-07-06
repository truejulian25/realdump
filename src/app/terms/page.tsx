"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

const sections: Array<{ titleKey: string; textKey: string }> = [
  { titleKey: "s1t", textKey: "s1d" },
  { titleKey: "s2t", textKey: "s2d" },
  { titleKey: "s3t", textKey: "s3d" },
  { titleKey: "s4t", textKey: "s4d" },
  { titleKey: "s5t", textKey: "s5d" },
  { titleKey: "s6t", textKey: "s6d" },
  { titleKey: "s7t", textKey: "s7d" },
];

export default function TermsPage() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col pt-14 pb-20">
      <div className="mx-auto w-full max-w-sm px-4 py-6">
        <Link href="/profile" className="mb-4 flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          {t("terms.backToProfile")}
        </Link>
        <h1 className="mb-6 text-xl font-bold text-white">{t("terms.title")}</h1>

        {sections.map((s, i) => (
          <section key={i} className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-zinc-300">{t(`terms.s${i + 1}t`)}</h2>
            <p className="text-xs text-zinc-500 leading-relaxed">{t(`terms.s${i + 1}d`)}</p>
          </section>
        ))}

        <p className="mt-8 text-xs text-zinc-600">{t("terms.lastUpdate")}</p>
      </div>
    </div>
  );
}
