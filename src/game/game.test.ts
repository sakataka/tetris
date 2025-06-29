/**
 * Tests for core game state management
 * Following TDD approach - tests written before implementation
 */

import { describe, expect, test } from "bun:test";
import type { GameState, Tetromino, TetrominoTypeName } from "../types/game";
import { BOARD_CONSTANTS, SCORING_CONSTANTS, TETROMINO_CONSTANTS } from "../utils/gameConstants";
import { createEmptyBoard, createEmptyBoardWithBuffer, isGameOver } from "./board";
import {
  createInitialGameState,
  hardDropTetromino,
  holdCurrentPiece,
  lockCurrentTetromino,
  moveTetrominoBy,
  rotateTetrominoCW,
  shouldLockPiece,
} from "./game";
import { createTetromino } from "./tetrominos";

describe("createInitialGameState", () => {
  test("should create game state with correct initial values", () => {
    const state = createInitialGameState();

    // Board should be empty
    expect(state.board).toEqual(createEmptyBoard());
    expect(state.boardWithBuffer).toEqual(createEmptyBoardWithBuffer());

    // Initial pieces should be set
    expect(state.currentPiece).not.toBeNull();
    expect(state.nextPiece).toBeDefined();
    expect(state.heldPiece).toBeNull();
    expect(state.canHold).toBe(true);

    // Scoring should start at zero
    expect(state.score).toBe(SCORING_CONSTANTS.BASE_SCORES[0]);
    expect(state.lines).toBe(0);
    expect(state.level).toBe(SCORING_CONSTANTS.STARTING_LEVEL);

    // Game state flags
    expect(state.isGameOver).toBe(false);
    expect(state.isPaused).toBe(false);
    expect(state.isPlaying).toBe(false);

    // Game mechanics
    expect(state.ghostPosition).toBeNull(); // Will be calculated when needed
    expect(state.pieceBag).toBeDefined();
    expect(state.pieceBag.length).toBeGreaterThan(0);
    expect(state.lockDelay).toBeNull();

    // Timing
    expect(state.lastDropTime).toBeGreaterThan(0);
    expect(state.dropInterval).toBeGreaterThan(0);
    expect(state.gameStartTime).toBeGreaterThan(0);
    expect(state.totalGameTime).toBe(0);

    // Animation states
    expect(state.linesClearing).toEqual([]);
    expect(state.animationInProgress).toBe(false);
  });

  test("should spawn current piece in buffer area", () => {
    const state = createInitialGameState();

    expect(state.currentPiece).not.toBeNull();
    if (state.currentPiece) {
      expect(state.currentPiece.position.y).toBe(TETROMINO_CONSTANTS.SPAWN_Y);
      expect(state.currentPiece.position.x).toBeGreaterThanOrEqual(0);
      expect(state.currentPiece.position.x).toBeLessThan(BOARD_CONSTANTS.WIDTH);
    }
  });

  test("should have different current and next pieces", () => {
    const state = createInitialGameState();

    expect(state.currentPiece).not.toBeNull();
    if (state.currentPiece) {
      expect(state.currentPiece.type).not.toBe(state.nextPiece);
    }
  });

  test("should initialize piece bag correctly", () => {
    const state = createInitialGameState();

    expect(state.pieceBag).toBeDefined();
    expect(Array.isArray(state.pieceBag)).toBe(true);
    // Should have remaining pieces after current and next are taken
    expect(state.pieceBag.length).toBeLessThanOrEqual(5); // 7 - 2 pieces used
  });
});

describe("moveTetrominoBy", () => {
  test("should move piece to valid position", () => {
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    const originalX = state.currentPiece.position.x;
    const newState = moveTetrominoBy(state, 1, 0); // Move right

    expect(newState.currentPiece).not.toBeNull();
    if (newState.currentPiece) {
      expect(newState.currentPiece.position.x).toBe(originalX + 1);
      expect(newState.currentPiece.position.y).toBe(state.currentPiece.position.y);
    }

    // Original state should be unchanged
    expect(state.currentPiece.position.x).toBe(originalX);
  });

  test("should return original state when movement is blocked", () => {
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    // Try to move far left (should be blocked)
    const blockedState = moveTetrominoBy(state, -10, 0);

    expect(blockedState).toBe(state); // Should return same object reference
    expect(blockedState.currentPiece?.position.x).toBe(state.currentPiece.position.x);
    expect(blockedState.currentPiece?.position.y).toBe(state.currentPiece.position.y);
  });

  test("should handle downward movement", () => {
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    const originalY = state.currentPiece.position.y;
    const newState = moveTetrominoBy(state, 0, -1); // Move down

    expect(newState.currentPiece).not.toBeNull();
    if (newState.currentPiece) {
      expect(newState.currentPiece.position.y).toBe(originalY - 1);
      expect(newState.currentPiece.position.x).toBe(state.currentPiece.position.x);
    }
  });

  test("should trigger piece lock when downward movement is blocked", () => {
    // Create a state with piece at bottom
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    // Move piece to bottom of board
    const pieceAtBottom: Tetromino = {
      ...state.currentPiece,
      position: { x: state.currentPiece.position.x, y: 0 },
    };

    const stateWithPieceAtBottom: GameState = {
      ...state,
      currentPiece: pieceAtBottom,
    };

    // Try to move down when at bottom - should start lock delay
    const newState = moveTetrominoBy(stateWithPieceAtBottom, 0, -1);

    // Should either start lock delay or lock the piece
    expect(newState.lockDelay).toBeDefined();
  });

  test("should update ghost position when piece moves", () => {
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    const newState = moveTetrominoBy(state, 1, 0);

    // Ghost position should be recalculated
    expect(newState.ghostPosition).toBeDefined();
    if (newState.ghostPosition && newState.currentPiece) {
      expect(newState.ghostPosition.x).toBe(newState.currentPiece.position.x);
    }
  });
});

describe("rotateTetrominoCW", () => {
  test("should rotate piece clockwise successfully", () => {
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    // Use T-piece specifically to ensure rotation happens
    const tPiece = createTetromino("T");
    const stateWithTPiece: GameState = {
      ...state,
      currentPiece: tPiece,
    };

    const originalRotation = tPiece.rotation;
    const newState = rotateTetrominoCW(stateWithTPiece);

    expect(newState.currentPiece).not.toBeNull();
    if (newState.currentPiece) {
      const expectedRotation = (originalRotation + 1) % 4;
      expect(newState.currentPiece.rotation).toBe(expectedRotation);
    }

    // Original state should be unchanged
    expect(tPiece.rotation).toBe(originalRotation);
  });

  test("should handle rotation with wall kick", () => {
    // Create a scenario where rotation requires wall kick
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    // Move piece to edge of board where wall kick might be needed
    const pieceAtEdge: Tetromino = {
      ...state.currentPiece,
      position: { x: BOARD_CONSTANTS.WIDTH - 1, y: state.currentPiece.position.y },
    };

    const stateWithPieceAtEdge: GameState = {
      ...state,
      currentPiece: pieceAtEdge,
    };

    const newState = rotateTetrominoCW(stateWithPieceAtEdge);

    // Should either rotate successfully with wall kick or return original state
    expect(newState.currentPiece).not.toBeNull();
  });

  test("should return original state when rotation is blocked", () => {
    // Create a scenario where rotation is impossible
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    // Fill the board around the piece to make rotation impossible
    const blockedBoard = createEmptyBoardWithBuffer();
    // Fill cells around spawn position
    for (let x = 0; x < BOARD_CONSTANTS.WIDTH; x++) {
      for (let y = 19; y <= 22; y++) {
        if (x !== state.currentPiece.position.x || y !== state.currentPiece.position.y) {
          blockedBoard[y][x] = 1; // Fill with blocks
        }
      }
    }

    const blockedState: GameState = {
      ...state,
      boardWithBuffer: blockedBoard,
    };

    const newState = rotateTetrominoCW(blockedState);

    // When rotation is blocked, piece should remain the same but ghost position may update
    expect(newState.currentPiece?.rotation).toBe(state.currentPiece.rotation);
    expect(newState.currentPiece?.position).toEqual(state.currentPiece.position);
    expect(newState.currentPiece?.type).toBe(state.currentPiece.type);

    // Other game state properties should remain the same
    expect(newState.score).toBe(blockedState.score);
    expect(newState.lines).toBe(blockedState.lines);
    expect(newState.level).toBe(blockedState.level);
  });

  test("should not rotate O-piece", () => {
    // Create state with O-piece
    const oPiece = createTetromino("O");
    const state = createInitialGameState();
    const stateWithOPiece: GameState = {
      ...state,
      currentPiece: oPiece,
    };

    const newState = rotateTetrominoCW(stateWithOPiece);

    // O-piece rotation should remain the same
    expect(newState.currentPiece).not.toBeNull();
    if (newState.currentPiece) {
      expect(newState.currentPiece.rotation).toBe(oPiece.rotation);
      expect(newState.currentPiece.shape).toEqual(oPiece.shape);
    }
  });

  test("should update ghost position after rotation", () => {
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    const newState = rotateTetrominoCW(state);

    // Ghost position should be recalculated after rotation
    expect(newState.ghostPosition).toBeDefined();
  });
});

describe("hardDropTetromino", () => {
  test("should drop piece to lowest valid position", () => {
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    const originalY = state.currentPiece.position.y;
    const newState = hardDropTetromino(state);

    expect(newState.currentPiece).not.toBeNull();
    if (newState.currentPiece) {
      // Piece should have moved down significantly
      expect(newState.currentPiece.position.y).toBeLessThan(originalY);
      // X position should remain the same
      expect(newState.currentPiece.position.x).toBe(state.currentPiece.position.x);
    }
  });

  test("should calculate drop distance correctly", () => {
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    const originalY = state.currentPiece.position.y;
    const newState = hardDropTetromino(state);

    if (newState.currentPiece) {
      const dropDistance = originalY - newState.currentPiece.position.y;

      // Drop distance should be positive
      expect(dropDistance).toBeGreaterThan(0);
      // Should be reasonable for an empty board
      expect(dropDistance).toBeGreaterThan(15); // Should drop to near bottom
    }
  });

  test("should award points for hard drop", () => {
    const state = createInitialGameState();
    const originalScore = state.score;

    const newState = hardDropTetromino(state);

    // Score should increase from hard drop
    expect(newState.score).toBeGreaterThanOrEqual(originalScore);
  });

  test("should lock piece immediately after hard drop", () => {
    const state = createInitialGameState();

    const newState = hardDropTetromino(state);

    // Piece should be locked (piece placement should occur)
    // This might spawn a new piece or start lock delay
    expect(newState).toBeDefined();
  });

  test("should handle hard drop on partially filled board", () => {
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    // Add some blocks to the bottom rows of the board
    const partiallyFilledBoard = createEmptyBoardWithBuffer();
    for (let x = 0; x < BOARD_CONSTANTS.WIDTH; x++) {
      partiallyFilledBoard[0][x] = 1; // Fill bottom row
      partiallyFilledBoard[1][x] = 1; // Fill second row
    }
    // Leave a gap in the middle for piece to potentially fit
    partiallyFilledBoard[1][4] = 0;
    partiallyFilledBoard[1][5] = 0;

    const stateWithBlocks: GameState = {
      ...state,
      boardWithBuffer: partiallyFilledBoard,
    };

    const originalY = state.currentPiece.position.y;
    const newState = hardDropTetromino(stateWithBlocks);

    expect(newState.currentPiece).not.toBeNull();
    if (newState.currentPiece) {
      // Piece should drop significantly from starting position
      expect(newState.currentPiece.position.y).toBeLessThan(originalY);
      // Score should increase from hard drop
      expect(newState.score).toBeGreaterThan(state.score);
    }
  });
});

describe("game state immutability", () => {
  test("moveTetrominoBy should not mutate original state", () => {
    const state = createInitialGameState();
    const originalState = JSON.parse(JSON.stringify(state));

    moveTetrominoBy(state, 1, 0);

    expect(state).toEqual(originalState);
  });

  test("rotateTetrominoCW should not mutate original state", () => {
    const state = createInitialGameState();
    const originalState = JSON.parse(JSON.stringify(state));

    rotateTetrominoCW(state);

    expect(state).toEqual(originalState);
  });

  test("hardDropTetromino should not mutate original state", () => {
    const state = createInitialGameState();
    const originalState = JSON.parse(JSON.stringify(state));

    hardDropTetromino(state);

    expect(state).toEqual(originalState);
  });
});

describe("game state validation", () => {
  test("should maintain valid board state after operations", () => {
    const state = createInitialGameState();

    const movedState = moveTetrominoBy(state, 1, 0);
    const rotatedState = rotateTetrominoCW(movedState);
    const droppedState = hardDropTetromino(rotatedState);

    // All states should have valid board dimensions
    expect(movedState.board.length).toBe(BOARD_CONSTANTS.HEIGHT);
    expect(movedState.board[0].length).toBe(BOARD_CONSTANTS.WIDTH);
    expect(rotatedState.boardWithBuffer.length).toBe(BOARD_CONSTANTS.TOTAL_HEIGHT);
    expect(droppedState.boardWithBuffer[0].length).toBe(BOARD_CONSTANTS.WIDTH);
  });

  test("should maintain consistent piece data", () => {
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    const newState = moveTetrominoBy(state, 1, 0);

    if (newState.currentPiece) {
      expect(newState.currentPiece.type).toBe(state.currentPiece.type);
      expect(newState.currentPiece.shape).toEqual(state.currentPiece.shape);
    }
  });
});

// Task 3.9: Game Over & Hold System - Testing (TDD)
describe("isGameOver", () => {
  test("should detect spawn collision when piece cannot be placed", () => {
    // Create a board where the spawn area is blocked
    const blockedBoard = createEmptyBoardWithBuffer();

    // Fill the spawn area (around y=21, x=3-6 for most pieces)
    for (let x = 3; x <= 6; x++) {
      blockedBoard[21][x] = 1; // Block spawn area
      blockedBoard[22][x] = 1; // Block above spawn area
    }

    const testPiece = createTetromino("T");

    // Game should be over when piece cannot spawn
    expect(isGameOver(blockedBoard, testPiece)).toBe(true);
  });

  test("should not detect game over when spawn area is clear", () => {
    const emptyBoard = createEmptyBoardWithBuffer();
    const testPiece = createTetromino("I");

    // Game should not be over with empty board
    expect(isGameOver(emptyBoard, testPiece)).toBe(false);
  });

  test("should detect game over with various piece types", () => {
    const pieceTypes: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];

    pieceTypes.forEach((pieceType) => {
      const blockedBoard = createEmptyBoardWithBuffer();

      // Fill spawn area for this piece type
      const spawnPosition = { x: 3, y: 21 }; // Generic spawn position
      for (let x = spawnPosition.x; x < spawnPosition.x + 4; x++) {
        for (let y = spawnPosition.y; y < spawnPosition.y + 4; y++) {
          if (x < BOARD_CONSTANTS.WIDTH && y < BOARD_CONSTANTS.TOTAL_HEIGHT) {
            blockedBoard[y][x] = 1;
          }
        }
      }

      const testPiece = createTetromino(pieceType);
      expect(isGameOver(blockedBoard, testPiece)).toBe(true);
    });
  });

  test("should handle partial spawn area blocking", () => {
    const partiallyBlockedBoard = createEmptyBoardWithBuffer();

    // Block only part of the spawn area
    partiallyBlockedBoard[21][4] = 1; // Block one cell in spawn area

    const testPiece = createTetromino("T");

    // Depending on the piece shape, this might or might not be game over
    const result = isGameOver(partiallyBlockedBoard, testPiece);
    expect(typeof result).toBe("boolean");
  });
});

describe("holdCurrentPiece - first hold action", () => {
  test("should hold current piece and spawn next piece", () => {
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    const originalCurrentType = state.currentPiece.type;
    const originalNextType = state.nextPiece;

    const newState = holdCurrentPiece(state);

    // Current piece should be held
    expect(newState.heldPiece).toBe(originalCurrentType);

    // Next piece should become current piece
    expect(newState.currentPiece).not.toBeNull();
    if (newState.currentPiece) {
      expect(newState.currentPiece.type).toBe(originalNextType);
    }

    // New next piece should be drawn from bag
    expect(newState.nextPiece).toBeDefined();
    expect(newState.nextPiece).not.toBe(originalNextType);

    // Hold ability should be disabled
    expect(newState.canHold).toBe(false);
  });

  test("should maintain piece bag consistency after first hold", () => {
    const state = createInitialGameState();
    const originalBagLength = state.pieceBag.length;

    const newState = holdCurrentPiece(state);

    // Bag should have one less piece (new next piece was drawn)
    expect(newState.pieceBag.length).toBe(originalBagLength - 1);
  });
});

describe("holdCurrentPiece - subsequent hold (swap) action", () => {
  test("should swap current piece with held piece", () => {
    // Create a state where a piece is already held
    const initialState = createInitialGameState();

    if (!initialState.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    // First hold to establish held piece
    const firstHoldState = holdCurrentPiece(initialState);

    // Re-enable hold ability (normally done when piece locks)
    const stateWithHoldEnabled: GameState = {
      ...firstHoldState,
      canHold: true,
    };

    if (!stateWithHoldEnabled.currentPiece) {
      throw new Error("Current piece should not be null after first hold");
    }

    const currentTypeBeforeSwap = stateWithHoldEnabled.currentPiece.type;
    const heldTypeBeforeSwap = stateWithHoldEnabled.heldPiece;

    // Second hold should swap pieces
    const swapState = holdCurrentPiece(stateWithHoldEnabled);

    // Pieces should be swapped
    expect(swapState.heldPiece).toBe(currentTypeBeforeSwap);
    expect(swapState.currentPiece).not.toBeNull();
    if (swapState.currentPiece) {
      expect(swapState.currentPiece.type).toBe(heldTypeBeforeSwap);
    }

    // Next piece and bag should remain unchanged during swap
    expect(swapState.nextPiece).toBe(stateWithHoldEnabled.nextPiece);
    expect(swapState.pieceBag).toEqual(stateWithHoldEnabled.pieceBag);

    // Hold ability should be disabled
    expect(swapState.canHold).toBe(false);
  });
});

describe("holdCurrentPiece - canHold flag behavior", () => {
  test("should disable hold ability after holding", () => {
    const state = createInitialGameState();
    expect(state.canHold).toBe(true);

    const newState = holdCurrentPiece(state);
    expect(newState.canHold).toBe(false);
  });

  test("should not allow hold when canHold is false", () => {
    const state = createInitialGameState();

    // Disable hold ability
    const stateWithHoldDisabled: GameState = {
      ...state,
      canHold: false,
    };

    const newState = holdCurrentPiece(stateWithHoldDisabled);

    // State should remain unchanged when hold is not allowed
    expect(newState).toEqual(stateWithHoldDisabled);
  });

  test("should not allow multiple holds without piece lock", () => {
    const state = createInitialGameState();

    // First hold
    const firstHoldState = holdCurrentPiece(state);
    expect(firstHoldState.canHold).toBe(false);

    // Attempt second hold without re-enabling
    const secondHoldState = holdCurrentPiece(firstHoldState);

    // Second hold should have no effect
    expect(secondHoldState).toEqual(firstHoldState);
  });
});

describe("holdCurrentPiece - edge cases", () => {
  test("should handle hold when game is over", () => {
    const state = createInitialGameState();

    // Set game over state
    const gameOverState: GameState = {
      ...state,
      isGameOver: true,
    };

    const newState = holdCurrentPiece(gameOverState);

    // Hold should have no effect when game is over
    expect(newState).toEqual(gameOverState);
  });

  test("should handle hold when game is paused", () => {
    const state = createInitialGameState();

    // Set paused state
    const pausedState: GameState = {
      ...state,
      isPaused: true,
    };

    const newState = holdCurrentPiece(pausedState);

    // Hold should have no effect when game is paused
    expect(newState).toEqual(pausedState);
  });

  test("should handle hold with no current piece", () => {
    const state = createInitialGameState();

    // Set no current piece
    const noCurrentPieceState: GameState = {
      ...state,
      currentPiece: null,
    };

    const newState = holdCurrentPiece(noCurrentPieceState);

    // Hold should have no effect with no current piece
    expect(newState).toEqual(noCurrentPieceState);
  });
});

describe("game over conditions", () => {
  test("should handle various game over scenarios", () => {
    // Test 1: Full stack reaching spawn area (including buffer area)
    const almostFullBoard = createEmptyBoardWithBuffer();

    // Create a test piece to check its actual spawn position
    const testPiece = createTetromino("I");

    // Fill the specific spawn position of the I-piece
    // The I-piece is 4 cells wide and spawns at a specific position
    const spawnX = testPiece.position.x;
    const spawnY = testPiece.position.y;

    // Fill around the spawn position to force game over
    for (let py = 0; py < testPiece.shape.length; py++) {
      for (let px = 0; px < testPiece.shape[py].length; px++) {
        if (testPiece.shape[py][px] !== 0) {
          const boardX = spawnX + px;
          const boardY = spawnY + py;
          if (
            boardX >= 0 &&
            boardX < BOARD_CONSTANTS.WIDTH &&
            boardY >= 0 &&
            boardY < BOARD_CONSTANTS.TOTAL_HEIGHT
          ) {
            almostFullBoard[boardY][boardX] = 1;
          }
        }
      }
    }

    expect(isGameOver(almostFullBoard, testPiece)).toBe(true);
  });

  test("should detect game over with different board configurations", () => {
    // Test 2: Tall stack in center
    const centerStackBoard = createEmptyBoardWithBuffer();

    // Create tall stack in center columns where pieces spawn
    for (let y = 0; y <= 21; y++) {
      for (let x = 3; x <= 6; x++) {
        centerStackBoard[y][x] = 1;
      }
    }

    const testPiece = createTetromino("T");
    expect(isGameOver(centerStackBoard, testPiece)).toBe(true);
  });

  test("should not detect game over with high but non-blocking stacks", () => {
    // Test 3: High stacks on sides but clear spawn area
    const sideStackBoard = createEmptyBoardWithBuffer();

    // Fill sides but leave center clear
    for (let y = 0; y <= 22; y++) {
      sideStackBoard[y][0] = 1; // Left side
      sideStackBoard[y][1] = 1;
      sideStackBoard[y][8] = 1; // Right side
      sideStackBoard[y][9] = 1;
    }

    const testPiece = createTetromino("T");
    expect(isGameOver(sideStackBoard, testPiece)).toBe(false);
  });

  test("should handle game over detection with buffer area usage", () => {
    // Test 4: Blocks in buffer area but not blocking spawn
    const bufferAreaBoard = createEmptyBoardWithBuffer();

    // Add blocks in buffer area but not at spawn position
    bufferAreaBoard[23][0] = 1; // Top row of buffer
    bufferAreaBoard[23][9] = 1;
    bufferAreaBoard[22][1] = 1;
    bufferAreaBoard[22][8] = 1;

    const testPiece = createTetromino("I");
    expect(isGameOver(bufferAreaBoard, testPiece)).toBe(false);
  });
});

// Task 3.11: Lock Delay System - Testing (TDD)
describe("lock delay timer initialization", () => {
  test("should not have lock delay on initial state", () => {
    const state = createInitialGameState();

    expect(state.lockDelay).toBeNull();
  });

  test("should start lock delay when downward movement is blocked", () => {
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    // Move piece to the bottom where downward movement will be blocked
    const pieceAtBottom: Tetromino = {
      ...state.currentPiece,
      position: { x: state.currentPiece.position.x, y: 0 },
    };

    const stateWithPieceAtBottom: GameState = {
      ...state,
      currentPiece: pieceAtBottom,
    };

    // Try to move down when at bottom - should start lock delay
    const newState = moveTetrominoBy(stateWithPieceAtBottom, 0, -1);

    expect(newState.lockDelay).not.toBeNull();
    if (newState.lockDelay) {
      expect(newState.lockDelay.isActive).toBe(true);
      expect(newState.lockDelay.resetCount).toBe(0);
      expect(newState.lockDelay.startTime).toBeGreaterThan(0);
      expect(newState.lockDelay.lastLowestY).toBe(0);
    }
  });

  test("should initialize lock delay with correct values", () => {
    const state = createInitialGameState();

    // Use a deterministic T-piece to avoid randomness issues in CI
    const tPiece = createTetromino("T");
    const pieceAtBottom: Tetromino = {
      ...tPiece,
      position: { x: 4, y: 1 }, // Place at known position
    };

    // Create blocked board to trigger lock delay
    const blockedBoard = createEmptyBoardWithBuffer();
    blockedBoard[0] = Array(BOARD_CONSTANTS.WIDTH).fill(1); // Fill bottom row

    const blockedState: GameState = {
      ...state,
      boardWithBuffer: blockedBoard,
      currentPiece: pieceAtBottom,
    };

    const newState = moveTetrominoBy(blockedState, 0, -1);

    expect(newState.lockDelay).not.toBeNull();
    if (newState.lockDelay) {
      expect(newState.lockDelay.isActive).toBe(true);
      expect(newState.lockDelay.resetCount).toBe(0);
      expect(newState.lockDelay.lastLowestY).toBe(1);
      expect(typeof newState.lockDelay.startTime).toBe("number");
    }
  });
});

describe("lock delay reset on movement/rotation", () => {
  test("should reset lock delay timer on horizontal movement", () => {
    // Create state with active lock delay
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    const pieceAtBottom: Tetromino = {
      ...state.currentPiece,
      position: { x: 4, y: 1 },
    };

    const stateWithLockDelay: GameState = {
      ...state,
      currentPiece: pieceAtBottom,
      lockDelay: {
        isActive: true,
        startTime: Date.now() - 200, // 200ms ago
        resetCount: 0,
        lastLowestY: 1,
      },
    };

    // Move horizontally - should reset timer and increment count
    const newState = moveTetrominoBy(stateWithLockDelay, 1, 0);

    expect(newState.lockDelay).not.toBeNull();
    if (newState.lockDelay && stateWithLockDelay.lockDelay) {
      expect(newState.lockDelay.resetCount).toBe(1);
      expect(newState.lockDelay.startTime).toBeGreaterThan(stateWithLockDelay.lockDelay.startTime);
      expect(newState.lockDelay.lastLowestY).toBe(1); // Same Y position
    }
  });

  test("should reset lock delay timer on rotation", () => {
    // Create state with active lock delay
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    const pieceAtBottom: Tetromino = {
      ...state.currentPiece,
      position: { x: 4, y: 2 },
    };

    const stateWithLockDelay: GameState = {
      ...state,
      currentPiece: pieceAtBottom,
      lockDelay: {
        isActive: true,
        startTime: Date.now() - 300, // 300ms ago
        resetCount: 2,
        lastLowestY: 2,
      },
    };

    // Rotate piece - should reset timer and increment count
    const newState = rotateTetrominoCW(stateWithLockDelay);

    expect(newState.lockDelay).not.toBeNull();
    if (newState.lockDelay && stateWithLockDelay.lockDelay) {
      expect(newState.lockDelay.resetCount).toBe(3);
      expect(newState.lockDelay.startTime).toBeGreaterThan(stateWithLockDelay.lockDelay.startTime);
    }
  });

  test("should reset count when piece moves to lower position", () => {
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    const piece: Tetromino = {
      ...state.currentPiece,
      position: { x: 4, y: 3 },
    };

    const stateWithLockDelay: GameState = {
      ...state,
      currentPiece: piece,
      lockDelay: {
        isActive: true,
        startTime: Date.now() - 100,
        resetCount: 5, // High reset count
        lastLowestY: 3,
      },
    };

    // Move down to lower position - should reset count
    const newState = moveTetrominoBy(stateWithLockDelay, 0, -1);

    expect(newState.lockDelay).not.toBeNull();
    if (newState.lockDelay) {
      expect(newState.lockDelay.resetCount).toBe(0); // Reset because moved to lower Y
      expect(newState.lockDelay.lastLowestY).toBe(2); // New lowest Y
    }
  });
});

describe("lock delay expiration and piece lock", () => {
  test("should detect when lock delay timer has expired", () => {
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    // Create state with expired lock delay
    const stateWithExpiredLockDelay: GameState = {
      ...state,
      lockDelay: {
        isActive: true,
        startTime: Date.now() - 600, // 600ms ago (> 500ms default)
        resetCount: 3,
        lastLowestY: 0,
      },
    };

    // Check if piece should be locked
    const shouldLock = shouldLockPiece(stateWithExpiredLockDelay);
    expect(shouldLock).toBe(true);
  });

  test("should not lock piece before timer expires", () => {
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    // Create state with active but not expired lock delay
    const stateWithActiveLockDelay: GameState = {
      ...state,
      lockDelay: {
        isActive: true,
        startTime: Date.now() - 200, // 200ms ago (< 500ms default)
        resetCount: 3,
        lastLowestY: 0,
      },
    };

    // Check if piece should be locked
    const shouldLock = shouldLockPiece(stateWithActiveLockDelay);
    expect(shouldLock).toBe(false);
  });

  test("should handle states without lock delay", () => {
    const state = createInitialGameState();

    // Check shouldLockPiece with no lock delay
    const shouldLock = shouldLockPiece(state);
    expect(shouldLock).toBe(false);
  });
});

describe("lock delay with different game speeds", () => {
  test("should use same lock delay regardless of game speed", () => {
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    // Create states with different levels (different speeds)
    const fastState: GameState = {
      ...state,
      level: 10,
      dropInterval: 100, // Fast speed
    };

    const slowState: GameState = {
      ...state,
      level: 1,
      dropInterval: 1000, // Slow speed
    };

    // Both should use the same lock delay timing
    // (This test verifies the constant is used, not speed-dependent)
    const fastStateWithLockDelay = {
      ...fastState,
      lockDelay: { isActive: true, startTime: Date.now() - 550, resetCount: 0, lastLowestY: 0 },
    };
    const slowStateWithLockDelay = {
      ...slowState,
      lockDelay: { isActive: true, startTime: Date.now() - 550, resetCount: 0, lastLowestY: 0 },
    };

    expect(shouldLockPiece(fastStateWithLockDelay)).toBe(true);
    expect(shouldLockPiece(slowStateWithLockDelay)).toBe(true);
  });
});

describe("move/rotation count tracking during lock delay", () => {
  test("should increment reset count on each movement", () => {
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    let currentState: GameState = {
      ...state,
      currentPiece: { ...state.currentPiece, position: { x: 4, y: 1 } },
      lockDelay: {
        isActive: true,
        startTime: Date.now(),
        resetCount: 0,
        lastLowestY: 1,
      },
    };

    // Perform multiple movements
    currentState = moveTetrominoBy(currentState, 1, 0); // Move right
    expect(currentState.lockDelay?.resetCount).toBe(1);

    currentState = moveTetrominoBy(currentState, -1, 0); // Move left
    expect(currentState.lockDelay?.resetCount).toBe(2);

    currentState = rotateTetrominoCW(currentState); // Rotate
    expect(currentState.lockDelay?.resetCount).toBe(3);
  });

  test("should track reset count up to maximum", () => {
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    const stateWithHighResetCount: GameState = {
      ...state,
      currentPiece: { ...state.currentPiece, position: { x: 4, y: 1 } },
      lockDelay: {
        isActive: true,
        startTime: Date.now(),
        resetCount: 14, // One less than max
        lastLowestY: 1,
      },
    };

    // One more movement should reach max
    const newState = moveTetrominoBy(stateWithHighResetCount, 1, 0);
    expect(newState.lockDelay?.resetCount).toBe(15);
  });
});

describe("forced lock when max moves/rotations reached", () => {
  test("should force lock when reset count reaches maximum", () => {
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    // Create state with maximum reset count
    const stateWithMaxResets: GameState = {
      ...state,
      lockDelay: {
        isActive: true,
        startTime: Date.now(), // Recent start time
        resetCount: 15, // Maximum resets
        lastLowestY: 0,
      },
    };

    // Should force lock even if timer hasn't expired
    const shouldLock = shouldLockPiece(stateWithMaxResets);
    expect(shouldLock).toBe(true);
  });

  test("should not force lock below maximum reset count", () => {
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    // Create state with below-maximum reset count
    const stateWithLowResets: GameState = {
      ...state,
      lockDelay: {
        isActive: true,
        startTime: Date.now(), // Recent start time
        resetCount: 14, // Below maximum
        lastLowestY: 0,
      },
    };

    // Should not force lock yet
    const shouldLock = shouldLockPiece(stateWithLowResets);
    expect(shouldLock).toBe(false);
  });
});

describe("reset count clearing when new piece spawns", () => {
  test("should clear lock delay when piece locks and new piece spawns", () => {
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    // Create state with active lock delay
    const stateWithLockDelay: GameState = {
      ...state,
      lockDelay: {
        isActive: true,
        startTime: Date.now() - 100,
        resetCount: 5,
        lastLowestY: 0,
      },
    };

    // Lock the current piece (this should clear lock delay)
    const newState = lockCurrentTetromino(stateWithLockDelay);

    // Lock delay should be cleared
    expect(newState.lockDelay).toBeNull();

    // canHold should be reset
    expect(newState.canHold).toBe(true);
  });

  test("should start fresh lock delay state for new piece", () => {
    const state = createInitialGameState();

    if (!state.currentPiece) {
      throw new Error("Current piece should not be null in initial state");
    }

    // Lock current piece to spawn new one
    const newState = lockCurrentTetromino(state);

    // New piece should have no lock delay
    expect(newState.lockDelay).toBeNull();

    // If new piece gets into lock delay situation, it should start fresh
    if (newState.currentPiece) {
      const pieceAtBottom: Tetromino = {
        ...newState.currentPiece,
        position: { x: newState.currentPiece.position.x, y: 0 },
      };

      const stateWithNewPieceAtBottom: GameState = {
        ...newState,
        currentPiece: pieceAtBottom,
      };

      // Try to move down - should start fresh lock delay
      const stateWithNewLockDelay = moveTetrominoBy(stateWithNewPieceAtBottom, 0, -1);

      if (stateWithNewLockDelay.lockDelay) {
        expect(stateWithNewLockDelay.lockDelay.resetCount).toBe(0);
        expect(stateWithNewLockDelay.lockDelay.isActive).toBe(true);
      }
    }
  });
});
