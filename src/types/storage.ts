/**
 * Storage-related type definitions for localStorage and persistence
 */

// High score entry structure
export interface HighScoreEntry {
  score: number;
  lines: number;
  level: number;
  date: string; // ISO date string
  gameTime: number; // Total game time in milliseconds
}

// Settings that persist in localStorage
export interface StoredSettings {
  language: "en" | "ja";
  showGhostPiece: boolean;
  volume: number; // 0-100 for future sound support
  difficulty: string; // Difficulty setting name
  theme: "light" | "dark"; // For future theme support
}

// Game statistics for persistence
export interface GameStatistics {
  totalGamesPlayed: number;
  totalLinesCleared: number;
  totalTimeplayed: number; // in milliseconds
  bestScore: number;
  bestLines: number;
  bestLevel: number;
  averageScore: number;
  favoriteLanguage: "en" | "ja";
}

// Storage schema versions for migration support
export interface StorageSchema {
  version: number;
  settings: StoredSettings;
  highScores: HighScoreEntry[];
  statistics: GameStatistics;
  lastUpdated: string; // ISO date string
}

// localStorage key constants
export const STORAGE_KEYS = {
  SETTINGS: "tetris-settings",
  HIGH_SCORES: "tetris-highscores",
  STATISTICS: "tetris-statistics",
  LANGUAGE: "tetris-language",
  SCHEMA_VERSION: "tetris-schema-version",
} as const;

// Type for localStorage keys
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// Default values for storage
export const DEFAULT_SETTINGS: StoredSettings = {
  language: "en",
  showGhostPiece: true,
  volume: 70,
  difficulty: "normal",
  theme: "light",
};

export const DEFAULT_STATISTICS: GameStatistics = {
  totalGamesPlayed: 0,
  totalLinesCleared: 0,
  totalTimeplayed: 0,
  bestScore: 0,
  bestLines: 0,
  bestLevel: 1,
  averageScore: 0,
  favoriteLanguage: "en",
};

// Storage validation result types
export interface StorageValidationResult<T> {
  isValid: boolean;
  data: T | null;
  errors: string[];
}

// Migration function type
export type StorageMigration = (oldData: any) => StorageSchema;
