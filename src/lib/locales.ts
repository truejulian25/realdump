export const availableLanguages = [
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

export const DEFAULT_LOCALE: Locale = "en";

const COUNTRY_TO_LOCALE: Record<string, Locale> = {
  US: "en", GB: "en", AU: "en", NZ: "en", IE: "en", CA: "en", IN: "en",
  SG: "en", MY: "en", PH: "en", NG: "en", GH: "en", KE: "en", ZA: "en",
  JM: "en", TT: "en", UG: "en", TZ: "en", PK: "en", AE: "en", NL: "en",
  SE: "en", NO: "en", DK: "en", FI: "en", IS: "en", EE: "en", LV: "en",
  LT: "en", PL: "en", CZ: "en", SK: "en", HU: "en", RO: "en", BG: "en",
  GR: "en", HR: "en", SI: "en", RS: "en", UA: "en", IL: "en", EG: "en",
  SA: "en", QA: "en", KW: "en", OM: "en", BH: "en", JO: "en", LB: "en",
  ES: "es", MX: "es", AR: "es", CO: "es", PE: "es", VE: "es", CL: "es",
  EC: "es", BO: "es", UY: "es", PY: "es", GT: "es", HN: "es", SV: "es",
  NI: "es", CR: "es", PA: "es", DO: "es", CU: "es", PR: "es", GQ: "es",
  DE: "de", AT: "de", LI: "de",
  FR: "fr", BE: "fr", MC: "fr", LU: "fr", CI: "fr", SN: "fr", CM: "fr",
  ML: "fr", MG: "fr", BF: "fr", BJ: "fr", TG: "fr", CD: "fr", MA: "fr",
  IT: "it", SM: "it", CH: "de",
  JP: "ja",
  KR: "ko",
  PT: "pt", BR: "pt", AO: "pt", MZ: "pt", CV: "pt", GW: "pt", ST: "pt", TL: "pt",
  TR: "tr", CY: "tr",
};

export function countryToLocale(country: string | null | undefined): Locale | null {
  if (!country) return null;
  return COUNTRY_TO_LOCALE[country.toUpperCase()] ?? null;
}

export function browserToLocale(language: string | null | undefined): Locale | null {
  if (!language) return null;
  const primary = language.split("-")[0].toLowerCase();
  const match = availableLanguages.find((l) => l.code === primary);
  return match ? match.code : null;
}

export function resolveAutoLocale(country?: string | null, browserLanguage?: string | null): Locale {
  return countryToLocale(country) ?? browserToLocale(browserLanguage) ?? DEFAULT_LOCALE;
}
