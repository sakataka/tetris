import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "../locales/en.json";
import jaTranslations from "../locales/ja.json";

// Language detection logic
function detectLanguage(): string {
  // 1. Check localStorage for saved preference
  const savedLanguage = localStorage.getItem("tetris-language");
  if (savedLanguage && ["en", "ja"].includes(savedLanguage)) {
    return savedLanguage;
  }

  // 2. Check browser language
  const browserLang = navigator.language;
  if (browserLang.startsWith("ja")) {
    return "ja";
  }

  // 3. Fallback to English
  return "en";
}

// Initialize i18next
i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enTranslations,
    },
    ja: {
      translation: jaTranslations,
    },
  },
  lng: detectLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already does escaping
  },
  debug: import.meta.env.DEV, // Enable debug in development
});

// Save language preference to localStorage when language changes
i18n.on("languageChanged", (lng) => {
  localStorage.setItem("tetris-language", lng);
});

export default i18n;
