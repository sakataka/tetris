import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface HighScoreEntry {
  score: number;
  lines: number;
  level: number;
  date: string; // YYYY-MM-DD format
}

export interface HighScoreState {
  highScores: HighScoreEntry[];
}

export interface HighScoreActions {
  addHighScore: (entry: Omit<HighScoreEntry, "date">) => void;
}

export interface HighScoreStore extends HighScoreState, HighScoreActions {}

// Utility functions
const formatDate = (): string => {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
};

const sortByScoreDescending = (a: HighScoreEntry, b: HighScoreEntry): number => {
  return b.score - a.score;
};

const validateHighScoreData = (data: any): HighScoreEntry[] => {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter((entry): entry is HighScoreEntry => {
    return (
      typeof entry === "object" &&
      entry !== null &&
      typeof entry.score === "number" &&
      typeof entry.lines === "number" &&
      typeof entry.level === "number" &&
      typeof entry.date === "string"
    );
  });
};

export const useHighScoreStore = create<HighScoreStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        highScores: [],

        // Actions
        addHighScore: (entry: Omit<HighScoreEntry, "date">) => {
          set((state) => {
            const newEntry: HighScoreEntry = {
              ...entry,
              date: formatDate(),
            };

            const updatedScores = [...state.highScores, newEntry]
              .sort(sortByScoreDescending)
              .slice(0, 10); // Keep only top 10 scores

            return {
              highScores: updatedScores,
            };
          });
        },
      }),
      {
        name: "tetris-highscores",
        // Custom storage with validation
        storage: {
          getItem: (name) => {
            try {
              const value = localStorage.getItem(name);
              if (!value) return null;

              const parsed = JSON.parse(value);
              return {
                state: {
                  highScores: validateHighScoreData(parsed.state?.highScores),
                },
                version: parsed.version,
              };
            } catch (error) {
              console.warn("Failed to load high scores from localStorage:", error);
              return null;
            }
          },
          setItem: (name, value) => {
            try {
              localStorage.setItem(name, JSON.stringify(value));
            } catch (error) {
              console.warn("Failed to save high scores to localStorage:", error);
            }
          },
          removeItem: (name) => {
            try {
              localStorage.removeItem(name);
            } catch (error) {
              console.warn("Failed to remove high scores from localStorage:", error);
            }
          },
        },
      }
    ),
    {
      name: "high-score-store",
    }
  )
);
