"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import es from "@/lib/i18n/es";
import type { Translations } from "@/lib/i18n/es";
import {
  availableLanguages,
  countryToLocale,
  resolveAutoLocale,
  type Locale,
} from "@/lib/locales";

interface LanguageContextValue {
  locale: Locale;
  mode: "auto" | "manual";
  setLocale: (locale: Locale) => void;
  resetToAuto: () => void;
  t: <T = string>(key: string, params?: Record<string, string>) => T;
}

function resolveNested(obj: Record<string, unknown>, key: string): unknown {
  const parts = key.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return current;
}

function interpolate(text: string, params?: Record<string, string>): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? `{${key}}`);
}

const loaders: Record<Locale, () => Promise<{ default: Translations }>> = {
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
  mode: "auto",
  setLocale: () => {},
  resetToAuto: () => {},
  t: <T = string>(key: string) => key as T,
});

export function LanguageProvider({
  children,
  initialCountry,
}: {
  children: ReactNode;
  initialCountry?: string | null;
}) {
  const [locale, setLocaleState] = useState<Locale>(
    () => countryToLocale(initialCountry) ?? "en",
  );
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [translations, setTranslations] = useState<Translations>(es);

  const loadLocale = useCallback(async (newLocale: Locale) => {
    const mod = await loaders[newLocale]();
    setTranslations(mod.default);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = "ltr";
  }, [locale]);

  useEffect(() => {
    const storedMode = localStorage.getItem("locale_mode");
    if (storedMode === "manual") {
      const stored = localStorage.getItem("locale") as Locale | null;
      if (stored && availableLanguages.some((l) => l.code === stored)) {
        setMode("manual");
        setLocaleState(stored);
        loadLocale(stored);
        return;
      }
    }
    setMode("auto");
    const auto = resolveAutoLocale(initialCountry, navigator.language);
    setLocaleState(auto);
    loadLocale(auto);
  }, [initialCountry, loadLocale]);

  const setLocale = useCallback(
    (newLocale: Locale) => {
      setMode("manual");
      setLocaleState(newLocale);
      localStorage.setItem("locale", newLocale);
      localStorage.setItem("locale_mode", "manual");
      loadLocale(newLocale);
    },
    [loadLocale],
  );

  const resetToAuto = useCallback(() => {
    setMode("auto");
    localStorage.removeItem("locale");
    localStorage.setItem("locale_mode", "auto");
    const auto = resolveAutoLocale(initialCountry, navigator.language);
    setLocaleState(auto);
    loadLocale(auto);
  }, [initialCountry, loadLocale]);

  const t = useCallback(
    <T = string>(key: string, params?: Record<string, string>): T => {
      const value = resolveNested(translations as unknown as Record<string, unknown>, key);
      if (typeof value === "string") return interpolate(value, params) as unknown as T;
      return value as unknown as T;
    },
    [translations],
  );

  return (
    <LanguageContext.Provider value={{ locale, mode, setLocale, resetToAuto, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export { availableLanguages, type Locale };
