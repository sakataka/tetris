/**
 * UI utility functions for Tetris game
 * Functions for color mapping, grid calculations, responsive design, and animations
 */

import type { CellValue, TetrominoTypeName } from "@/types/game";
import {
  ANIMATION_CONSTANTS,
  BOARD_CONSTANTS,
  COLOR_CONSTANTS,
  GHOST_PIECE_CONSTANTS,
  PIECE_COLORS,
  TETROMINO_CONSTANTS,
  TIMING_CONSTANTS,
  UI_CONSTANTS,
} from "./gameConstants";

// Type definitions for UI utilities
export type CellState = "empty" | "filled" | "ghost" | "clearing";
export type BoardState = "playing" | "paused" | "gameOver";
export type PieceState = "current" | "ghost" | "locked";
export type AnimationType = "lineClear" | "pieceLock" | "scoreChange" | "levelUp";
export type EasingType = "smooth" | "balanced" | "bouncy";
export type SpringType = "default" | "stiff" | "soft";

/**
 * Gets the CSS color value for a tetromino type
 * @param pieceType - Type of tetromino
 * @returns CSS color string
 */
export function getTetrominoColor(pieceType: TetrominoTypeName): string {
  const colorMap: Record<TetrominoTypeName, string> = {
    I: PIECE_COLORS[COLOR_CONSTANTS.I_PIECE],
    O: PIECE_COLORS[COLOR_CONSTANTS.O_PIECE],
    T: PIECE_COLORS[COLOR_CONSTANTS.T_PIECE],
    S: PIECE_COLORS[COLOR_CONSTANTS.S_PIECE],
    Z: PIECE_COLORS[COLOR_CONSTANTS.Z_PIECE],
    J: PIECE_COLORS[COLOR_CONSTANTS.J_PIECE],
    L: PIECE_COLORS[COLOR_CONSTANTS.L_PIECE],
  };

  const color = colorMap[pieceType];
  if (!color) {
    throw new Error(`Invalid piece type: ${pieceType}`);
  }

  return color;
}

/**
 * Gets the CSS color value for a cell value
 * @param cellValue - Cell value (0-7)
 * @returns CSS color string
 */
export function getTetrominoDisplayColor(cellValue: CellValue): string {
  if (cellValue < 0 || cellValue >= Object.keys(PIECE_COLORS).length) {
    return PIECE_COLORS[COLOR_CONSTANTS.EMPTY];
  }

  return PIECE_COLORS[cellValue] || PIECE_COLORS[COLOR_CONSTANTS.EMPTY];
}

/**
 * Calculates appropriate cell size based on screen width
 * @param screenWidth - Screen width in pixels
 * @returns Cell size in pixels
 */
export function calculateCellSize(screenWidth: number): number {
  if (screenWidth < 375) {
    return 24; // Small mobile
  } else if (screenWidth < 414) {
    return 28; // Medium mobile
  } else if (screenWidth < UI_CONSTANTS.MOBILE_BREAKPOINT) {
    return 32; // Large mobile
  } else {
    return BOARD_CONSTANTS.CELL_SIZE; // Desktop (30px)
  }
}

/**
 * Calculates board dimensions based on cell size
 * @param cellSize - Size of each cell in pixels
 * @returns Object with board width, height, and cell size
 */
export function calculateBoardDimensions(cellSize: number): {
  width: number;
  height: number;
  cellSize: number;
} {
  return {
    width: BOARD_CONSTANTS.WIDTH * cellSize,
    height: BOARD_CONSTANTS.HEIGHT * cellSize,
    cellSize,
  };
}

/**
 * Calculates grid size for piece preview based on piece type
 * @param pieceType - Type of tetromino
 * @param cellSize - Size of each cell in pixels
 * @returns Object with grid width and height
 */
export function calculateGridSize(
  pieceType: TetrominoTypeName,
  cellSize: number
): { width: number; height: number } {
  let gridSize: number;

  switch (pieceType) {
    case "I":
      gridSize = 4; // I piece needs 4x4 grid
      break;
    case "O":
      gridSize = 2; // O piece needs 2x2 grid
      break;
    default:
      gridSize = 3; // T, S, Z, J, L pieces need 3x3 grid
      break;
  }

  return {
    width: gridSize * cellSize,
    height: gridSize * cellSize,
  };
}

/**
 * Checks if screen width is considered desktop size
 * @param screenWidth - Screen width in pixels
 * @returns True if desktop size
 */
export function isDesktopSize(screenWidth: number): boolean {
  return screenWidth >= UI_CONSTANTS.MOBILE_BREAKPOINT;
}

/**
 * Checks if screen width is considered mobile size
 * @param screenWidth - Screen width in pixels
 * @returns True if mobile size
 */
export function isMobileSize(screenWidth: number): boolean {
  return screenWidth < UI_CONSTANTS.MOBILE_BREAKPOINT;
}

/**
 * Gets responsive size based on screen width
 * @param screenWidth - Screen width in pixels
 * @param mobileSize - Size for mobile devices
 * @param desktopSize - Size for desktop devices
 * @returns Appropriate size for the device
 */
export function getResponsiveSize(
  screenWidth: number,
  mobileSize: number,
  desktopSize: number
): number {
  return isDesktopSize(screenWidth) ? desktopSize : mobileSize;
}

/**
 * Calculates animation duration for different events
 * @param animationType - Type of animation
 * @param speedMultiplier - Speed multiplier (default: 1)
 * @returns Duration in milliseconds
 */
export function calculateAnimationDuration(
  animationType: AnimationType,
  speedMultiplier: number = 1
): number {
  const baseDurations: Record<AnimationType, number> = {
    lineClear: TIMING_CONSTANTS.LINE_CLEAR_DURATION,
    pieceLock: TIMING_CONSTANTS.PIECE_LOCK_DELAY,
    scoreChange: TIMING_CONSTANTS.SCORE_ANIMATION_DURATION,
    levelUp: TIMING_CONSTANTS.LEVEL_UP_ANIMATION_DURATION,
  };

  const baseDuration = baseDurations[animationType];
  if (baseDuration === undefined) {
    throw new Error(`Invalid animation type: ${animationType}`);
  }

  return Math.round(baseDuration / speedMultiplier);
}

/**
 * Gets CSS easing function for animation type
 * @param easingType - Type of easing
 * @returns CSS easing function string
 */
export function getAnimationEasing(easingType: EasingType): string {
  const easingMap: Record<EasingType, string> = {
    smooth: ANIMATION_CONSTANTS.EASE_OUT_CUBIC,
    balanced: ANIMATION_CONSTANTS.EASE_IN_OUT_QUAD,
    bouncy: ANIMATION_CONSTANTS.EASE_OUT_BACK,
  };

  return easingMap[easingType];
}

/**
 * Gets spring configuration for Framer Motion animations
 * @param springType - Type of spring animation
 * @returns Spring configuration object
 */
export function getSpringConfig(springType: SpringType): { tension: number; friction: number } {
  const baseConfig = ANIMATION_CONSTANTS.SPRING_CONFIG;

  switch (springType) {
    case "stiff":
      return { tension: baseConfig.tension * 1.5, friction: baseConfig.friction * 1.2 };
    case "soft":
      return { tension: baseConfig.tension * 0.7, friction: baseConfig.friction * 0.8 };
    default:
      return { ...baseConfig };
  }
}

/**
 * Generates CSS class name for board cells
 * @param cellState - State of the cell
 * @param pieceType - Type of piece (for filled cells)
 * @returns CSS class string
 */
export function generateCellClassName(cellState: CellState, pieceType?: CellValue): string {
  let className = "cell";

  className += ` cell--${cellState}`;

  if (cellState !== "empty" && pieceType !== undefined) {
    className += ` cell--piece-${pieceType}`;
  }

  return className;
}

/**
 * Generates CSS class name for game board
 * @param boardState - State of the board
 * @returns CSS class string
 */
export function generateBoardClassName(boardState: BoardState): string {
  // Convert camelCase to kebab-case for CSS classes
  const kebabState = boardState.replace(/([A-Z])/g, "-$1").toLowerCase();
  return `board board--${kebabState}`;
}

/**
 * Generates CSS class name for tetromino pieces
 * @param pieceType - Type of tetromino
 * @param pieceState - State of the piece
 * @returns CSS class string
 */
export function generatePieceClassName(
  pieceType: TetrominoTypeName,
  pieceState: PieceState
): string {
  return `piece piece--${pieceType} piece--${pieceState}`;
}

/**
 * Combines multiple CSS class names, filtering out falsy values
 * @param classNames - Array of class names (can include undefined/null)
 * @returns Combined class string
 */
export function combineClassNames(...classNames: (string | undefined | null | false)[]): string {
  return classNames.filter(Boolean).join(" ");
}

/**
 * Gets CSS style object for ghost piece cells
 * @param color - Border color for the ghost piece
 * @returns CSS style object
 */
export function getGhostCellStyle(color: string): {
  opacity: number;
  borderStyle: string;
  borderWidth: number;
  borderColor: string;
  backgroundColor: string;
} {
  return {
    opacity: GHOST_PIECE_CONSTANTS.OPACITY,
    borderStyle: GHOST_PIECE_CONSTANTS.BORDER_STYLE,
    borderWidth: GHOST_PIECE_CONSTANTS.BORDER_WIDTH,
    borderColor: color,
    backgroundColor: "transparent",
  };
}
