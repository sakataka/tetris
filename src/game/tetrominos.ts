/**
 * Tetromino definitions and operations
 * All functions are pure - they don't modify input parameters
 */

import type { CellValue, RotationState, Tetromino, TetrominoTypeName } from "../types/game";
import { COLOR_CONSTANTS } from "../utils/gameConstants";
import { getSpawnPosition } from "./board";

// Tetromino color mapping
export const TETROMINO_COLOR_MAP = {
  I: COLOR_CONSTANTS.I_PIECE,
  O: COLOR_CONSTANTS.O_PIECE,
  T: COLOR_CONSTANTS.T_PIECE,
  S: COLOR_CONSTANTS.S_PIECE,
  Z: COLOR_CONSTANTS.Z_PIECE,
  J: COLOR_CONSTANTS.J_PIECE,
  L: COLOR_CONSTANTS.L_PIECE,
} as const;

// Tetromino shape definitions (1 = filled, 0 = empty)
export const TETROMINO_SHAPES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
} as const;

/**
 * Gets the shape matrix for a tetromino type
 * @param pieceType - Type of tetromino
 * @returns Deep copy of the shape matrix
 */
export function getTetrominoShape(pieceType: TetrominoTypeName): number[][] {
  const shape = TETROMINO_SHAPES[pieceType];

  // Return deep copy to prevent mutations
  return shape.map((row) => [...row]);
}

/**
 * Gets the color index for a tetromino type
 * @param pieceType - Type of tetromino
 * @returns Color index for the piece
 */
export function getTetrominoColorIndex(pieceType: TetrominoTypeName): CellValue {
  return TETROMINO_COLOR_MAP[pieceType];
}

/**
 * Rotates a tetromino shape 90 degrees clockwise
 * @param shape - Original shape matrix
 * @returns New rotated shape matrix
 */
export function rotateTetromino(shape: number[][]): number[][] {
  if (!shape || shape.length === 0) {
    return [];
  }

  const rows = shape.length;
  const cols = shape[0].length;

  // Create new matrix with swapped dimensions
  const rotated: number[][] = Array(cols)
    .fill(null)
    .map(() => Array(rows).fill(0));

  // Rotate 90 degrees clockwise: (x, y) -> (y, rows-1-x)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      rotated[x][rows - 1 - y] = shape[y][x];
    }
  }

  return rotated;
}

/**
 * Rotates a shape by the specified number of 90-degree clockwise steps
 * @param shape - Original shape matrix
 * @param steps - Number of 90-degree clockwise rotations
 * @returns Rotated shape matrix
 */
export function rotateTetrominoBySteps(shape: number[][], steps: number): number[][] {
  let rotated = shape.map((row) => [...row]); // Deep copy

  // Normalize steps to 0-3 range
  const normalizedSteps = ((steps % 4) + 4) % 4;

  for (let i = 0; i < normalizedSteps; i++) {
    rotated = rotateTetromino(rotated);
  }

  return rotated;
}

/**
 * Creates a new tetromino at spawn position
 * @param pieceType - Type of tetromino to create
 * @param rotation - Initial rotation state (default: 0)
 * @returns New tetromino object
 */
export function createTetromino(
  pieceType: TetrominoTypeName,
  rotation: RotationState = 0
): Tetromino {
  // Get base shape and rotate it to desired state
  const baseShape = getTetrominoShape(pieceType);
  const rotatedShape = rotateTetrominoBySteps(baseShape, rotation);

  // Get spawn position for this piece type
  const position = getSpawnPosition(pieceType);

  return {
    type: pieceType,
    position,
    rotation,
    shape: rotatedShape,
  };
}

/**
 * Creates a copy of a tetromino with a new position
 * @param tetromino - Original tetromino
 * @param newPosition - New position
 * @returns New tetromino with updated position
 */
export function moveTetromino(
  tetromino: Tetromino,
  newPosition: { x: number; y: number }
): Tetromino {
  return {
    ...tetromino,
    position: { ...newPosition },
  };
}

/**
 * Creates a copy of a tetromino with a new rotation
 * @param tetromino - Original tetromino
 * @param newRotation - New rotation state
 * @returns New tetromino with updated rotation and shape
 */
export function setTetrominoRotation(tetromino: Tetromino, newRotation: RotationState): Tetromino {
  const baseShape = getTetrominoShape(tetromino.type);
  const rotatedShape = rotateTetrominoBySteps(baseShape, newRotation);

  return {
    ...tetromino,
    rotation: newRotation,
    shape: rotatedShape,
  };
}

/**
 * Gets the bounding box dimensions of a tetromino shape
 * @param shape - Tetromino shape matrix
 * @returns Object with width and height of the bounding box
 */
export function getShapeBounds(shape: number[][]): { width: number; height: number } {
  if (!shape || shape.length === 0) {
    return { width: 0, height: 0 };
  }

  let minX = shape[0].length;
  let maxX = -1;
  let minY = shape.length;
  let maxY = -1;

  // Find bounds of non-zero cells
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x] !== 0) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX === -1) {
    // No non-zero cells found
    return { width: 0, height: 0 };
  }

  return {
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

/**
 * Checks if a shape is symmetric (same after rotation)
 * @param shape - Tetromino shape matrix
 * @returns True if shape is symmetric
 */
export function isShapeSymmetric(shape: number[][]): boolean {
  const rotated = rotateTetromino(shape);

  if (shape.length !== rotated.length || shape[0].length !== rotated[0].length) {
    return false;
  }

  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x] !== rotated[y][x]) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Gets all rotation states for a tetromino type
 * @param pieceType - Type of tetromino
 * @returns Array of all 4 rotation states
 */
export function getAllRotationStates(pieceType: TetrominoTypeName): number[][][] {
  const baseShape = getTetrominoShape(pieceType);
  const rotations: number[][][] = [];

  let currentShape = baseShape;
  for (let i = 0; i < 4; i++) {
    rotations.push(currentShape.map((row) => [...row])); // Deep copy
    currentShape = rotateTetromino(currentShape);
  }

  return rotations;
}
