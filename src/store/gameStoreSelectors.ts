// Optimized selectors for common game store operations
// These selectors prevent unnecessary re-renders by only subscribing to specific state slices

import { useGameStore } from "./gameStore";

/**
 * Selector for board state only - prevents re-renders when other state changes
 */
export const useBoardState = () =>
  useGameStore((state) => ({
    board: state.board,
    currentPiece: state.currentPiece,
    ghostPosition: state.ghostPosition,
  }));

/**
 * Selector for score display - prevents re-renders when game pieces change
 */
export const useScoreState = () =>
  useGameStore((state) => ({
    score: state.score,
    lines: state.lines,
    level: state.level,
  }));

/**
 * Selector for piece previews - only updates when relevant pieces change
 */
export const usePiecePreviewState = () =>
  useGameStore((state) => ({
    nextPiece: state.nextPiece,
    heldPiece: state.heldPiece,
    canHold: state.canHold,
  }));

/**
 * Selector for game status - prevents re-renders during active gameplay
 */
export const useGameStatus = () =>
  useGameStore((state) => ({
    isGameOver: state.isGameOver,
    isPaused: state.isPaused,
  }));

/**
 * Selector for animation state - only updates when animations change
 */
export const useAnimationState = () =>
  useGameStore((state) => ({
    linesClearing: state.linesClearing,
    animationInProgress: state.animationInProgress,
  }));

/**
 * Selector for timing-sensitive data - optimized for game loop
 */
export const useTimingState = () =>
  useGameStore((state) => ({
    lockDelay: state.lockDelay,
    level: state.level,
    currentPiece: state.currentPiece,
    isGameOver: state.isGameOver,
    isPaused: state.isPaused,
  }));

/**
 * Shallow comparison selector for stable references
 */
export const useGameActions = () =>
  useGameStore((state) => ({
    moveLeft: state.moveLeft,
    moveRight: state.moveRight,
    moveDown: state.moveDown,
    rotate: state.rotate,
    drop: state.drop,
    holdPiece: state.holdPiece,
    togglePause: state.togglePause,
    resetGame: state.resetGame,
  }));

/**
 * Optimized selector for components that only need to know if game is active
 */
export const useIsGameActive = () => useGameStore((state) => !state.isGameOver && !state.isPaused);

/**
 * Optimized selector for current piece position (for collision detection)
 */
export const useCurrentPiecePosition = () =>
  useGameStore((state) =>
    state.currentPiece
      ? {
          x: state.currentPiece.position.x,
          y: state.currentPiece.position.y,
          type: state.currentPiece.type,
          rotation: state.currentPiece.rotation,
        }
      : null
  );

/**
 * Selector for lock delay information (for timing-critical operations)
 */
export const useLockDelayState = () => useGameStore((state) => state.lockDelay);
