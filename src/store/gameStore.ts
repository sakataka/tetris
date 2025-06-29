import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  createInitialGameState,
  hardDropTetromino,
  holdCurrentPiece,
  moveTetrominoBy,
  rotateTetrominoCW,
} from "@/game/game";
import type { GameState } from "@/types/game";
import { GAME_CONSTANTS } from "@/utils/gameConstants";

export interface GameStore extends GameState {
  // Actions
  moveLeft: () => void;
  moveRight: () => void;
  moveDown: () => void;
  rotate: () => void;
  drop: () => void;
  holdPiece: () => void;
  togglePause: () => void;
  resetGame: () => void;
  clearAnimationData: () => void;
}

export const useGameStore = create<GameStore>()(
  devtools(
    (set) => ({
      // Initial state
      ...createInitialGameState(),

      // Movement actions
      moveLeft: () =>
        set((state) => {
          if (state.isPaused || state.isGameOver) return state;
          return moveTetrominoBy(state, -1, 0);
        }),

      moveRight: () =>
        set((state) => {
          if (state.isPaused || state.isGameOver) return state;
          return moveTetrominoBy(state, 1, 0);
        }),

      moveDown: () =>
        set((state) => {
          if (state.isPaused || state.isGameOver) return state;
          return moveTetrominoBy(state, 0, 1);
        }),

      // Rotation action
      rotate: () =>
        set((state) => {
          if (state.isPaused || state.isGameOver) return state;
          return rotateTetrominoCW(state);
        }),

      // Drop action (hard drop)
      drop: () =>
        set((state) => {
          if (state.isPaused || state.isGameOver) return state;
          return hardDropTetromino(state);
        }),

      // Hold piece action
      holdPiece: () =>
        set((state) => {
          if (state.isPaused || state.isGameOver) return state;
          return holdCurrentPiece(state);
        }),

      // Game control actions
      togglePause: () =>
        set((state) => ({
          ...state,
          isPaused: !state.isPaused,
        })),

      resetGame: () => set(() => createInitialGameState()),

      // Clear animation-related data (for UI state cleanup)
      clearAnimationData: () =>
        set((state) => ({
          ...state,
          // This can be extended to clear specific animation states
          // For now, it just returns the current state
        })),
    }),
    {
      name: "game-store",
    }
  )
);
