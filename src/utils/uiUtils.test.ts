/**
 * UI utility functions tests
 * Tests for UI calculation and helper functions
 */

import { describe, expect, test } from "bun:test";
import type { CellValue, TetrominoTypeName } from "@/types/game";

// Import the functions we'll test (they don't exist yet - TDD approach)
import {
  calculateAnimationDuration,
  calculateBoardDimensions,
  calculateCellSize,
  calculateGridSize,
  combineClassNames,
  generateBoardClassName,
  generateCellClassName,
  generatePieceClassName,
  getAnimationEasing,
  getGhostCellStyle,
  getResponsiveSize,
  getSpringConfig,
  getTetrominoColor,
  getTetrominoDisplayColor,
  isDesktopSize,
  isMobileSize,
} from "./uiUtils";

describe("Color mapping functions", () => {
  test("getTetrominoColor should return correct color for each piece type", () => {
    expect(getTetrominoColor("I")).toBe("#00f5ff"); // Cyan
    expect(getTetrominoColor("O")).toBe("#ffff00"); // Yellow
    expect(getTetrominoColor("T")).toBe("#a000f0"); // Purple
    expect(getTetrominoColor("S")).toBe("#00ff00"); // Green
    expect(getTetrominoColor("Z")).toBe("#ff0000"); // Red
    expect(getTetrominoColor("J")).toBe("#0000ff"); // Blue
    expect(getTetrominoColor("L")).toBe("#ff8000"); // Orange
  });

  test("getTetrominoDisplayColor should return color for cell value", () => {
    expect(getTetrominoDisplayColor(0)).toBe("transparent"); // Empty
    expect(getTetrominoDisplayColor(1)).toBe("#00f5ff"); // I piece
    expect(getTetrominoDisplayColor(2)).toBe("#ffff00"); // O piece
    expect(getTetrominoDisplayColor(3)).toBe("#a000f0"); // T piece
    expect(getTetrominoDisplayColor(4)).toBe("#00ff00"); // S piece
    expect(getTetrominoDisplayColor(5)).toBe("#ff0000"); // Z piece
    expect(getTetrominoDisplayColor(6)).toBe("#0000ff"); // J piece
    expect(getTetrominoDisplayColor(7)).toBe("#ff8000"); // L piece
  });

  test("getTetrominoDisplayColor should handle invalid cell values", () => {
    expect(getTetrominoDisplayColor(8 as CellValue)).toBe("transparent");
    expect(getTetrominoDisplayColor(-1 as CellValue)).toBe("transparent");
  });

  test("getTetrominoColor should handle invalid piece types gracefully", () => {
    expect(() => getTetrominoColor("X" as TetrominoTypeName)).toThrow();
  });
});

describe("Grid size calculations", () => {
  test("calculateCellSize should return correct size for screen width", () => {
    // Mobile sizes
    expect(calculateCellSize(320)).toBe(24); // Small mobile
    expect(calculateCellSize(375)).toBe(28); // iPhone SE
    expect(calculateCellSize(414)).toBe(32); // iPhone Plus

    // Tablet/Desktop sizes
    expect(calculateCellSize(768)).toBe(30); // Tablet
    expect(calculateCellSize(1024)).toBe(30); // Desktop
    expect(calculateCellSize(1920)).toBe(30); // Large desktop
  });

  test("calculateBoardDimensions should return correct board size", () => {
    const cellSize = 30;
    const dimensions = calculateBoardDimensions(cellSize);

    expect(dimensions.width).toBe(300); // 10 cells * 30px
    expect(dimensions.height).toBe(600); // 20 cells * 30px
    expect(dimensions.cellSize).toBe(30);
  });

  test("calculateGridSize should return correct dimensions for piece preview", () => {
    // 3x3 grid for most pieces
    expect(calculateGridSize("T", 24)).toEqual({ width: 72, height: 72 });
    expect(calculateGridSize("S", 24)).toEqual({ width: 72, height: 72 });
    expect(calculateGridSize("Z", 24)).toEqual({ width: 72, height: 72 });
    expect(calculateGridSize("J", 24)).toEqual({ width: 72, height: 72 });
    expect(calculateGridSize("L", 24)).toEqual({ width: 72, height: 72 });

    // 4x4 grid for I piece
    expect(calculateGridSize("I", 24)).toEqual({ width: 96, height: 96 });

    // 2x2 grid for O piece
    expect(calculateGridSize("O", 24)).toEqual({ width: 48, height: 48 });
  });

  test("calculateGridSize should handle different cell sizes", () => {
    expect(calculateGridSize("T", 30)).toEqual({ width: 90, height: 90 });
    expect(calculateGridSize("I", 20)).toEqual({ width: 80, height: 80 });
    expect(calculateGridSize("O", 15)).toEqual({ width: 30, height: 30 });
  });
});

describe("Responsive breakpoint utilities", () => {
  test("isDesktopSize should correctly identify desktop sizes", () => {
    expect(isDesktopSize(768)).toBe(true); // Breakpoint
    expect(isDesktopSize(1024)).toBe(true);
    expect(isDesktopSize(1920)).toBe(true);
    expect(isDesktopSize(767)).toBe(false);
    expect(isDesktopSize(320)).toBe(false);
  });

  test("isMobileSize should correctly identify mobile sizes", () => {
    expect(isMobileSize(767)).toBe(true);
    expect(isMobileSize(320)).toBe(true);
    expect(isMobileSize(414)).toBe(true);
    expect(isMobileSize(768)).toBe(false);
    expect(isMobileSize(1024)).toBe(false);
  });

  test("getResponsiveSize should return appropriate size for device", () => {
    const mobileSize = 16;
    const desktopSize = 24;

    expect(getResponsiveSize(320, mobileSize, desktopSize)).toBe(16);
    expect(getResponsiveSize(767, mobileSize, desktopSize)).toBe(16);
    expect(getResponsiveSize(768, mobileSize, desktopSize)).toBe(24);
    expect(getResponsiveSize(1024, mobileSize, desktopSize)).toBe(24);
  });

  test("getResponsiveSize should handle edge cases", () => {
    expect(getResponsiveSize(0, 10, 20)).toBe(10);
    expect(getResponsiveSize(-1, 10, 20)).toBe(10);
  });
});

describe("Animation timing calculations", () => {
  test("calculateAnimationDuration should return correct duration for different events", () => {
    expect(calculateAnimationDuration("lineClear")).toBe(200);
    expect(calculateAnimationDuration("pieceLock")).toBe(100);
    expect(calculateAnimationDuration("scoreChange")).toBe(500);
    expect(calculateAnimationDuration("levelUp")).toBe(800);
  });

  test("calculateAnimationDuration should handle speed multipliers", () => {
    expect(calculateAnimationDuration("lineClear", 2)).toBe(100); // Half speed
    expect(calculateAnimationDuration("scoreChange", 0.5)).toBe(1000); // Double duration
    expect(calculateAnimationDuration("pieceLock", 1.5)).toBe(67); // 1.5x speed
  });

  test("calculateAnimationDuration should handle invalid animation types", () => {
    expect(() => calculateAnimationDuration("invalid" as any)).toThrow();
  });

  test("getAnimationEasing should return correct easing for animation types", () => {
    expect(getAnimationEasing("smooth")).toBe("cubic-bezier(0.215, 0.61, 0.355, 1)");
    expect(getAnimationEasing("balanced")).toBe("cubic-bezier(0.455, 0.03, 0.515, 0.955)");
    expect(getAnimationEasing("bouncy")).toBe("cubic-bezier(0.175, 0.885, 0.32, 1.275)");
  });

  test("getSpringConfig should return correct spring configuration", () => {
    const config = getSpringConfig("default");
    expect(config).toEqual({ tension: 300, friction: 30 });

    const customConfig = getSpringConfig("stiff");
    expect(customConfig.tension).toBeGreaterThan(300);

    const softConfig = getSpringConfig("soft");
    expect(softConfig.tension).toBeLessThan(300);
  });
});

describe("CSS class generation utilities", () => {
  test("generateCellClassName should create correct CSS class for cell states", () => {
    expect(generateCellClassName("empty")).toBe("cell cell--empty");
    expect(generateCellClassName("filled", 1)).toBe("cell cell--filled cell--piece-1");
    expect(generateCellClassName("ghost", 3)).toBe("cell cell--ghost cell--piece-3");
    expect(generateCellClassName("clearing", 2)).toBe("cell cell--clearing cell--piece-2");
  });

  test("generateCellClassName should handle different piece colors", () => {
    expect(generateCellClassName("filled", 1)).toContain("cell--piece-1");
    expect(generateCellClassName("filled", 7)).toContain("cell--piece-7");
  });

  test("generateCellClassName should handle missing piece type for non-filled cells", () => {
    expect(generateCellClassName("empty")).toBe("cell cell--empty");
    expect(generateCellClassName("ghost")).toBe("cell cell--ghost");
  });

  test("generateBoardClassName should create correct CSS class for board states", () => {
    expect(generateBoardClassName("playing")).toBe("board board--playing");
    expect(generateBoardClassName("paused")).toBe("board board--paused");
    expect(generateBoardClassName("gameOver")).toBe("board board--game-over");
  });

  test("generatePieceClassName should create correct CSS class for piece states", () => {
    expect(generatePieceClassName("T", "current")).toBe("piece piece--T piece--current");
    expect(generatePieceClassName("I", "ghost")).toBe("piece piece--I piece--ghost");
    expect(generatePieceClassName("O", "locked")).toBe("piece piece--O piece--locked");
  });

  test("combineClassNames should properly combine multiple class names", () => {
    expect(combineClassNames("base", "modifier")).toBe("base modifier");
    expect(combineClassNames("base", "modifier", "state")).toBe("base modifier state");
    expect(combineClassNames("base", undefined, "state")).toBe("base state");
    expect(combineClassNames("base", "", "state")).toBe("base state");
    expect(combineClassNames()).toBe("");
  });

  test("combineClassNames should handle conditional classes", () => {
    expect(combineClassNames("base", true && "active")).toBe("base active");
    expect(combineClassNames("base", false && "active")).toBe("base");
    expect(combineClassNames("base", null && "active")).toBe("base");
  });
});

describe("Ghost piece styling", () => {
  test("getGhostCellStyle should return correct style object", () => {
    const style = getGhostCellStyle("#00f5ff");

    expect(style.opacity).toBe(0.3);
    expect(style.borderStyle).toBe("dashed");
    expect(style.borderWidth).toBe(2);
    expect(style.borderColor).toBe("#00f5ff");
    expect(style.backgroundColor).toBe("transparent");
  });

  test("getGhostCellStyle should handle different colors", () => {
    const redStyle = getGhostCellStyle("#ff0000");
    expect(redStyle.borderColor).toBe("#ff0000");

    const blueStyle = getGhostCellStyle("#0000ff");
    expect(blueStyle.borderColor).toBe("#0000ff");
  });

  test("getGhostCellStyle should handle transparency", () => {
    const style = getGhostCellStyle("transparent");
    expect(style.borderColor).toBe("transparent");
  });
});
