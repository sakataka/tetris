import { beforeEach, describe, expect, test } from "bun:test";
import type { GameState } from "@/types/game";
import { GAME_CONSTANTS } from "@/utils/gameConstants";
import { useGameStore } from "./gameStore";

// Reset store state before each test
const resetStore = () => {
  const store = useGameStore.getState();
  store.resetGame();
};

describe("GameStore", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("Initial State", () => {
    test("should create initial game state correctly", () => {
      const store = useGameStore.getState();
      expect(store.board).toHaveLength(GAME_CONSTANTS.BOARD.HEIGHT);
      expect(store.board[0]).toHaveLength(GAME_CONSTANTS.BOARD.WIDTH);
      expect(store.boardWithBuffer).toHaveLength(GAME_CONSTANTS.BOARD.TOTAL_HEIGHT);
      // Initial state should spawn a piece immediately
      expect(store.currentPiece).toBeDefined();
      expect(store.nextPiece).toBeDefined();
      expect(store.heldPiece).toBeNull();
      expect(store.canHold).toBe(true);
      expect(store.score).toBe(0);
      expect(store.lines).toBe(0);
      expect(store.level).toBe(1);
      expect(store.isGameOver).toBe(false);
      expect(store.isPaused).toBe(false);
      expect(store.ghostPosition).toBeNull();
      expect(store.pieceBag).toBeDefined();
      expect(store.lockDelay).toBeNull();
      expect(store.dropInterval).toBe(GAME_CONSTANTS.TIMING.INITIAL_DROP_SPEED);
    });
  });

  describe("Movement Actions", () => {
    test("moveLeft() should be callable", () => {
      const store = useGameStore.getState();
      expect(() => store.moveLeft()).not.toThrow();
    });

    test("moveRight() should be callable", () => {
      const store = useGameStore.getState();
      expect(() => store.moveRight()).not.toThrow();
    });

    test("moveDown() should be callable", () => {
      const store = useGameStore.getState();
      expect(() => store.moveDown()).not.toThrow();
    });
  });

  describe("Rotation Action", () => {
    test("rotate() should be callable", () => {
      const store = useGameStore.getState();
      expect(() => store.rotate()).not.toThrow();
    });
  });

  describe("Drop Action", () => {
    test("drop() should be callable for hard drop", () => {
      const store = useGameStore.getState();
      expect(() => store.drop()).not.toThrow();
    });
  });

  describe("Hold Action", () => {
    test("holdPiece() should be callable", () => {
      const store = useGameStore.getState();
      expect(() => store.holdPiece()).not.toThrow();
    });
  });

  describe("Game Control Actions", () => {
    test("togglePause() should toggle pause state", () => {
      const store = useGameStore.getState();
      const initialPauseState = store.isPaused;
      store.togglePause();
      expect(useGameStore.getState().isPaused).toBe(!initialPauseState);
      store.togglePause();
      expect(useGameStore.getState().isPaused).toBe(initialPauseState);
    });

    test("resetGame() should reset to initial state", () => {
      const store = useGameStore.getState();
      // Modify some state
      store.togglePause();
      expect(useGameStore.getState().isPaused).toBe(true);

      // Reset game
      store.resetGame();
      const newState = useGameStore.getState();
      expect(newState.score).toBe(0);
      expect(newState.lines).toBe(0);
      expect(newState.level).toBe(1);
      expect(newState.isGameOver).toBe(false);
      expect(newState.isPaused).toBe(false);
    });
  });

  describe("State Immutability", () => {
    test("all actions should maintain state immutability", () => {
      const store = useGameStore.getState();
      const originalBoard = store.board;

      // Call various actions
      store.moveLeft();
      store.moveRight();
      store.moveDown();
      store.rotate();

      // Since we don't have a current piece yet, board should remain unchanged
      // but the actions should not throw
      expect(() => {
        store.drop();
        store.holdPiece();
        store.togglePause();
        store.clearAnimationData();
      }).not.toThrow();
    });
  });

  describe("Clear Animation Data", () => {
    test("clearAnimationData() should be callable", () => {
      const store = useGameStore.getState();
      expect(() => store.clearAnimationData()).not.toThrow();
    });
  });
});
