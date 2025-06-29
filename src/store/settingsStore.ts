import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import i18n from "@/i18n/config";

export interface SettingsState {
  language: "en" | "ja";
  showGhostPiece: boolean;
}

export interface SettingsActions {
  setLanguage: (language: "en" | "ja") => void;
  toggleGhostPiece: () => void;
}

export interface SettingsStore extends SettingsState, SettingsActions {}

// Validation functions for settings
const isValidLanguage = (lang: string): lang is "en" | "ja" => {
  return ["en", "ja"].includes(lang);
};

const validateSettings = (settings: any): SettingsState => {
  const defaultSettings: SettingsState = {
    language: "en",
    showGhostPiece: true,
  };

  if (!settings || typeof settings !== "object") {
    return defaultSettings;
  }

  return {
    language: isValidLanguage(settings.language) ? settings.language : defaultSettings.language,
    showGhostPiece:
      typeof settings.showGhostPiece === "boolean"
        ? settings.showGhostPiece
        : defaultSettings.showGhostPiece,
  };
};

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        language: "en",
        showGhostPiece: true,

        // Actions
        setLanguage: (language: "en" | "ja") => {
          set({ language });
          // Update i18n language
          i18n.changeLanguage(language);
        },

        toggleGhostPiece: () => {
          set((state) => ({
            showGhostPiece: !state.showGhostPiece,
          }));
        },
      }),
      {
        name: "tetris-settings",
        // Custom storage with validation
        storage: {
          getItem: (name) => {
            try {
              const value = localStorage.getItem(name);
              if (!value) return null;

              const parsed = JSON.parse(value);
              return {
                state: validateSettings(parsed.state),
                version: parsed.version,
              };
            } catch (error) {
              console.warn("Failed to load settings from localStorage:", error);
              return null;
            }
          },
          setItem: (name, value) => {
            try {
              localStorage.setItem(name, JSON.stringify(value));
            } catch (error) {
              console.warn("Failed to save settings to localStorage:", error);
            }
          },
          removeItem: (name) => {
            try {
              localStorage.removeItem(name);
            } catch (error) {
              console.warn("Failed to remove settings from localStorage:", error);
            }
          },
        },
        // Initialize with current i18n language
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Sync i18n with stored language
            i18n.changeLanguage(state.language);
          }
        },
      }
    ),
    {
      name: "settings-store",
    }
  )
);
