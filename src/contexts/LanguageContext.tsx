"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import ar from "@/lib/i18n/ar";
import de from "@/lib/i18n/de";
import en from "@/lib/i18n/en";
import es from "@/lib/i18n/es";
import fr from "@/lib/i18n/fr";
import it from "@/lib/i18n/it";
import ja from "@/lib/i18n/ja";
import ko from "@/lib/i18n/ko";
import pt from "@/lib/i18n/pt";
import tr from "@/lib/i18n/tr";
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

const translations: Record<Locale, Translations> = { ar, de, en, es, fr, it, ja, ko, pt, tr };

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

const LanguageContext = createContext<LanguageContextValue>({
  locale: "es",
  setLocale: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");

  useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null;
    if (stored && availableLanguages.some((l) => l.code === stored)) {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>) => {
      const text = resolveNested(translations[locale] as unknown as Record<string, unknown>, key);
      return interpolate(text, params);
    },
    [locale],
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
