import { describe, expect, test } from "bun:test";

describe("Store Integration", () => {
  test("all stores can be imported without errors", () => {
    expect(() => {
      require("./gameStore");
      require("./settingsStore");
      require("./highScoreStore");
    }).not.toThrow();
  });

  test("stores have expected interfaces", () => {
    const { useGameStore } = require("./gameStore");
    const { useSettingsStore } = require("./settingsStore");
    const { useHighScoreStore } = require("./highScoreStore");

    const gameState = useGameStore.getState();
    const settingsState = useSettingsStore.getState();
    const highScoreState = useHighScoreStore.getState();

    // Verify game store structure
    expect(gameState).toHaveProperty("board");
    expect(gameState).toHaveProperty("currentPiece");
    expect(gameState).toHaveProperty("score");
    expect(gameState).toHaveProperty("moveLeft");
    expect(gameState).toHaveProperty("moveRight");
    expect(gameState).toHaveProperty("resetGame");

    // Verify settings store structure
    expect(settingsState).toHaveProperty("language");
    expect(settingsState).toHaveProperty("showGhostPiece");
    expect(settingsState).toHaveProperty("setLanguage");
    expect(settingsState).toHaveProperty("toggleGhostPiece");

    // Verify high score store structure
    expect(highScoreState).toHaveProperty("highScores");
    expect(highScoreState).toHaveProperty("addHighScore");
  });
});
