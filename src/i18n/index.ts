import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./fr.json";
import ar from "./ar.json";
import en from "./en.json";

export type AppLang = "en" | "fr" | "ar" | "darija";

/** Languages offered in the picker / toggle. */
export const LANGS: {
  code: AppLang;
  label: string;
  native: string;
  comingSoon?: boolean;
}[] = [
  { code: "en", label: "English", native: "English" },
  { code: "fr", label: "French", native: "Français" },
  { code: "ar", label: "Arabic", native: "العربية" },
  { code: "darija", label: "Darija", native: "الدارجة", comingSoon: true },
];

export const ACTIVE_LANGS: AppLang[] = LANGS.filter((l) => !l.comingSoon).map(
  (l) => l.code,
);

export const RTL_LANGS: AppLang[] = ["ar", "darija"];

/**
 * Map any stored profile.language value (including legacy "ber"/"zgh"
 * and the not-yet-shipped "darija") to a language we can actually render.
 */
export function normalizeLang(value?: string | null): AppLang {
  if (!value) return "en";
  if (value === "en" || value === "fr" || value === "ar") return value;
  // Legacy Tamazight values and the upcoming Darija fall back to English
  // until proper translations ship.
  return "en";
}

/**
 * Missing-translation policy.
 *
 * We never silently mix English into a French or Arabic screen. When a key is
 * missing we record it (so it can be exported for translators) and render an
 * intentional localized fallback string instead of raw English.
 */
const missingKeys = new Set<string>();

export function recordMissingKey(lng: string, key: string) {
  const id = `${lng}:${key}`;
  if (missingKeys.has(id)) return;
  missingKeys.add(id);
  if (typeof console !== "undefined") {
    console.warn(`[i18n] missing translation ${id}`);
  }
}

export function missingTranslationKeys(): string[] {
  return [...missingKeys];
}

/** Intentional, localized placeholder — never English inside an ar/fr screen. */
const FALLBACK_TEXT: Record<string, string> = {
  en: "Not available yet",
  fr: "Bientôt disponible",
  ar: "غير متوفر بعد",
};

export function localizedFallback(lng: string): string {
  return FALLBACK_TEXT[lng] ?? FALLBACK_TEXT.en;
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      ar: { translation: ar },
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    returnNull: false,
    saveMissing: true,
    parseMissingKeyHandler: (key: string) => {
      recordMissingKey(i18n.language, key);
      return localizedFallback(i18n.language);
    },
    missingKeyHandler: (lngs: readonly string[], _ns: string, key: string) => {
      recordMissingKey(lngs?.[0] ?? i18n.language, key);
    },
  });
}

export function applyDir(lang: string) {
  if (typeof document === "undefined") return;
  const isRtl = RTL_LANGS.includes(lang as AppLang);
  document.documentElement.dir = isRtl ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}

export async function setAppLanguage(lang: AppLang) {
  const safe = normalizeLang(lang);
  await i18n.changeLanguage(safe);
  applyDir(safe);
}

export default i18n;
