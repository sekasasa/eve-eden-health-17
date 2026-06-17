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
