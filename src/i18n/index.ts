import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./fr.json";
import ar from "./ar.json";
import en from "./en.json";
import ber from "./ber.json";

export type AppLang = "fr" | "ar" | "en" | "ber" | "zgh";

export const LANGS: { code: AppLang; label: string; native: string }[] = [
  { code: "fr", label: "French", native: "Français" },
  { code: "ar", label: "Arabic", native: "العربية" },
  { code: "en", label: "English", native: "English" },
  { code: "ber", label: "Tamazight", native: "Tamazight" },
];

export const RTL_LANGS: AppLang[] = ["ar"];

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      fr: { translation: fr },
      ar: { translation: ar },
      en: { translation: en },
      ber: { translation: ber },
      // Profile.language sometimes stored as "zgh" — alias to Tamazight
      zgh: { translation: ber },
    },
    lng: "fr",
    fallbackLng: "fr",
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
  await i18n.changeLanguage(lang);
  applyDir(lang);
}

export default i18n;
