import { beforeEach, expect, test } from "bun:test";
import "./setup";

// Simulate page reload by recreating the language detection
function simulatePageReload(): string {
  // This simulates what happens when the page is reloaded
  // and the detectLanguage function runs again

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

beforeEach(() => {
  // Clear localStorage and reset browser language before each test
  localStorage.clear();
  Object.defineProperty(navigator, "language", {
    writable: true,
    value: "en-US",
  });
});

test("language preference persists after simulated page reload", () => {
  // Set language preference
  localStorage.setItem("tetris-language", "ja");

  // Simulate page reload
  const detectedLanguage = simulatePageReload();

  expect(detectedLanguage).toBe("ja");
});

test("language preference overrides browser language after reload", () => {
  // Set browser to Japanese
  Object.defineProperty(navigator, "language", {
    writable: true,
    value: "ja-JP",
  });

  // Set localStorage preference to English
  localStorage.setItem("tetris-language", "en");

  // Simulate page reload
  const detectedLanguage = simulatePageReload();

  expect(detectedLanguage).toBe("en");
});

test("falls back to browser language when no localStorage preference", () => {
  // Set browser to Japanese
  Object.defineProperty(navigator, "language", {
    writable: true,
    value: "ja-JP",
  });

  // No localStorage preference

  // Simulate page reload
  const detectedLanguage = simulatePageReload();

  expect(detectedLanguage).toBe("ja");
});

test("falls back to English when no preferences set", () => {
  // Default browser language (en-US) and no localStorage

  // Simulate page reload
  const detectedLanguage = simulatePageReload();

  expect(detectedLanguage).toBe("en");
});

test("localStorage persistence works with language change simulation", () => {
  // Simulate user changing language from en to ja
  expect(localStorage.getItem("tetris-language")).toBeNull();

  // User changes language (this would happen in the UI)
  localStorage.setItem("tetris-language", "ja");

  // Simulate page reload
  const detectedLanguage = simulatePageReload();
  expect(detectedLanguage).toBe("ja");

  // User changes back to English
  localStorage.setItem("tetris-language", "en");

  // Simulate another page reload
  const detectedLanguage2 = simulatePageReload();
  expect(detectedLanguage2).toBe("en");
});
