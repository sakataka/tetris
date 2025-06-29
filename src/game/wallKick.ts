/**
 * Super Rotation System (SRS) Wall Kick Implementation
 * Provides wall kick data and rotation logic for Tetris pieces
 */

import type {
  GameBoardWithBuffer,
  Position,
  RotationState,
  Tetromino,
  TetrominoTypeName,
} from "@/types/game";
import { isValidPosition } from "./board";
import { moveTetromino, setTetrominoRotation } from "./tetrominos";

// Wall kick offset data for standard pieces (J, L, T, S, Z)
export const WALL_KICK_DATA: Record<string, Position[]> = {
  // Clockwise rotations
  "0->1": [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: -1, y: 1 },
    { x: 0, y: -2 },
    { x: -1, y: -2 },
  ],
  "1->2": [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: -1 },
    { x: 0, y: 2 },
    { x: 1, y: 2 },
  ],
  "2->3": [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: -2 },
    { x: 1, y: -2 },
  ],
  "3->0": [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: -1, y: -1 },
    { x: 0, y: 2 },
    { x: -1, y: 2 },
  ],

  // Counter-clockwise rotations
  "1->0": [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: -1 },
    { x: 0, y: 2 },
    { x: 1, y: 2 },
  ],
  "2->1": [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: -1, y: 1 },
    { x: 0, y: -2 },
    { x: -1, y: -2 },
  ],
  "3->2": [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: -1, y: -1 },
    { x: 0, y: 2 },
    { x: -1, y: 2 },
  ],
  "0->3": [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: -2 },
    { x: 1, y: -2 },
  ],
} as const;

// Wall kick offset data for I-piece (has different kick behavior)
export const WALL_KICK_DATA_I: Record<string, Position[]> = {
  // Clockwise rotations
  "0->1": [
    { x: 0, y: 0 },
    { x: -2, y: 0 },
    { x: 1, y: 0 },
    { x: -2, y: -1 },
    { x: 1, y: 2 },
  ],
  "1->2": [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: 2, y: 0 },
    { x: -1, y: 2 },
    { x: 2, y: -1 },
  ],
  "2->3": [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: -1, y: 0 },
    { x: 2, y: 1 },
    { x: -1, y: -2 },
  ],
  "3->0": [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: -2, y: 0 },
    { x: 1, y: -2 },
    { x: -2, y: 1 },
  ],

  // Counter-clockwise rotations
  "1->0": [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: -1, y: 0 },
    { x: 2, y: 1 },
    { x: -1, y: -2 },
  ],
  "2->1": [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: -2, y: 0 },
    { x: 1, y: -2 },
    { x: -2, y: 1 },
  ],
  "3->2": [
    { x: 0, y: 0 },
    { x: -2, y: 0 },
    { x: 1, y: 0 },
    { x: -2, y: -1 },
    { x: 1, y: 2 },
  ],
  "0->3": [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: 2, y: 0 },
    { x: -1, y: 2 },
    { x: 2, y: -1 },
  ],
} as const;

/**
 * Gets the appropriate wall kick data for a piece type and rotation transition
 * @param pieceType - Type of tetromino
 * @param fromRotation - Current rotation state
 * @param toRotation - Target rotation state
 * @returns Array of wall kick offset positions to try
 */
export function getWallKickData(
  pieceType: TetrominoTypeName,
  fromRotation: RotationState,
  toRotation: RotationState
): Position[] {
  // O-piece never rotates
  if (pieceType === "O") {
    return [];
  }

  // Create transition key
  const transitionKey = `${fromRotation}->${toRotation}`;

  // Select appropriate wall kick data based on piece type
  const wallKickData = pieceType === "I" ? WALL_KICK_DATA_I : WALL_KICK_DATA;

  // Return the kick data for this transition, or empty array if invalid
  return wallKickData[transitionKey] || [];
}

/**
 * Attempts to rotate a tetromino with wall kick system
 * Tries each wall kick offset until a valid position is found
 * @param board - Current game board (with buffer area)
 * @param piece - Tetromino to rotate
 * @param targetRotation - Desired rotation state
 * @returns New rotated tetromino if successful, null if impossible
 */
export function tryRotateWithWallKick(
  board: GameBoardWithBuffer,
  piece: Tetromino,
  targetRotation: RotationState
): Tetromino | null {
  // O-piece special case: return same piece without rotation
  if (piece.type === "O") {
    return { ...piece };
  }

  // Normalize target rotation to 0-3 range
  const normalizedTarget = (((targetRotation % 4) + 4) % 4) as RotationState;

  // If already at target rotation, return piece unchanged
  if (piece.rotation === normalizedTarget) {
    return { ...piece };
  }

  // Get wall kick offsets for this rotation transition
  const kickOffsets = getWallKickData(piece.type, piece.rotation, normalizedTarget);

  // If no wall kick data available, return null
  if (kickOffsets.length === 0) {
    return null;
  }

  // Create the rotated piece first
  const rotatedPiece = setTetrominoRotation(piece, normalizedTarget);

  // Try each wall kick offset in order
  for (const offset of kickOffsets) {
    const testPosition: Position = {
      x: piece.position.x + offset.x,
      y: piece.position.y + offset.y,
    };

    // Create test piece with new position
    const testPiece = moveTetromino(rotatedPiece, testPosition);

    // Check if this position is valid
    if (isValidPosition(board, testPiece.shape, testPosition)) {
      return testPiece;
    }
  }

  // No valid position found
  return null;
}

/**
 * Attempts to rotate a tetromino clockwise with wall kick
 * @param board - Current game board (with buffer area)
 * @param piece - Tetromino to rotate
 * @returns New rotated tetromino if successful, null if impossible
 */
export function tryRotateClockwise(board: GameBoardWithBuffer, piece: Tetromino): Tetromino | null {
  const targetRotation = ((piece.rotation + 1) % 4) as RotationState;
  return tryRotateWithWallKick(board, piece, targetRotation);
}

/**
 * Attempts to rotate a tetromino counter-clockwise with wall kick
 * @param board - Current game board (with buffer area)
 * @param piece - Tetromino to rotate
 * @returns New rotated tetromino if successful, null if impossible
 */
export function tryRotateCounterClockwise(
  board: GameBoardWithBuffer,
  piece: Tetromino
): Tetromino | null {
  const targetRotation = ((piece.rotation - 1 + 4) % 4) as RotationState;
  return tryRotateWithWallKick(board, piece, targetRotation);
}

/**
 * Checks if a rotation is theoretically possible (has wall kick data)
 * @param pieceType - Type of tetromino
 * @param fromRotation - Current rotation state
 * @param toRotation - Target rotation state
 * @returns True if wall kick data exists for this transition
 */
export function canRotate(
  pieceType: TetrominoTypeName,
  fromRotation: RotationState,
  toRotation: RotationState
): boolean {
  if (pieceType === "O") {
    return false; // O-piece never rotates
  }

  const kickData = getWallKickData(pieceType, fromRotation, toRotation);
  return kickData.length > 0;
}

/**
 * Gets all valid rotation states for a piece type
 * @param pieceType - Type of tetromino
 * @returns Array of valid rotation states
 */
export function getValidRotationStates(pieceType: TetrominoTypeName): RotationState[] {
  if (pieceType === "O") {
    return [0]; // O-piece only has one effective rotation state
  }

  return [0, 1, 2, 3];
}

/**
 * Validates that wall kick data is complete and symmetric
 * @returns Object containing validation results
 */
export function validateWallKickData(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Expected transitions for all pieces except O
  const expectedTransitions = [
    "0->1",
    "1->2",
    "2->3",
    "3->0", // Clockwise
    "1->0",
    "2->1",
    "3->2",
    "0->3", // Counter-clockwise
  ];

  // Check standard piece wall kick data
  for (const transition of expectedTransitions) {
    if (!WALL_KICK_DATA[transition]) {
      errors.push(`Missing standard wall kick data for transition: ${transition}`);
    } else if (WALL_KICK_DATA[transition].length !== 5) {
      errors.push(
        `Standard wall kick data for ${transition} should have 5 offsets, has ${WALL_KICK_DATA[transition].length}`
      );
    }
  }

  // Check I-piece wall kick data
  for (const transition of expectedTransitions) {
    if (!WALL_KICK_DATA_I[transition]) {
      errors.push(`Missing I-piece wall kick data for transition: ${transition}`);
    } else if (WALL_KICK_DATA_I[transition].length !== 5) {
      errors.push(
        `I-piece wall kick data for ${transition} should have 5 offsets, has ${WALL_KICK_DATA_I[transition].length}`
      );
    }
  }

  // Check that first offset is always [0,0]
  for (const transition of expectedTransitions) {
    const standardData = WALL_KICK_DATA[transition];
    const iData = WALL_KICK_DATA_I[transition];

    if (standardData && (standardData[0].x !== 0 || standardData[0].y !== 0)) {
      errors.push(`Standard wall kick data for ${transition} should start with [0,0]`);
    }

    if (iData && (iData[0].x !== 0 || iData[0].y !== 0)) {
      errors.push(`I-piece wall kick data for ${transition} should start with [0,0]`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Debug utility to analyze wall kick attempts
 * @param board - Current game board
 * @param piece - Tetromino to analyze
 * @param targetRotation - Target rotation state
 * @returns Detailed analysis of each wall kick attempt
 */
export function analyzeWallKickAttempts(
  board: GameBoardWithBuffer,
  piece: Tetromino,
  targetRotation: RotationState
): {
  transition: string;
  kickOffsets: Position[];
  attempts: Array<{
    offset: Position;
    testPosition: Position;
    isValid: boolean;
  }>;
  result: Tetromino | null;
} {
  const transition = `${piece.rotation}->${targetRotation}`;
  const kickOffsets = getWallKickData(piece.type, piece.rotation, targetRotation);
  const attempts: Array<{
    offset: Position;
    testPosition: Position;
    isValid: boolean;
  }> = [];

  // If O-piece, return early
  if (piece.type === "O") {
    return {
      transition,
      kickOffsets: [],
      attempts: [],
      result: { ...piece },
    };
  }

  const rotatedPiece = setTetrominoRotation(piece, targetRotation);

  // Analyze each wall kick attempt
  for (const offset of kickOffsets) {
    const testPosition: Position = {
      x: piece.position.x + offset.x,
      y: piece.position.y + offset.y,
    };

    const testPiece = moveTetromino(rotatedPiece, testPosition);
    const isValid = isValidPosition(board, testPiece.shape, testPosition);

    attempts.push({
      offset,
      testPosition,
      isValid,
    });

    // If this attempt succeeded, we can stop here for the actual result
    if (isValid) {
      break;
    }
  }

  const result = tryRotateWithWallKick(board, piece, targetRotation);

  return {
    transition,
    kickOffsets,
    attempts,
    result,
  };
}
