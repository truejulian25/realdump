"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Translations } from "@/lib/i18n/es";

export const availableLanguages = [
  { code: "ar" as const, nativeName: "العربية", englishName: "Arabic" },
  { code: "de" as const, nativeName: "Deutsch", englishName: "German" },
  { code: "en" as const, nativeName: "English", englishName: "English" },
  { code: "es" as const, nativeName: "Español", englishName: "Spanish" },
  { code: "fr" as const, nativeName: "Français", englishName: "French" },
  { code: "it" as const, nativeName: "Italiano", englishName: "Italian" },
  { code: "ja" as const, nativeName: "日本語", englishName: "Japanese" },
  { code: "ko" as const, nativeName: "한국어", englishName: "Korean" },
  { code: "pt" as const, nativeName: "Português", englishName: "Portuguese" },
  { code: "tr" as const, nativeName: "Türkçe", englishName: "Turkish" },
];

export type Locale = (typeof availableLanguages)[number]["code"];

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

function resolveNested(obj: Record<string, unknown>, key: string): string {
  const parts = key.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  if (typeof current === "string") return current;
  return key;
}

function interpolate(text: string, params?: Record<string, string>): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? `{${key}}`);
}

const loaders: Record<Locale, () => Promise<{ default: Translations }>> = {
  ar: () => import("@/lib/i18n/ar"),
  de: () => import("@/lib/i18n/de"),
  en: () => import("@/lib/i18n/en"),
  es: () => import("@/lib/i18n/es"),
  fr: () => import("@/lib/i18n/fr"),
  it: () => import("@/lib/i18n/it"),
  ja: () => import("@/lib/i18n/ja"),
  ko: () => import("@/lib/i18n/ko"),
  pt: () => import("@/lib/i18n/pt"),
  tr: () => import("@/lib/i18n/tr"),
};

const LanguageContext = createContext<LanguageContextValue>({
  locale: "es",
  setLocale: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");
  const [translations, setTranslations] = useState<Translations | null>(null);

  const loadLocale = useCallback(async (newLocale: Locale) => {
    const mod = await loaders[newLocale]();
    setTranslations(mod.default);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null;
    const initial = stored && availableLanguages.some((l) => l.code === stored) ? stored : "es";
    setLocaleState(initial);
    loadLocale(initial);
  }, [loadLocale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
    loadLocale(newLocale);
  }, [loadLocale]);

  const t = useCallback(
    (key: string, params?: Record<string, string>) => {
      if (!translations) return key;
      const text = resolveNested(translations as unknown as Record<string, unknown>, key);
      return interpolate(text, params);
    },
    [translations],
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
