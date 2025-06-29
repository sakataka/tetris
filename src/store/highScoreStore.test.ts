import { beforeEach, describe, expect, test } from "bun:test";
import { useHighScoreStore } from "./highScoreStore";

// Reset store state before each test
const resetStore = () => {
  useHighScoreStore.setState({
    highScores: [],
  });
};

describe("HighScoreStore", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("Initial State", () => {
    test("should initialize with empty high scores list", () => {
      const store = useHighScoreStore.getState();
      expect(store.highScores).toEqual([]);
      expect(store.highScores).toHaveLength(0);
    });
  });

  describe("Adding High Scores", () => {
    test("addHighScore() should add a new score entry", () => {
      const store = useHighScoreStore.getState();
      const scoreEntry = {
        score: 1000,
        lines: 10,
        level: 2,
      };

      store.addHighScore(scoreEntry);
      const updatedStore = useHighScoreStore.getState();
      expect(updatedStore.highScores).toHaveLength(1);
      expect(updatedStore.highScores[0].score).toBe(1000);
      expect(updatedStore.highScores[0].lines).toBe(10);
      expect(updatedStore.highScores[0].level).toBe(2);
      expect(updatedStore.highScores[0].date).toBeDefined();
    });

    test("should automatically add date to score entries", () => {
      const store = useHighScoreStore.getState();
      const scoreEntry = {
        score: 1500,
        lines: 15,
        level: 3,
      };

      store.addHighScore(scoreEntry);
      const updatedStore = useHighScoreStore.getState();
      const today = new Date().toISOString().split("T")[0];
      expect(updatedStore.highScores[0].date).toBe(today);
    });
  });

  describe("Score Sorting", () => {
    test("should sort high scores by score descending", () => {
      const store = useHighScoreStore.getState();
      const scores = [
        { score: 1000, lines: 10, level: 2 },
        { score: 2000, lines: 20, level: 3 },
        { score: 500, lines: 5, level: 1 },
      ];

      scores.forEach((score) => store.addHighScore(score));
      const updatedStore = useHighScoreStore.getState();

      expect(updatedStore.highScores).toHaveLength(3);
      expect(updatedStore.highScores[0].score).toBe(2000); // Highest first
      expect(updatedStore.highScores[1].score).toBe(1000);
      expect(updatedStore.highScores[2].score).toBe(500); // Lowest last
    });
  });

  describe("High Score List Limitation", () => {
    test("should maintain only top 10 scores", () => {
      const store = useHighScoreStore.getState();

      // Add 12 scores
      for (let i = 1; i <= 12; i++) {
        store.addHighScore({
          score: i * 100,
          lines: i,
          level: Math.ceil(i / 10),
        });
      }

      const updatedStore = useHighScoreStore.getState();
      expect(updatedStore.highScores).toHaveLength(10);
      expect(updatedStore.highScores[0].score).toBe(1200); // Highest score
      expect(updatedStore.highScores[9].score).toBe(300); // 10th highest score
    });
  });

  describe("Basic Functionality", () => {
    test("should handle zero scores", () => {
      const store = useHighScoreStore.getState();
      const scoreEntry = {
        score: 0,
        lines: 0,
        level: 1,
      };

      expect(() => store.addHighScore(scoreEntry)).not.toThrow();
      const updatedStore = useHighScoreStore.getState();
      expect(updatedStore.highScores[0].score).toBe(0);
    });
  });
});
