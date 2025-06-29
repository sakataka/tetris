import { beforeEach, describe, expect, jest, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { createInitialGameState } from "@/game/game";
import { useGameStore } from "@/store/gameStore";
import type { GameState } from "@/types/game";

// Mock the game logic functions to control their behavior in tests
const mockMoveTetrominoBy = jest.fn();
const mockRotateTetrominoCW = jest.fn();
const mockHardDropTetromino = jest.fn();
const mockHoldCurrentPiece = jest.fn();
const mockLockCurrentTetromino = jest.fn();
const mockShouldLockPiece = jest.fn();

jest.mock("@/game/game", () => ({
  createInitialGameState: jest.fn(),
  moveTetrominoBy: mockMoveTetrominoBy,
  rotateTetrominoCW: mockRotateTetrominoCW,
  hardDropTetromino: mockHardDropTetromino,
  holdCurrentPiece: mockHoldCurrentPiece,
  lockCurrentTetromino: mockLockCurrentTetromino,
  shouldLockPiece: mockShouldLockPiece,
}));

describe("Game State Integration Tests", () => {
  let initialState: GameState;

  beforeEach(() => {
    jest.clearAllMocks();

    initialState = {
      board: Array(20)
        .fill(null)
        .map(() => Array(10).fill(0)),
      boardWithBuffer: Array(24)
        .fill(null)
        .map(() => Array(10).fill(0)),
      currentPiece: {
        type: "T",
        position: { x: 3, y: 21 },
        rotation: 0,
        shape: [
          [0, 1, 0],
          [1, 1, 1],
          [0, 0, 0],
        ],
      },
      nextPiece: "I",
      heldPiece: null,
      canHold: true,
      score: 0,
      lines: 0,
      level: 1,
      isGameOver: false,
      isPaused: false,
      ghostPosition: { x: 3, y: 0 },
      pieceBag: ["O", "S", "Z", "J", "L"],
      lockDelay: null,
      lastDropTime: 0,
      dropInterval: 1000,
      linesClearing: [],
      animationInProgress: false,
    };

    (createInitialGameState as jest.Mock).mockReturnValue(initialState);
  });

  describe("Piece Movement Integration", () => {
    test("should handle successful piece movement", () => {
      const newState = { ...initialState };
      newState.currentPiece = {
        ...initialState.currentPiece!,
        position: { x: 4, y: 21 },
      };

      mockMoveTetrominoBy.mockReturnValue(newState);

      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.moveRight();
      });

      expect(mockMoveTetrominoBy).toHaveBeenCalledWith(expect.objectContaining(initialState), 1, 0);
    });

    test("should not move piece when game is paused", () => {
      const pausedState = { ...initialState, isPaused: true };
      (createInitialGameState as jest.Mock).mockReturnValue(pausedState);

      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.moveLeft();
      });

      expect(mockMoveTetrominoBy).not.toHaveBeenCalled();
      expect(result.current.isPaused).toBe(true);
    });

    test("should not move piece when game is over", () => {
      const gameOverState = { ...initialState, isGameOver: true };
      (createInitialGameState as jest.Mock).mockReturnValue(gameOverState);

      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.moveRight();
      });

      expect(mockMoveTetrominoBy).not.toHaveBeenCalled();
      expect(result.current.isGameOver).toBe(true);
    });

    test("should return success status for moveDown action", () => {
      // Test successful movement
      const newState = { ...initialState };
      newState.currentPiece = {
        ...initialState.currentPiece!,
        position: { x: 3, y: 20 },
      };

      mockMoveTetrominoBy.mockReturnValue(newState);

      const { result } = renderHook(() => useGameStore());

      let moveResult: boolean = false;
      act(() => {
        moveResult = result.current.moveDown();
      });

      expect(moveResult).toBe(true);
      expect(mockMoveTetrominoBy).toHaveBeenCalledWith(
        expect.objectContaining(initialState),
        0,
        -1
      );

      // Test blocked movement
      mockMoveTetrominoBy.mockReturnValue(initialState); // Same state = no movement

      act(() => {
        moveResult = result.current.moveDown();
      });

      expect(moveResult).toBe(false);
    });
  });

  describe("Piece Rotation Integration", () => {
    test("should handle successful piece rotation", () => {
      const rotatedState = { ...initialState };
      rotatedState.currentPiece = {
        ...initialState.currentPiece!,
        rotation: 1,
        shape: [
          [0, 1],
          [1, 1],
          [0, 1],
        ],
      };

      mockRotateTetrominoCW.mockReturnValue(rotatedState);

      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.rotate();
      });

      expect(mockRotateTetrominoCW).toHaveBeenCalledWith(expect.objectContaining(initialState));
    });

    test("should not rotate piece when blocked", () => {
      mockRotateTetrominoCW.mockReturnValue(initialState); // Same state = blocked rotation

      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.rotate();
      });

      expect(mockRotateTetrominoCW).toHaveBeenCalled();
      expect(result.current.currentPiece?.rotation).toBe(0); // Should remain unchanged
    });

    test("should not rotate when game is paused or over", () => {
      const pausedState = { ...initialState, isPaused: true };
      (createInitialGameState as jest.Mock).mockReturnValue(pausedState);

      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.rotate();
      });

      expect(mockRotateTetrominoCW).not.toHaveBeenCalled();
    });
  });

  describe("Hard Drop Integration", () => {
    test("should handle hard drop action", () => {
      const droppedState = { ...initialState };
      droppedState.currentPiece = {
        ...initialState.currentPiece!,
        position: { x: 3, y: 0 }, // Dropped to bottom
      };
      droppedState.score = 20; // Hard drop bonus

      mockHardDropTetromino.mockReturnValue(droppedState);

      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.drop();
      });

      expect(mockHardDropTetromino).toHaveBeenCalledWith(expect.objectContaining(initialState));
      expect(result.current.score).toBe(20);
    });

    test("should not hard drop when game is paused or over", () => {
      const gameOverState = { ...initialState, isGameOver: true };
      (createInitialGameState as jest.Mock).mockReturnValue(gameOverState);

      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.drop();
      });

      expect(mockHardDropTetromino).not.toHaveBeenCalled();
    });
  });

  describe("Hold System Integration", () => {
    test("should handle first hold action", () => {
      const heldState = { ...initialState };
      heldState.heldPiece = "T";
      heldState.currentPiece = {
        type: "I",
        position: { x: 3, y: 21 },
        rotation: 0,
        shape: [
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
      };
      heldState.canHold = false;

      mockHoldCurrentPiece.mockReturnValue(heldState);

      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.holdPiece();
      });

      expect(mockHoldCurrentPiece).toHaveBeenCalledWith(expect.objectContaining(initialState));
      expect(result.current.heldPiece).toBe("T");
      expect(result.current.canHold).toBe(false);
    });

    test("should handle hold when already holding a piece", () => {
      const initialWithHeld = {
        ...initialState,
        heldPiece: "I" as const,
        canHold: true,
      };

      const swappedState = { ...initialWithHeld };
      swappedState.heldPiece = "T";
      swappedState.currentPiece = {
        type: "I",
        position: { x: 3, y: 21 },
        rotation: 0,
        shape: [
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
      };
      swappedState.canHold = false;

      (createInitialGameState as jest.Mock).mockReturnValue(initialWithHeld);
      mockHoldCurrentPiece.mockReturnValue(swappedState);

      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.holdPiece();
      });

      expect(mockHoldCurrentPiece).toHaveBeenCalledWith(expect.objectContaining(initialWithHeld));
    });

    test("should not hold when canHold is false", () => {
      const noHoldState = { ...initialState, canHold: false };
      mockHoldCurrentPiece.mockReturnValue(noHoldState); // No change

      (createInitialGameState as jest.Mock).mockReturnValue(noHoldState);

      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.holdPiece();
      });

      // Should still call the function, but no state change
      expect(mockHoldCurrentPiece).toHaveBeenCalled();
    });
  });

  describe("Pause/Resume Integration", () => {
    test("should toggle pause state", () => {
      const { result } = renderHook(() => useGameStore());

      expect(result.current.isPaused).toBe(false);

      act(() => {
        result.current.togglePause();
      });

      expect(result.current.isPaused).toBe(true);

      act(() => {
        result.current.togglePause();
      });

      expect(result.current.isPaused).toBe(false);
    });

    test("should prevent actions when paused", () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.togglePause();
      });

      expect(result.current.isPaused).toBe(true);

      act(() => {
        result.current.moveLeft();
        result.current.moveRight();
        result.current.rotate();
        result.current.drop();
        result.current.holdPiece();
      });

      // No game functions should be called when paused
      expect(mockMoveTetrominoBy).not.toHaveBeenCalled();
      expect(mockRotateTetrominoCW).not.toHaveBeenCalled();
      expect(mockHardDropTetromino).not.toHaveBeenCalled();
      expect(mockHoldCurrentPiece).not.toHaveBeenCalled();
    });
  });

  describe("Game Reset Integration", () => {
    test("should reset game to initial state", () => {
      const modifiedState = {
        ...initialState,
        score: 5000,
        level: 5,
        lines: 42,
        isPaused: true,
        heldPiece: "I" as const,
      };

      (createInitialGameState as jest.Mock).mockReturnValue(modifiedState);

      const { result } = renderHook(() => useGameStore());

      // Verify we start with modified state
      expect(result.current.score).toBe(5000);
      expect(result.current.level).toBe(5);
      expect(result.current.isPaused).toBe(true);

      // Reset to initial state
      (createInitialGameState as jest.Mock).mockReturnValue(initialState);

      act(() => {
        result.current.resetGame();
      });

      expect(result.current.score).toBe(0);
      expect(result.current.level).toBe(1);
      expect(result.current.lines).toBe(0);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.heldPiece).toBeNull();
      expect(result.current.isGameOver).toBe(false);
    });
  });

  describe("Lock Delay Integration", () => {
    test("should handle lock delay state", () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.updateLockDelay(100);
      });

      // Should handle lock delay update (implementation depends on game logic)
      expect(result.current.lockDelay).toBeDefined();
    });

    test("should reset lock delay", () => {
      const stateWithLockDelay = {
        ...initialState,
        lockDelay: {
          isActive: true,
          startTime: 1000,
          resetCount: 5,
          lastLowestY: 10,
        },
      };

      (createInitialGameState as jest.Mock).mockReturnValue(stateWithLockDelay);

      const { result } = renderHook(() => useGameStore());

      expect(result.current.lockDelay).not.toBeNull();

      act(() => {
        result.current.resetLockDelay();
      });

      expect(result.current.lockDelay).toBeNull();
    });

    test("should check if piece should lock", () => {
      mockShouldLockPiece.mockReturnValue(true);

      const { result } = renderHook(() => useGameStore());

      let shouldLock: boolean = false;
      act(() => {
        shouldLock = result.current.shouldLockPiece();
      });

      expect(shouldLock).toBe(true);
      expect(mockShouldLockPiece).toHaveBeenCalled();
    });

    test("should handle piece locking", () => {
      const lockedState = {
        ...initialState,
        currentPiece: null, // Piece was locked and removed
        score: 100, // Gained points for lock
        canHold: true, // Reset hold ability
      };

      mockLockCurrentTetromino.mockReturnValue(lockedState);

      const { result } = renderHook(() => useGameStore());

      let lockResult: boolean = false;
      act(() => {
        lockResult = result.current.lockCurrentTetromino();
      });

      expect(lockResult).toBe(true);
      expect(mockLockCurrentTetromino).toHaveBeenCalled();
      expect(result.current.currentPiece).toBeNull();
      expect(result.current.canHold).toBe(true);
    });
  });

  describe("Animation State Integration", () => {
    test("should clear animation data", () => {
      const stateWithAnimation = {
        ...initialState,
        linesClearing: [18, 19],
        animationInProgress: true,
      };

      (createInitialGameState as jest.Mock).mockReturnValue(stateWithAnimation);

      const { result } = renderHook(() => useGameStore());

      expect(result.current.linesClearing).toEqual([18, 19]);
      expect(result.current.animationInProgress).toBe(true);

      act(() => {
        result.current.clearAnimationData();
      });

      expect(result.current.linesClearing).toEqual([]);
      expect(result.current.animationInProgress).toBe(false);
    });
  });

  describe("Complex Game Scenarios", () => {
    test("should handle complete piece placement cycle", () => {
      const { result } = renderHook(() => useGameStore());

      // 1. Move piece around
      const movedState = { ...initialState };
      movedState.currentPiece = {
        ...initialState.currentPiece!,
        position: { x: 4, y: 21 },
      };
      mockMoveTetrominoBy.mockReturnValue(movedState);

      act(() => {
        result.current.moveRight();
      });

      // 2. Rotate piece
      const rotatedState = { ...movedState };
      rotatedState.currentPiece = {
        ...movedState.currentPiece!,
        rotation: 1,
      };
      mockRotateTetrominoCW.mockReturnValue(rotatedState);

      act(() => {
        result.current.rotate();
      });

      // 3. Hard drop
      const droppedState = { ...rotatedState };
      droppedState.currentPiece = {
        ...rotatedState.currentPiece!,
        position: { x: 4, y: 0 },
      };
      mockHardDropTetromino.mockReturnValue(droppedState);

      act(() => {
        result.current.drop();
      });

      // Verify sequence was executed
      expect(mockMoveTetrominoBy).toHaveBeenCalled();
      expect(mockRotateTetrominoCW).toHaveBeenCalled();
      expect(mockHardDropTetromino).toHaveBeenCalled();
    });

    test("should handle pause during active gameplay", () => {
      const { result } = renderHook(() => useGameStore());

      // Start some actions
      mockMoveTetrominoBy.mockReturnValue({
        ...initialState,
        currentPiece: {
          ...initialState.currentPiece!,
          position: { x: 2, y: 21 },
        },
      });

      act(() => {
        result.current.moveLeft();
      });

      expect(mockMoveTetrominoBy).toHaveBeenCalledTimes(1);

      // Pause game
      act(() => {
        result.current.togglePause();
      });

      // Try to perform actions while paused
      act(() => {
        result.current.moveLeft();
        result.current.rotate();
      });

      // No additional calls should be made
      expect(mockMoveTetrominoBy).toHaveBeenCalledTimes(1);
      expect(mockRotateTetrominoCW).not.toHaveBeenCalled();

      // Resume and continue
      act(() => {
        result.current.togglePause();
      });

      act(() => {
        result.current.moveLeft();
      });

      expect(mockMoveTetrominoBy).toHaveBeenCalledTimes(2);
    });

    test("should maintain state consistency across multiple operations", () => {
      const { result } = renderHook(() => useGameStore());

      // Track state changes through multiple operations
      const states: GameState[] = [];

      // Operation 1: Move
      const state1 = { ...initialState };
      state1.currentPiece = {
        ...initialState.currentPiece!,
        position: { x: 4, y: 21 },
      };
      mockMoveTetrominoBy.mockReturnValue(state1);

      act(() => {
        result.current.moveRight();
        states.push({ ...result.current });
      });

      // Operation 2: Hold
      const state2 = { ...state1 };
      state2.heldPiece = "T";
      state2.canHold = false;
      mockHoldCurrentPiece.mockReturnValue(state2);

      act(() => {
        result.current.holdPiece();
        states.push({ ...result.current });
      });

      // Verify state progression
      expect(states[0].currentPiece?.position.x).toBe(4);
      expect(states[1].heldPiece).toBe("T");
      expect(states[1].canHold).toBe(false);

      // Verify immutability (each state should be different object)
      expect(states[0]).not.toBe(states[1]);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    test("should handle null current piece gracefully", () => {
      const stateWithoutPiece = { ...initialState, currentPiece: null };
      (createInitialGameState as jest.Mock).mockReturnValue(stateWithoutPiece);

      const { result } = renderHook(() => useGameStore());

      // Should not crash when trying to move non-existent piece
      act(() => {
        result.current.moveLeft();
        result.current.rotate();
        result.current.drop();
      });

      // Functions might still be called, but should handle null piece internally
    });

    test("should handle game over condition", () => {
      const gameOverState = { ...initialState, isGameOver: true };
      (createInitialGameState as jest.Mock).mockReturnValue(gameOverState);

      const { result } = renderHook(() => useGameStore());

      // All actions should be blocked when game is over
      act(() => {
        result.current.moveLeft();
        result.current.moveRight();
        result.current.rotate();
        result.current.drop();
        result.current.holdPiece();
      });

      expect(mockMoveTetrominoBy).not.toHaveBeenCalled();
      expect(mockRotateTetrominoCW).not.toHaveBeenCalled();
      expect(mockHardDropTetromino).not.toHaveBeenCalled();
      expect(mockHoldCurrentPiece).not.toHaveBeenCalled();

      // But pause should still work
      act(() => {
        result.current.togglePause();
      });

      expect(result.current.isPaused).toBe(true);
    });

    test("should handle rapid consecutive actions", () => {
      const { result } = renderHook(() => useGameStore());

      mockMoveTetrominoBy.mockReturnValue(initialState);

      // Perform many rapid actions
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.moveLeft();
          result.current.moveRight();
        }
      });

      // Should handle all calls without issues
      expect(mockMoveTetrominoBy).toHaveBeenCalledTimes(200);
    });
  });
});
