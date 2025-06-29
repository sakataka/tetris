/**
 * Tests for line clearing and scoring system
 * Following TDD approach - tests written before implementation
 */

import { describe, expect, test } from "bun:test";
import { SCORING_CONSTANTS } from "../utils/gameConstants";
import { createEmptyBoard } from "./board";

// Import functions that will be implemented
import {
  calculateFallSpeed,
  calculateLevel,
  calculateScore,
  clearLines,
  createTestBoard,
  detectCompletedLines,
} from "./scoring";

describe("calculateScore", () => {
  test("should return correct base scores for line clears", () => {
    const level = 1;

    // Single line clear
    expect(calculateScore(1, level)).toBe(100);

    // Double line clear
    expect(calculateScore(2, level)).toBe(300);

    // Triple line clear
    expect(calculateScore(3, level)).toBe(500);

    // Tetris (4 lines)
    expect(calculateScore(4, level)).toBe(800);

    // No lines cleared
    expect(calculateScore(0, level)).toBe(0);
  });

  test("should multiply base score by level", () => {
    const level = 5;

    expect(calculateScore(1, level)).toBe(100 * level);
    expect(calculateScore(2, level)).toBe(300 * level);
    expect(calculateScore(3, level)).toBe(500 * level);
    expect(calculateScore(4, level)).toBe(800 * level);
  });

  test("should handle edge cases", () => {
    // Invalid line counts
    expect(calculateScore(-1, 1)).toBe(0);
    expect(calculateScore(5, 1)).toBe(0);

    // Level 0 (edge case)
    expect(calculateScore(1, 0)).toBe(0);

    // Very high level
    expect(calculateScore(1, 100)).toBe(100 * 100);
  });

  test("should match scoring constants", () => {
    for (let lines = 0; lines < SCORING_CONSTANTS.BASE_SCORES.length; lines++) {
      const level = 3;
      const expectedScore = SCORING_CONSTANTS.BASE_SCORES[lines] * level;
      expect(calculateScore(lines, level)).toBe(expectedScore);
    }
  });
});

describe("calculateLevel", () => {
  test("should start at level 1", () => {
    expect(calculateLevel(0)).toBe(SCORING_CONSTANTS.STARTING_LEVEL);
    expect(calculateLevel(5)).toBe(SCORING_CONSTANTS.STARTING_LEVEL);
    expect(calculateLevel(9)).toBe(SCORING_CONSTANTS.STARTING_LEVEL);
  });

  test("should increase level every 10 lines", () => {
    expect(calculateLevel(10)).toBe(2);
    expect(calculateLevel(15)).toBe(2);
    expect(calculateLevel(19)).toBe(2);
    expect(calculateLevel(20)).toBe(3);
    expect(calculateLevel(29)).toBe(3);
    expect(calculateLevel(30)).toBe(4);
  });

  test("should handle large line counts", () => {
    expect(calculateLevel(100)).toBe(11);
    expect(calculateLevel(250)).toBe(26);
    expect(calculateLevel(999)).toBe(100);
  });

  test("should match lines per level constant", () => {
    const testCases = [
      { lines: 0, expectedLevel: 1 },
      { lines: 10, expectedLevel: 2 },
      { lines: 50, expectedLevel: 6 },
      { lines: 100, expectedLevel: 11 },
    ];

    testCases.forEach(({ lines, expectedLevel }) => {
      expect(calculateLevel(lines)).toBe(expectedLevel);
    });
  });
});

describe("calculateFallSpeed", () => {
  test("should start at initial speed", () => {
    const level1Speed = calculateFallSpeed(1);
    expect(level1Speed).toBe(1000); // INITIAL_DROP_SPEED
  });

  test("should decrease speed per level", () => {
    expect(calculateFallSpeed(1)).toBe(1000);
    expect(calculateFallSpeed(2)).toBe(900);
    expect(calculateFallSpeed(3)).toBe(800);
    expect(calculateFallSpeed(5)).toBe(600);
    expect(calculateFallSpeed(10)).toBe(100);
  });

  test("should not go below minimum speed", () => {
    expect(calculateFallSpeed(10)).toBe(100);
    expect(calculateFallSpeed(15)).toBe(100);
    expect(calculateFallSpeed(20)).toBe(100);
    expect(calculateFallSpeed(100)).toBe(100);
  });

  test("should handle edge cases", () => {
    // Level 0 or negative (edge cases)
    expect(calculateFallSpeed(0)).toBe(1100); // Would be above initial, clamped to min
    expect(calculateFallSpeed(-1)).toBe(1200); // Would be above initial, clamped to min
  });
});

describe("detectCompletedLines", () => {
  test("should detect no completed lines on empty board", () => {
    const board = createEmptyBoard();
    const completedLines = detectCompletedLines(board);

    expect(completedLines).toEqual([]);
  });

  test("should detect single completed line", () => {
    const board = createTestBoard([
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Row 19 (top of visible)
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Row 18
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Row 17
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 16 - completed
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Row 15
    ]);

    const completedLines = detectCompletedLines(board);
    expect(completedLines).toEqual([16]);
  });

  test("should detect multiple completed lines", () => {
    const board = createTestBoard([
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Row 19
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 18 - completed
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Row 17
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 16 - completed
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 15 - completed
    ]);

    const completedLines = detectCompletedLines(board);
    expect(completedLines).toEqual([15, 16, 18]);
  });

  test("should detect Tetris (4 consecutive lines)", () => {
    const board = createTestBoard([
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 19 - completed
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 18 - completed
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 17 - completed
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 16 - completed
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Row 15
    ]);

    const completedLines = detectCompletedLines(board);
    expect(completedLines).toEqual([16, 17, 18, 19]);
  });

  test("should not detect incomplete lines", () => {
    const board = createTestBoard([
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Row 19
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // Row 18 - incomplete (missing 1 block)
      [1, 0, 1, 1, 1, 1, 1, 1, 1, 1], // Row 17 - incomplete (has gap)
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Row 16
    ]);

    const completedLines = detectCompletedLines(board);
    expect(completedLines).toEqual([]);
  });

  test("should return lines in ascending order", () => {
    const board = createTestBoard([
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 19 - completed
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Row 18
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 17 - completed
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Row 16
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 15 - completed
    ]);

    const completedLines = detectCompletedLines(board);
    expect(completedLines).toEqual([15, 17, 19]);
  });
});

describe("clearLines", () => {
  test("should return original board when no lines to clear", () => {
    const board = createEmptyBoard();
    const [newBoard, clearedCount] = clearLines(board, []);

    expect(newBoard).toEqual(board);
    expect(clearedCount).toBe(0);
  });

  test("should clear single line and shift down", () => {
    const board = createTestBoard([
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Row 19
      [2, 2, 2, 0, 0, 0, 0, 0, 0, 0], // Row 18 - has some blocks
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 17 - to be cleared
      [3, 3, 3, 3, 0, 0, 0, 0, 0, 0], // Row 16 - has some blocks
    ]);

    const [newBoard, clearedCount] = clearLines(board, [17]);

    expect(clearedCount).toBe(1);

    // Check that row 16 stays at row 16 (first non-cleared row stays in place)
    expect(newBoard[16]).toEqual([3, 3, 3, 3, 0, 0, 0, 0, 0, 0]);
    // Check that row 18 moves down to row 17 (after cleared row 17)
    expect(newBoard[17]).toEqual([2, 2, 2, 0, 0, 0, 0, 0, 0, 0]);
    // Check that row 19 is now empty (top row after clearing)
    expect(newBoard[19]).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  test("should clear multiple lines and shift down correctly", () => {
    const board = createTestBoard([
      [4, 4, 4, 0, 0, 0, 0, 0, 0, 0], // Row 19 - has some blocks
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 18 - to be cleared
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 17 - to be cleared
      [5, 5, 5, 5, 5, 0, 0, 0, 0, 0], // Row 16 - has some blocks
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 15 - to be cleared
    ]);

    const [newBoard, clearedCount] = clearLines(board, [15, 17, 18]);

    expect(clearedCount).toBe(3);

    // Row 16 should move down to row 15 (since row 15 was cleared)
    expect(newBoard[15]).toEqual([5, 5, 5, 5, 5, 0, 0, 0, 0, 0]);
    // Row 19 should move down to row 16 (since rows 15, 17, 18 were cleared)
    expect(newBoard[16]).toEqual([4, 4, 4, 0, 0, 0, 0, 0, 0, 0]);
    // Top rows should be empty
    expect(newBoard[17]).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(newBoard[18]).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(newBoard[19]).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  test("should handle Tetris (4 lines) correctly", () => {
    const board = createTestBoard([
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 19 - to be cleared
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 18 - to be cleared
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 17 - to be cleared
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 16 - to be cleared
      [6, 6, 6, 0, 0, 0, 0, 0, 0, 0], // Row 15 - has some blocks
    ]);

    const [newBoard, clearedCount] = clearLines(board, [16, 17, 18, 19]);

    expect(clearedCount).toBe(4);

    // Row 15 should stay at row 15 (only rows 16-19 were cleared)
    expect(newBoard[15]).toEqual([6, 6, 6, 0, 0, 0, 0, 0, 0, 0]);
    // All other visible rows should be empty
    expect(newBoard[16]).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(newBoard[17]).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(newBoard[18]).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(newBoard[19]).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  test("should maintain board dimensions", () => {
    const board = createEmptyBoard();
    const [newBoard] = clearLines(board, []);

    expect(newBoard.length).toBe(board.length);
    expect(newBoard[0].length).toBe(board[0].length);
  });

  test("should handle clearing bottom row", () => {
    const board = createTestBoard([
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Row 19
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Row 18
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Row 17
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Row 16
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 0 (bottom) - to be cleared
    ]);

    const [newBoard, clearedCount] = clearLines(board, [0]);

    expect(clearedCount).toBe(1);
    expect(newBoard[0]).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(newBoard[19]).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });
});

describe("line clearing integration", () => {
  test("should detect and clear lines in single operation", () => {
    const board = createTestBoard([
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Row 19
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 18 - completed
      [2, 2, 0, 0, 0, 0, 0, 0, 0, 0], // Row 17 - partial
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 16 - completed
    ]);

    const completedLines = detectCompletedLines(board);
    const [newBoard, clearedCount] = clearLines(board, completedLines);

    expect(completedLines).toEqual([16, 18]);
    expect(clearedCount).toBe(2);

    // Row 17 should move down to row 16 (since rows 16 and 18 were cleared)
    expect(newBoard[16]).toEqual([2, 2, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  test("should calculate correct score for line clears", () => {
    const testCases = [
      { lines: 1, level: 1, expectedScore: 100 },
      { lines: 2, level: 1, expectedScore: 300 },
      { lines: 3, level: 1, expectedScore: 500 },
      { lines: 4, level: 1, expectedScore: 800 },
      { lines: 1, level: 5, expectedScore: 500 },
      { lines: 4, level: 10, expectedScore: 8000 },
    ];

    testCases.forEach(({ lines, level, expectedScore }) => {
      expect(calculateScore(lines, level)).toBe(expectedScore);
    });
  });
});
