import { beforeEach, expect, test } from "bun:test";
import "./setup";

// Test language detection logic
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

beforeEach(() => {
  // Clear localStorage before each test
  localStorage.clear();

  // Reset navigator.language to default
  Object.defineProperty(navigator, "language", {
    writable: true,
    value: "en-US",
  });
});

test("should fallback to English when no preferences set", () => {
  const language = detectLanguage();
  expect(language).toBe("en");
});

test("should use localStorage preference when available", () => {
  localStorage.setItem("tetris-language", "ja");
  const language = detectLanguage();
  expect(language).toBe("ja");
});

test("should ignore invalid localStorage language", () => {
  localStorage.setItem("tetris-language", "fr");
  const language = detectLanguage();
  expect(language).toBe("en");
});

test("should detect Japanese browser language", () => {
  Object.defineProperty(navigator, "language", {
    writable: true,
    value: "ja-JP",
  });
  const language = detectLanguage();
  expect(language).toBe("ja");
});

test("should detect Japanese browser language with variant", () => {
  Object.defineProperty(navigator, "language", {
    writable: true,
    value: "ja",
  });
  const language = detectLanguage();
  expect(language).toBe("ja");
});

test("should fallback to English for non-Japanese browser language", () => {
  Object.defineProperty(navigator, "language", {
    writable: true,
    value: "fr-FR",
  });
  const language = detectLanguage();
  expect(language).toBe("en");
});

test("localStorage preference should override browser language", () => {
  Object.defineProperty(navigator, "language", {
    writable: true,
    value: "ja-JP",
  });
  localStorage.setItem("tetris-language", "en");
  const language = detectLanguage();
  expect(language).toBe("en");
});
