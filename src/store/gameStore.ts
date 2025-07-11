import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import {
  createInitialGameState,
  createPreGameState,
  hardDropTetromino,
  holdCurrentPiece,
  lockCurrentTetromino,
  moveTetrominoBy,
  rotateTetrominoCW,
  shouldLockPiece,
} from "@/game/game";
import type { GameState, LineClearAnimationState } from "@/types/game";
import {
  createLineClearAnimationState,
  DEFAULT_LINE_CLEAR_CONFIG,
  getLineClearFeedback,
  isLineClearAnimationComplete,
  updateLineClearAnimationState,
} from "@/utils/lineClearAnimations";

export interface GameStore extends GameState {
  // Actions
  moveLeft: () => void;
  moveRight: () => void;
  moveDown: () => boolean; // Returns true if movement was successful
  rotate: () => void;
  drop: () => void;
  holdPiece: () => void;
  togglePause: () => void;
  resetGame: () => void;
  startGame: () => void;
  clearAnimationData: () => void;
  startLineClearAnimation: (clearedLines: number[]) => void;
  updateLineClearAnimation: () => void;
  completeLineClearAnimation: () => void;

  // Game loop related actions
  lockCurrentTetromino: () => boolean; // Returns true if lock was successful
  updateLockDelay: (deltaTime: number) => void;
  resetLockDelay: () => void;
  checkGameOver: () => void;
  shouldLockPiece: () => boolean;
}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector(
    devtools(
      (set, get) => ({
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

        moveDown: () => {
          let moveSuccessful = false;
          set((state) => {
            if (state.isPaused || state.isGameOver) {
              moveSuccessful = false;
              return state;
            }
            const newState = moveTetrominoBy(state, 0, -1); // Note: y decreases when moving down
            moveSuccessful = newState !== state; // Movement successful if state changed
            return newState;
          });
          return moveSuccessful;
        },

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

        resetGame: () => set(() => createPreGameState()),

        startGame: () => set(() => createInitialGameState()),

        // Clear animation-related data (for UI state cleanup)
        clearAnimationData: () =>
          set((state) => ({
            ...state,
            linesClearing: [],
            animationInProgress: false,
            lineClearAnimation: null,
          })),

        // Start line clear animation sequence
        startLineClearAnimation: (clearedLines: number[]) =>
          set((state) => {
            if (clearedLines.length === 0) return state;

            const animationState = createLineClearAnimationState(
              clearedLines,
              DEFAULT_LINE_CLEAR_CONFIG
            );

            return {
              ...state,
              linesClearing: clearedLines,
              animationInProgress: true,
              lineClearAnimation: {
                ...animationState,
                feedbackMessage: getLineClearFeedback(clearedLines.length),
              },
            };
          }),

        // Update line clear animation state
        updateLineClearAnimation: () =>
          set((state) => {
            if (!state.lineClearAnimation) return state;

            const updatedAnimation = updateLineClearAnimationState(
              state.lineClearAnimation,
              DEFAULT_LINE_CLEAR_CONFIG
            );

            return {
              ...state,
              lineClearAnimation: updatedAnimation,
            };
          }),

        // Complete line clear animation and clean up
        completeLineClearAnimation: () =>
          set((state) => {
            if (!state.lineClearAnimation) return state;

            // Only complete if animation is actually finished
            if (!isLineClearAnimationComplete(state.lineClearAnimation)) {
              return state;
            }

            return {
              ...state,
              linesClearing: [],
              animationInProgress: false,
              lineClearAnimation: null,
            };
          }),

        // Game loop related actions
        lockCurrentTetromino: () => {
          let lockSuccessful = false;
          set((state) => {
            if (!state.currentPiece || state.isPaused || state.isGameOver) {
              lockSuccessful = false;
              return state;
            }
            const newState = lockCurrentTetromino(state);
            lockSuccessful = newState !== state;
            return newState;
          });
          return lockSuccessful;
        },

        updateLockDelay: (_deltaTime: number) =>
          set((state) => {
            if (!state.lockDelay || state.isPaused || state.isGameOver) {
              return state;
            }

            // Update lock delay accumulator (implementation depends on your lock delay system)
            // Lock delay is handled in moveTetrominoBy and other functions
            // This is mainly for external timing updates
            return state;
          }),

        resetLockDelay: () =>
          set((state) => ({
            ...state,
            lockDelay: null,
          })),

        checkGameOver: () =>
          set((state) => {
            if (state.isGameOver) return state;

            // Game over check is handled in piece spawning
            // This is mainly for external triggers
            return state;
          }),

        shouldLockPiece: () => {
          const state = get();
          return shouldLockPiece(state);
        },
      }),
      {
        name: "game-store",
      }
    )
  )
);
