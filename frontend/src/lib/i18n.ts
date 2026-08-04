import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";
import th from "../locales/th.json";

export const STORAGE_KEY = "eventqr-language";
export type Language = "en" | "th";

function getInitialLanguage(): Language {
  if (typeof window === "undefined") {
    return "en";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "th") {
    return stored;
  }

  return navigator.language.toLowerCase().startsWith("th") ? "th" : "en";
}

void i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    th: { translation: th },
  },
  lng: getInitialLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export function setLanguage(language: Language) {
  window.localStorage.setItem(STORAGE_KEY, language);
  void i18next.changeLanguage(language);
}

export default i18next;
