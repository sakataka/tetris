/**
 * Core game state management functions
 * All functions are pure - they return new state objects without mutating inputs
 */

import type {
  GameBoardWithBuffer,
  GameState,
  LockDelayState,
  Position,
  Tetromino,
} from "../types/game";
import {
  calculateLevel,
  calculateScore,
  getDropSpeed,
  LOCK_DELAY_CONSTANTS,
  SCORING_CONSTANTS,
} from "../utils/gameConstants";
import {
  clearLines as clearLinesFromBoard,
  createEmptyBoard,
  createEmptyBoardWithBuffer,
  getVisibleBoard,
  isGameOver,
  isValidPosition,
  placeTetromino,
} from "./board";
import { createPieceBag, getNextPiece } from "./pieceBag";
import { createTetromino } from "./tetrominos";
import { tryRotateClockwise } from "./wallKick";

/**
 * Creates the initial game state
 * @returns New initial game state
 */
export function createInitialGameState(): GameState {
  // Create initial piece bag and get first pieces
  const initialBag = createPieceBag();
  const [currentPieceType, bagAfterCurrent] = getNextPiece(initialBag);
  const [nextPieceType, remainingBag] = getNextPiece(bagAfterCurrent);

  // Create current piece
  const currentPiece = createTetromino(currentPieceType);

  // Create empty boards
  const board = createEmptyBoard();
  const boardWithBuffer = createEmptyBoardWithBuffer();

  // Calculate initial game timing
  const currentTime = Date.now();
  const initialLevel = SCORING_CONSTANTS.STARTING_LEVEL;
  const dropInterval = getDropSpeed(initialLevel);

  return {
    // Board and pieces
    board,
    boardWithBuffer,
    currentPiece,
    nextPiece: nextPieceType,
    heldPiece: null,
    canHold: true,

    // Scoring and progression
    score: SCORING_CONSTANTS.BASE_SCORES[0],
    lines: 0,
    level: initialLevel,

    // Game state flags
    isGameOver: false,
    isPaused: false,
    isPlaying: false,

    // Game mechanics
    ghostPosition: null, // Will be calculated when needed
    pieceBag: remainingBag,
    lockDelay: null,

    // Timing
    lastDropTime: currentTime,
    dropInterval,
    gameStartTime: currentTime,
    totalGameTime: 0,

    // Animation states
    linesClearing: [],
    animationInProgress: false,
  };
}

/**
 * Calculates the ghost position for the current piece
 * @param board - Game board with buffer
 * @param piece - Current tetromino
 * @returns Ghost position or null if piece is invalid
 */
export function calculateGhostPosition(
  board: GameBoardWithBuffer,
  piece: Tetromino
): Position | null {
  if (!piece) {
    return null;
  }

  // Start from current piece position
  let ghostY = piece.position.y;

  // Move down until collision is detected
  while (
    isValidPosition(board, piece.shape, {
      x: piece.position.x,
      y: ghostY - 1,
    })
  ) {
    ghostY--;
  }

  return { x: piece.position.x, y: ghostY };
}

/**
 * Updates the ghost position in game state
 * @param state - Current game state
 * @returns Updated game state with new ghost position
 */
function updateGhostPosition(state: GameState): GameState {
  if (!state.currentPiece) {
    return { ...state, ghostPosition: null };
  }

  const ghostPosition = calculateGhostPosition(state.boardWithBuffer, state.currentPiece);

  return { ...state, ghostPosition };
}

/**
 * Moves a tetromino by the specified amount
 * @param state - Current game state
 * @param dx - Horizontal movement
 * @param dy - Vertical movement
 * @returns New game state with moved piece or original state if blocked
 */
export function moveTetrominoBy(state: GameState, dx: number, dy: number): GameState {
  if (!state.currentPiece || state.isGameOver || state.isPaused) {
    return state;
  }

  // Calculate new position
  const newPosition: Position = {
    x: state.currentPiece.position.x + dx,
    y: state.currentPiece.position.y + dy,
  };

  // Check if the new position is valid
  if (!isValidPosition(state.boardWithBuffer, state.currentPiece.shape, newPosition)) {
    // If downward movement is blocked, start or update lock delay
    if (dy < 0) {
      const currentTime = Date.now();

      if (!state.lockDelay) {
        // Start lock delay
        const newLockDelay: LockDelayState = {
          isActive: true,
          startTime: currentTime,
          resetCount: 0,
          lastLowestY: state.currentPiece.position.y,
        };

        return { ...state, lockDelay: newLockDelay };
      } else {
        // Check if we should force lock
        const timeExpired =
          currentTime - state.lockDelay.startTime >= LOCK_DELAY_CONSTANTS.DELAY_MS;
        const maxResetsReached = state.lockDelay.resetCount >= LOCK_DELAY_CONSTANTS.MAX_RESET_COUNT;

        if (timeExpired || maxResetsReached) {
          // Force lock the piece (this would trigger piece placement)
          return lockCurrentTetromino(state);
        }
      }
    }

    // Movement blocked, return original state
    return state;
  }

  // Create new piece with updated position
  const movedPiece: Tetromino = {
    ...state.currentPiece,
    position: newPosition,
  };

  // Create new state with moved piece
  let newState: GameState = {
    ...state,
    currentPiece: movedPiece,
  };

  // Update lock delay if active and any movement occurred
  if (state.lockDelay && (dx !== 0 || dy !== 0)) {
    const currentTime = Date.now();

    // If piece moved to a lower position, reset counter
    if (dy !== 0 && newPosition.y < state.lockDelay.lastLowestY) {
      newState.lockDelay = {
        ...state.lockDelay,
        resetCount: 0,
        lastLowestY: newPosition.y,
      };
    } else {
      // Increment reset counter for any movement/rotation during lock delay
      newState.lockDelay = {
        ...state.lockDelay,
        startTime: currentTime,
        resetCount: state.lockDelay.resetCount + 1,
      };
    }
  }

  // Update ghost position
  newState = updateGhostPosition(newState);

  return newState;
}

/**
 * Rotates the current tetromino clockwise
 * @param state - Current game state
 * @returns New game state with rotated piece or original state if blocked
 */
export function rotateTetrominoCW(state: GameState): GameState {
  if (!state.currentPiece || state.isGameOver || state.isPaused) {
    return state;
  }

  // Try to rotate with wall kick system
  const rotatedPiece = tryRotateClockwise(state.boardWithBuffer, state.currentPiece);

  // If rotation failed, return original state
  if (!rotatedPiece) {
    return state;
  }

  // Create new state with rotated piece
  let newState: GameState = {
    ...state,
    currentPiece: rotatedPiece,
  };

  // Update lock delay if active
  if (state.lockDelay) {
    const currentTime = Date.now();
    newState.lockDelay = {
      ...state.lockDelay,
      startTime: currentTime,
      resetCount: state.lockDelay.resetCount + 1,
    };
  }

  // Update ghost position
  newState = updateGhostPosition(newState);

  return newState;
}

/**
 * Performs a hard drop of the current tetromino
 * @param state - Current game state
 * @returns New game state with piece dropped to lowest position
 */
export function hardDropTetromino(state: GameState): GameState {
  if (!state.currentPiece || state.isGameOver || state.isPaused) {
    return state;
  }

  // Calculate how far the piece can drop
  let dropY = state.currentPiece.position.y;

  // Move down until collision is detected
  while (
    isValidPosition(state.boardWithBuffer, state.currentPiece.shape, {
      x: state.currentPiece.position.x,
      y: dropY - 1,
    })
  ) {
    dropY--;
  }

  // Calculate drop distance for scoring
  const dropDistance = state.currentPiece.position.y - dropY;

  // If no movement is possible, return original state
  if (dropDistance <= 0) {
    return state;
  }

  // Create piece at drop position
  const droppedPiece: Tetromino = {
    ...state.currentPiece,
    position: { x: state.currentPiece.position.x, y: dropY },
  };

  // Award points for hard drop (typically 2 points per cell dropped)
  const hardDropScore = dropDistance * 2;

  // Update state with dropped piece and score, clear lock delay
  let newState: GameState = {
    ...state,
    currentPiece: droppedPiece,
    score: state.score + hardDropScore,
    lockDelay: null, // Clear lock delay since piece will be locked immediately
  };

  // Update ghost position
  newState = updateGhostPosition(newState);

  return newState;
}

/**
 * Locks the current tetromino and spawns the next piece
 * @param state - Current game state
 * @returns New game state with piece locked and next piece spawned
 */
export function lockCurrentTetromino(state: GameState): GameState {
  if (!state.currentPiece) {
    return state;
  }

  // Place the current piece on the board
  const newBoardWithBuffer = placeTetromino(state.boardWithBuffer, state.currentPiece);

  // Get visible board for line clearing
  const visibleBoard = getVisibleBoard(newBoardWithBuffer);

  // Clear completed lines
  const [clearedBoard, clearedLineIndices] = clearLinesFromBoard(visibleBoard);

  // Update board with buffer (replace visible portion)
  const updatedBoardWithBuffer = [...newBoardWithBuffer];
  for (let i = 0; i < clearedBoard.length; i++) {
    updatedBoardWithBuffer[i] = [...clearedBoard[i]];
  }

  // Calculate score for cleared lines
  const linesCleared = clearedLineIndices.length;
  const lineScore = calculateScore(linesCleared, state.level);
  const newScore = state.score + lineScore;
  const newLines = state.lines + linesCleared;
  const newLevel = calculateLevel(newLines);

  // Get next piece from bag
  const [nextPieceType, remainingBag] = getNextPiece(state.pieceBag);
  const newCurrentPiece = createTetromino(state.nextPiece);

  // Check for game over
  const gameOver = isGameOver(updatedBoardWithBuffer, newCurrentPiece);

  // Create new state
  const newState: GameState = {
    ...state,
    board: clearedBoard,
    boardWithBuffer: updatedBoardWithBuffer,
    currentPiece: gameOver ? null : newCurrentPiece,
    nextPiece: nextPieceType,
    canHold: true, // Reset hold ability when piece locks
    score: newScore,
    lines: newLines,
    level: newLevel,
    isGameOver: gameOver,
    lockDelay: null, // Clear lock delay since piece is now locked
    dropInterval: getDropSpeed(newLevel),
    linesClearing: clearedLineIndices,
    animationInProgress: linesCleared > 0,
    pieceBag: remainingBag,
  };

  // Update ghost position for new piece
  return updateGhostPosition(newState);
}

/**
 * Checks if the current piece should be locked based on timing
 * @param state - Current game state
 * @returns True if piece should be locked
 */
export function shouldLockPiece(state: GameState): boolean {
  if (!state.lockDelay || !state.currentPiece) {
    return false;
  }

  const currentTime = Date.now();
  const timeExpired = currentTime - state.lockDelay.startTime >= LOCK_DELAY_CONSTANTS.DELAY_MS;
  const maxResetsReached = state.lockDelay.resetCount >= LOCK_DELAY_CONSTANTS.MAX_RESET_COUNT;

  return timeExpired || maxResetsReached;
}

/**
 * Processes natural piece falling due to gravity
 * @param state - Current game state
 * @returns New game state with piece moved down by gravity
 */
export function processNaturalFall(state: GameState): GameState {
  if (!state.currentPiece || state.isGameOver || state.isPaused) {
    return state;
  }

  const currentTime = Date.now();
  const timeSinceLastDrop = currentTime - state.lastDropTime;

  // Check if it's time for the piece to fall
  if (timeSinceLastDrop >= state.dropInterval) {
    const newState = moveTetrominoBy(state, 0, -1);

    // Update last drop time
    return {
      ...newState,
      lastDropTime: currentTime,
    };
  }

  return state;
}

/**
 * Holds the current piece or swaps with held piece
 * @param state - Current game state
 * @returns New game state with piece held or swapped
 */
export function holdCurrentPiece(state: GameState): GameState {
  // Cannot hold when game is over, paused, no current piece, or hold is disabled
  if (!state.currentPiece || state.isGameOver || state.isPaused || !state.canHold) {
    return state;
  }

  const currentPieceType = state.currentPiece.type;

  // Case 1: First hold (no piece currently held)
  if (state.heldPiece === null) {
    // Hold current piece and spawn next piece
    const newCurrentPiece = createTetromino(state.nextPiece);

    // Get new next piece from bag
    const [newNextPiece, remainingBag] = getNextPiece(state.pieceBag);

    // Check for game over with new current piece
    const gameOver = isGameOver(state.boardWithBuffer, newCurrentPiece);

    const newState: GameState = {
      ...state,
      currentPiece: gameOver ? null : newCurrentPiece,
      nextPiece: newNextPiece,
      heldPiece: currentPieceType,
      canHold: false, // Disable hold until piece locks
      isGameOver: gameOver,
      pieceBag: remainingBag,
    };

    // Update ghost position for new piece
    return updateGhostPosition(newState);
  }

  // Case 2: Swap with held piece
  const newCurrentPiece = createTetromino(state.heldPiece);

  // Check for game over with swapped piece
  const gameOver = isGameOver(state.boardWithBuffer, newCurrentPiece);

  const newState: GameState = {
    ...state,
    currentPiece: gameOver ? null : newCurrentPiece,
    heldPiece: currentPieceType,
    canHold: false, // Disable hold until piece locks
    isGameOver: gameOver,
    // Note: nextPiece and pieceBag remain unchanged during swap
  };

  // Update ghost position for swapped piece
  return updateGhostPosition(newState);
}
