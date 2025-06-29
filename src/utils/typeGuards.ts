/**
 * Type guard and validation functions for Tetris game types
 * Provides runtime type checking and validation
 */

import type { CellValue, RotationState, TetrominoTypeName } from "@/types/game";

/**
 * Type guard to check if a value is a valid CellValue (0-7)
 * @param value - Value to check
 * @returns True if value is a valid CellValue
 */
export function isValidCellValue(value: unknown): value is CellValue {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 7;
}

/**
 * Type guard to check if a value is a valid RotationState (0-3)
 * @param value - Value to check
 * @returns True if value is a valid RotationState
 */
export function isValidRotationState(value: unknown): value is RotationState {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 3;
}

/**
 * Normalizes any number to a valid rotation state (0-3)
 * Handles positive, negative, and decimal values
 * @param rotation - Rotation value to normalize
 * @returns Normalized rotation state (0-3)
 */
export function normalizeRotationState(rotation: number): RotationState {
  // Handle decimal values - floor for positive, ceil for negative
  // This provides intuitive rotation behavior
  const intRotation = rotation >= 0 ? Math.floor(rotation) : Math.ceil(rotation);

  // Use modulo with proper handling for negative numbers
  // JavaScript modulo can return negative values, so we need to normalize
  let normalized = ((intRotation % 4) + 4) % 4;

  // Handle the -0 case to ensure we return 0 instead of -0
  if (normalized === 0) {
    normalized = 0;
  }

  return normalized as RotationState;
}

/**
 * Type guard to check if a value is a valid TetrominoTypeName
 * @param value - Value to check
 * @returns True if value is a valid TetrominoTypeName
 */
export function isValidTetrominoType(value: unknown): value is TetrominoTypeName {
  return typeof value === "string" && ["I", "O", "T", "S", "Z", "J", "L"].includes(value);
}

/**
 * Validates if a position is within valid board bounds
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param boardWidth - Board width (default 10)
 * @param boardHeight - Board height (default 24 including buffer)
 * @returns True if position is within bounds
 */
export function isValidBoardPosition(
  x: number,
  y: number,
  boardWidth: number = 10,
  boardHeight: number = 24
): boolean {
  return (
    typeof x === "number" &&
    typeof y === "number" &&
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= 0 &&
    x < boardWidth &&
    y >= 0 &&
    y < boardHeight
  );
}

/**
 * Validates if a 2D array represents a valid tetromino shape
 * @param shape - 2D array to validate
 * @returns True if shape is valid
 */
export function isValidTetrominoShape(shape: unknown): shape is number[][] {
  if (!Array.isArray(shape)) return false;
  if (shape.length === 0) return false;

  // Check each row
  for (const row of shape) {
    if (!Array.isArray(row)) return false;
    if (row.length === 0) return false;

    // Check each cell in row
    for (const cell of row) {
      if (typeof cell !== "number" || !Number.isInteger(cell) || cell < 0 || cell > 1) {
        return false;
      }
    }

    // All rows must have same length
    if (row.length !== shape[0].length) return false;
  }

  return true;
}
