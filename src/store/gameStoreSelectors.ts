// Optimized selectors for common game store operations
// These selectors prevent unnecessary re-renders by only subscribing to specific state slices

import { shallow } from "zustand/shallow";
import { useGameStore } from "./gameStore";

/**
 * Selector for board state only - prevents re-renders when other state changes
 */
export const useBoardState = () =>
  useGameStore(
    (state) => ({
      board: state.board,
      currentPiece: state.currentPiece,
      ghostPosition: state.ghostPosition,
    }),
    shallow
  );

/**
 * Selector for score display - prevents re-renders when game pieces change
 */
export const useScoreState = () =>
  useGameStore(
    (state) => ({
      score: state.score,
      lines: state.lines,
      level: state.level,
    }),
    shallow
  );

/**
 * Selector for piece previews - only updates when relevant pieces change
 */
export const usePiecePreviewState = () =>
  useGameStore(
    (state) => ({
      nextPiece: state.nextPiece,
      heldPiece: state.heldPiece,
      canHold: state.canHold,
    }),
    shallow
  );

/**
 * Selector for game status - prevents re-renders during active gameplay
 */
export const useGameStatus = () =>
  useGameStore(
    (state) => ({
      isGameOver: state.isGameOver,
      isPaused: state.isPaused,
    }),
    shallow
  );

/**
 * Selector for animation state - only updates when animations change
 */
export const useAnimationState = () =>
  useGameStore(
    (state) => ({
      linesClearing: state.linesClearing,
      animationInProgress: state.animationInProgress,
    }),
    shallow
  );

/**
 * Selector for timing-sensitive data - optimized for game loop
 */
export const useTimingState = () =>
  useGameStore(
    (state) => ({
      lockDelay: state.lockDelay,
      level: state.level,
      currentPiece: state.currentPiece,
      isGameOver: state.isGameOver,
      isPaused: state.isPaused,
    }),
    shallow
  );

/**
 * Individual action selectors for stable references
 */
export const useMoveActions = () => {
  const moveLeft = useGameStore((state) => state.moveLeft);
  const moveRight = useGameStore((state) => state.moveRight);
  const moveDown = useGameStore((state) => state.moveDown);
  const rotate = useGameStore((state) => state.rotate);
  const drop = useGameStore((state) => state.drop);
  const holdPiece = useGameStore((state) => state.holdPiece);
  return { moveLeft, moveRight, moveDown, rotate, drop, holdPiece };
};

export const useGameActions = () => {
  const togglePause = useGameStore((state) => state.togglePause);
  const resetGame = useGameStore((state) => state.resetGame);
  const lockCurrentTetromino = useGameStore((state) => state.lockCurrentTetromino);
  const shouldLockPiece = useGameStore((state) => state.shouldLockPiece);
  const resetLockDelay = useGameStore((state) => state.resetLockDelay);
  return { togglePause, resetGame, lockCurrentTetromino, shouldLockPiece, resetLockDelay };
};

/**
 * Optimized selector for components that only need to know if game is active
 */
export const useIsGameActive = () => useGameStore((state) => !state.isGameOver && !state.isPaused);

/**
 * Optimized selector for current piece position (for collision detection)
 */
export const useCurrentPiecePosition = () =>
  useGameStore(
    (state) =>
      state.currentPiece
        ? {
            x: state.currentPiece.position.x,
            y: state.currentPiece.position.y,
            type: state.currentPiece.type,
            rotation: state.currentPiece.rotation,
          }
        : null,
    shallow
  );

/**
 * Selector for lock delay information (for timing-critical operations)
 */
export const useLockDelayState = () => useGameStore((state) => state.lockDelay);
