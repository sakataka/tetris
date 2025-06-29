/**
 * Scoring and line clearing system implementation
 * All functions are pure - they don't modify input parameters
 */

import type { GameBoard } from "../types/game";
import { BOARD_CONSTANTS, SCORING_CONSTANTS, TIMING_CONSTANTS } from "../utils/gameConstants";

/**
 * Calculates score based on number of lines cleared and current level
 * @param linesCleared - Number of lines cleared (0-4)
 * @param level - Current game level
 * @returns Score points awarded
 */
export function calculateScore(linesCleared: number, level: number): number {
  // Validate inputs
  if (linesCleared < 0 || linesCleared >= SCORING_CONSTANTS.BASE_SCORES.length) {
    return 0;
  }

  if (level <= 0) {
    return 0;
  }

  // Get base score and multiply by level
  const baseScore = SCORING_CONSTANTS.BASE_SCORES[linesCleared];
  return baseScore * level;
}

/**
 * Calculates current level based on total lines cleared
 * @param totalLines - Total number of lines cleared in the game
 * @returns Current level (starting from 1)
 */
export function calculateLevel(totalLines: number): number {
  if (totalLines < 0) {
    return SCORING_CONSTANTS.STARTING_LEVEL;
  }

  return (
    Math.floor(totalLines / SCORING_CONSTANTS.LINES_PER_LEVEL) + SCORING_CONSTANTS.STARTING_LEVEL
  );
}

/**
 * Calculates fall speed (drop interval) based on current level
 * @param level - Current game level
 * @returns Drop interval in milliseconds
 */
export function calculateFallSpeed(level: number): number {
  const speed =
    TIMING_CONSTANTS.INITIAL_DROP_SPEED - (level - 1) * TIMING_CONSTANTS.SPEED_DECREASE_PER_LEVEL;

  return Math.max(TIMING_CONSTANTS.MIN_DROP_SPEED, speed);
}

/**
 * Detects which lines are completed (filled) on the board
 * @param board - Game board to check
 * @returns Array of completed line indices in ascending order
 */
export function detectCompletedLines(board: GameBoard): number[] {
  const completedLines: number[] = [];

  for (let y = 0; y < board.length; y++) {
    const row = board[y];

    // Check if row is completely filled (no empty cells)
    const isComplete = row.every((cell) => cell !== 0);

    if (isComplete) {
      completedLines.push(y);
    }
  }

  // Return in ascending order (should already be sorted due to loop order)
  return completedLines.sort((a, b) => a - b);
}

/**
 * Clears specified lines from the board and shifts remaining lines down
 * @param board - Original game board
 * @param linesToClear - Array of line indices to clear
 * @returns Tuple of [new board, number of lines cleared]
 */
export function clearLines(board: GameBoard, linesToClear: number[]): [GameBoard, number] {
  if (linesToClear.length === 0) {
    // Return deep copy of original board when no lines to clear
    return [board.map((row) => [...row]), 0];
  }

  // Create set for faster lookup
  const linesToClearSet = new Set(linesToClear);
  const newBoard: GameBoard = Array(BOARD_CONSTANTS.HEIGHT)
    .fill(null)
    .map(() => Array(BOARD_CONSTANTS.WIDTH).fill(0));

  // Copy non-cleared rows, shifting them down
  let newY = 0; // Start from bottom of new board

  for (let y = 0; y < board.length; y++) {
    if (!linesToClearSet.has(y)) {
      // Copy the row to new position
      newBoard[newY] = [...board[y]];
      newY++;
    }
  }

  // Remaining rows at the top are already filled with zeros

  return [newBoard, linesToClear.length];
}

/**
 * Creates a test board with specified pattern
 * Used for testing purposes - fills board from top down
 * @param pattern - Array of rows, where each row is a 10-element array
 * @returns Complete game board (20x10)
 */
export function createTestBoard(pattern: number[][]): GameBoard {
  const board: GameBoard = [];

  // Fill board with empty rows first
  for (let y = 0; y < BOARD_CONSTANTS.HEIGHT; y++) {
    board.push(Array(BOARD_CONSTANTS.WIDTH).fill(0));
  }

  // Apply pattern from top down
  // Board indices: 0 = bottom, 19 = top
  // Pattern is given from top to bottom, so reverse mapping
  for (let i = 0; i < pattern.length; i++) {
    const y = BOARD_CONSTANTS.HEIGHT - 1 - i; // Start from top (19) and go down
    if (y >= 0 && y < BOARD_CONSTANTS.HEIGHT) {
      board[y] = [...pattern[i]];
    }
  }

  return board;
}

/**
 * Checks if a specific line is complete (all cells filled)
 * @param row - Board row to check
 * @returns True if row is completely filled
 */
export function isLineComplete(row: number[]): boolean {
  return row.every((cell) => cell !== 0);
}

/**
 * Counts the total number of filled cells in a line
 * @param row - Board row to count
 * @returns Number of filled cells
 */
export function countFilledCells(row: number[]): number {
  return row.filter((cell) => cell !== 0).length;
}

/**
 * Gets the line clear type based on number of lines cleared
 * @param linesCleared - Number of lines cleared
 * @returns Line clear type name
 */
export function getLineClearType(linesCleared: number): string {
  switch (linesCleared) {
    case 1:
      return "single";
    case 2:
      return "double";
    case 3:
      return "triple";
    case 4:
      return "tetris";
    default:
      return "none";
  }
}

/**
 * Processes a complete line clearing operation
 * Detects completed lines, clears them, and returns statistics
 * @param board - Current game board
 * @returns Object with new board, cleared lines info, and statistics
 */
export function processLineClear(board: GameBoard): {
  newBoard: GameBoard;
  linesCleared: number;
  clearedLineIndices: number[];
  lineClearType: string;
} {
  const clearedLineIndices = detectCompletedLines(board);
  const [newBoard, linesCleared] = clearLines(board, clearedLineIndices);
  const lineClearType = getLineClearType(linesCleared);

  return {
    newBoard,
    linesCleared,
    clearedLineIndices,
    lineClearType,
  };
}

/**
 * Calculates comprehensive scoring information for a line clear
 * @param linesCleared - Number of lines cleared
 * @param level - Current game level
 * @param totalLines - Total lines cleared before this action
 * @returns Complete scoring information
 */
export function calculateComprehensiveScore(
  linesCleared: number,
  level: number,
  totalLines: number
): {
  score: number;
  newLevel: number;
  newTotalLines: number;
  leveledUp: boolean;
  lineClearType: string;
} {
  const score = calculateScore(linesCleared, level);
  const newTotalLines = totalLines + linesCleared;
  const newLevel = calculateLevel(newTotalLines);
  const leveledUp = newLevel > level;
  const lineClearType = getLineClearType(linesCleared);

  return {
    score,
    newLevel,
    newTotalLines,
    leveledUp,
    lineClearType,
  };
}
