import { useCallback, useEffect, useMemo, useRef } from "react";
import { useGameStore } from "@/store/gameStore";
import {
  calculateDeltaTime,
  calculateFallSpeed,
  createFrameRateLimiter,
} from "@/utils/timingUtils";

interface GameLoopState {
  isRunning: boolean;
  lastTime: number;
  accumulatedTime: number;
  frameCount: number;
  lastFpsUpdate: number;
  currentFps: number;
  fallAccumulator: number;
}

interface GameLoopOptions {
  targetFps?: number;
  enableFpsCounter?: boolean;
  maxDeltaTime?: number;
}

/**
 * Main game loop hook using requestAnimationFrame for 60fps gameplay
 * Handles automatic piece falling, lock delay, and consistent timing
 */
export function useGameLoop(options: GameLoopOptions = {}) {
  const { targetFps = 60, enableFpsCounter = false, maxDeltaTime = 100 } = options;

  // Use individual selectors to avoid object recreation
  const lockDelay = useGameStore((state) => state.lockDelay);
  const level = useGameStore((state) => state.level);
  const currentPiece = useGameStore((state) => state.currentPiece);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const isPaused = useGameStore((state) => state.isPaused);
  const isPlaying = useGameStore((state) => state.isPlaying);
  const moveDown = useGameStore((state) => state.moveDown);
  const lockCurrentTetromino = useGameStore((state) => state.lockCurrentTetromino);
  const shouldLockPiece = useGameStore((state) => state.shouldLockPiece);
  const resetLockDelay = useGameStore((state) => state.resetLockDelay);

  // Game loop state
  const loopState = useRef<GameLoopState>({
    isRunning: false,
    lastTime: 0,
    accumulatedTime: 0,
    frameCount: 0,
    lastFpsUpdate: 0,
    currentFps: 0,
    fallAccumulator: 0,
  });

  // Frame rate limiter - memoized for performance
  const frameRateLimiter = useMemo(() => createFrameRateLimiter(targetFps), [targetFps]);

  // Animation frame ID for cleanup
  const animationFrameId = useRef<number | null>(null);

  /**
   * Handle lock delay system with movement/rotation reset counting
   */
  const handleLockDelay = useCallback(() => {
    if (!lockDelay || isPaused || isGameOver || !isPlaying || !currentPiece) {
      return;
    }

    // Check if piece should be locked using existing game logic
    if (shouldLockPiece()) {
      // Lock current piece (this handles line clearing, scoring, and next piece spawning)
      const locked = lockCurrentTetromino();

      if (locked) {
        // Reset lock delay for new piece
        resetLockDelay();
      }
    }
  }, [
    lockDelay,
    isPaused,
    isGameOver,
    isPlaying,
    currentPiece,
    shouldLockPiece,
    lockCurrentTetromino,
    resetLockDelay,
  ]);

  /**
   * Handle automatic piece falling based on level speed
   */
  const handlePieceFall = useCallback(
    (deltaTime: number) => {
      if (!currentPiece || isPaused || isGameOver || !isPlaying) {
        return;
      }

      const fallSpeed = calculateFallSpeed(level);
      loopState.current.fallAccumulator += deltaTime;

      if (loopState.current.fallAccumulator >= fallSpeed) {
        loopState.current.fallAccumulator = 0;

        // Try to move piece down
        const canMoveDown = moveDown();

        // If piece can't move down, check for lock delay
        if (!canMoveDown && currentPiece) {
          handleLockDelay();
        }
      }
    },
    [currentPiece, isPaused, isGameOver, isPlaying, level, moveDown, handleLockDelay]
  );

  /**
   * Update FPS counter (development/debugging feature)
   */
  const updateFpsCounter = useCallback(
    (currentTime: number) => {
      if (!enableFpsCounter) return;

      loopState.current.frameCount++;

      if (currentTime - loopState.current.lastFpsUpdate >= 1000) {
        loopState.current.currentFps = loopState.current.frameCount;
        loopState.current.frameCount = 0;
        loopState.current.lastFpsUpdate = currentTime;
      }
    },
    [enableFpsCounter]
  );

  /**
   * Main game loop function
   */
  const gameLoop = useCallback(
    (currentTime: number) => {
      if (!loopState.current.isRunning) {
        return;
      }

      // Skip frame if rate limiter says so
      if (frameRateLimiter.shouldSkipFrame(currentTime)) {
        animationFrameId.current = requestAnimationFrame(gameLoop);
        return;
      }

      // Calculate delta time
      const deltaTime =
        loopState.current.lastTime === 0
          ? 0
          : calculateDeltaTime(currentTime, loopState.current.lastTime);

      // Cap delta time to prevent large jumps
      const cappedDeltaTime = Math.min(deltaTime, maxDeltaTime);

      // Update timers
      loopState.current.lastTime = currentTime;
      loopState.current.accumulatedTime += cappedDeltaTime;

      // Only process game logic if not paused
      if (!isPaused && !isGameOver && isPlaying) {
        // Handle automatic piece falling
        handlePieceFall(cappedDeltaTime);
      }

      // Update FPS counter
      updateFpsCounter(currentTime);

      // Schedule next frame
      animationFrameId.current = requestAnimationFrame(gameLoop);
    },
    [
      isPaused,
      isGameOver,
      isPlaying,
      handlePieceFall,
      updateFpsCounter,
      maxDeltaTime,
      frameRateLimiter.shouldSkipFrame,
    ]
  );

  /**
   * Start the game loop
   */
  const startLoop = useCallback(() => {
    if (loopState.current.isRunning) {
      return;
    }

    loopState.current.isRunning = true;
    loopState.current.lastTime = 0;
    loopState.current.accumulatedTime = 0;
    loopState.current.fallAccumulator = 0;

    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  /**
   * Stop the game loop
   */
  const stopLoop = useCallback(() => {
    loopState.current.isRunning = false;

    if (animationFrameId.current !== null) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
  }, []);

  /**
   * Pause/resume the game loop
   */
  const togglePause = useCallback(() => {
    // This will be handled by the game state pause flag
    // The loop continues running but game logic is skipped
  }, []);

  /**
   * Reset loop timers (useful when game restarts)
   */
  const resetTimers = useCallback(() => {
    loopState.current.lastTime = 0;
    loopState.current.accumulatedTime = 0;
    loopState.current.fallAccumulator = 0;
    loopState.current.frameCount = 0;
    loopState.current.lastFpsUpdate = 0;
  }, []);

  /**
   * Get current loop performance metrics
   */
  const getMetrics = useCallback(
    () => ({
      fps: loopState.current.currentFps,
      isRunning: loopState.current.isRunning,
      accumulatedTime: loopState.current.accumulatedTime,
      fallAccumulator: loopState.current.fallAccumulator,
    }),
    []
  );

  // Start loop when game is active, stop when game ends
  useEffect(() => {
    if (!isGameOver && !isPaused && isPlaying) {
      startLoop();
    } else if (isGameOver) {
      stopLoop();
    }

    return () => {
      stopLoop();
    };
  }, [isGameOver, isPaused, isPlaying, startLoop, stopLoop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLoop();
    };
  }, [stopLoop]);

  // Reset timers when game resets (using separate selectors to avoid object recreation)
  const score = useGameStore((state) => state.score);
  const lines = useGameStore((state) => state.lines);

  useEffect(() => {
    if (score === 0 && lines === 0 && level === 1) {
      resetTimers();
    }
  }, [score, lines, level, resetTimers]);

  return {
    startLoop,
    stopLoop,
    togglePause,
    resetTimers,
    getMetrics,
    isRunning: loopState.current.isRunning,
    currentFps: enableFpsCounter ? loopState.current.currentFps : undefined,
  };
}
