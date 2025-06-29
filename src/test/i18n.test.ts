import { beforeAll, expect, test } from "bun:test";
import "./setup";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "../locales/en.json";
import jaTranslations from "../locales/ja.json";

beforeAll(async () => {
  // Initialize i18next for testing
  await i18next.use(initReactI18next).init({
    resources: {
      en: {
        translation: enTranslations,
      },
      ja: {
        translation: jaTranslations,
      },
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });
});

test("i18n configuration loads correctly", () => {
  expect(i18next.isInitialized).toBe(true);
});

test("default language should be English", () => {
  expect(i18next.language).toBe("en");
});

test("should have English translations", () => {
  const gameTitle = i18next.getFixedT("en")("game.title");
  expect(gameTitle).toBe("Tetris");
});

test("should have Japanese translations", () => {
  const gameTitle = i18next.getFixedT("ja")("game.title");
  expect(gameTitle).toBe("テトリス");
});

test("language changing should work", async () => {
  await i18next.changeLanguage("ja");
  expect(i18next.language).toBe("ja");
  expect(i18next.t("game.title")).toBe("テトリス");

  await i18next.changeLanguage("en");
  expect(i18next.language).toBe("en");
  expect(i18next.t("game.title")).toBe("Tetris");
});

test("translation keys should be consistent between languages", () => {
  const enKeys = Object.keys(i18next.getResourceBundle("en", "translation"));
  const jaKeys = Object.keys(i18next.getResourceBundle("ja", "translation"));

  expect(enKeys.length).toBe(jaKeys.length);
  expect(enKeys.sort()).toEqual(jaKeys.sort());
});
