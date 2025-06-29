// Game timing and frame rate utilities

export type ActionType = "movement" | "rotation" | "drop" | "hardDrop" | "hold";

// Game constants for timing
const GAME_TIMING = {
  INITIAL_DROP_SPEED: 1000, // 1 second at level 1
  MIN_DROP_SPEED: 100, // Minimum fall speed (level 10+)
  SPEED_DECREASE_PER_LEVEL: 100, // Speed increase per level

  // DAS (Delayed Auto Shift) configuration
  DAS_INITIAL_DELAY: 170, // Initial delay before auto-repeat
  DAS_REPEAT_RATE: 50, // Time between auto-repeats

  // Action cooldowns (in milliseconds)
  MOVEMENT_COOLDOWN: 50,
  ROTATION_COOLDOWN: 100,
  DROP_COOLDOWN: 50,
  HARD_DROP_COOLDOWN: 300,
  HOLD_COOLDOWN: 200,
  DEFAULT_COOLDOWN: 100,

  // Frame timing
  MIN_FRAME_INTERVAL: 6, // ~166fps max
  MAX_FRAME_INTERVAL: 100, // ~10fps min
  MAX_DELTA_TIME: 100, // Cap large frame deltas
  MIN_NORMALIZED_TIME: 0.1,
  MAX_NORMALIZED_TIME: 10,
} as const;

/**
 * Calculate fall speed in milliseconds based on current level
 * Level 1: 1000ms, decreases by 100ms per level, minimum 100ms
 */
export function calculateFallSpeed(level: number): number {
  const speed = GAME_TIMING.INITIAL_DROP_SPEED - (level - 1) * GAME_TIMING.SPEED_DECREASE_PER_LEVEL;
  return Math.max(GAME_TIMING.MIN_DROP_SPEED, speed);
}

/**
 * Validate if a timing interval is reasonable for game logic
 * Accepts intervals between ~6ms (166fps) and 100ms (10fps)
 */
export function validateTimingInterval(interval: number): boolean {
  return (
    interval > 0 &&
    interval >= GAME_TIMING.MIN_FRAME_INTERVAL &&
    interval <= GAME_TIMING.MAX_FRAME_INTERVAL
  );
}

/**
 * Calculate cooldown time for different action types
 */
export function calculateActionCooldown(actionType: ActionType): number {
  switch (actionType) {
    case "movement":
      return GAME_TIMING.MOVEMENT_COOLDOWN;
    case "rotation":
      return GAME_TIMING.ROTATION_COOLDOWN;
    case "drop":
      return GAME_TIMING.DROP_COOLDOWN;
    case "hardDrop":
      return GAME_TIMING.HARD_DROP_COOLDOWN;
    case "hold":
      return GAME_TIMING.HOLD_COOLDOWN;
    default:
      return GAME_TIMING.DEFAULT_COOLDOWN;
  }
}

/**
 * Frame rate limiter interface
 */
export interface FrameRateLimiter {
  targetInterval: number;
  lastFrameTime: number;
  shouldSkipFrame: (currentTime: number) => boolean;
}

/**
 * Create a frame rate limiter for consistent timing
 */
export function createFrameRateLimiter(targetFps: number): FrameRateLimiter {
  const targetInterval = 1000 / targetFps;
  let lastFrameTime = 0;

  return {
    targetInterval,
    lastFrameTime,
    shouldSkipFrame(currentTime: number): boolean {
      if (lastFrameTime === 0) {
        lastFrameTime = currentTime;
        return false;
      }

      const deltaTime = currentTime - lastFrameTime;

      if (deltaTime >= targetInterval) {
        lastFrameTime = currentTime;
        return false;
      }

      return true;
    },
  };
}

/**
 * Check if timing is consistent across multiple timestamps
 * @param timestamps Array of timestamp values
 * @param expectedInterval Expected interval between timestamps
 * @param tolerance Allowed deviation in milliseconds
 */
export function isTimingConsistent(
  timestamps: number[],
  expectedInterval: number,
  tolerance: number
): boolean {
  if (timestamps.length <= 1) {
    return true; // Single or no timestamps are consistent
  }

  for (let i = 1; i < timestamps.length; i++) {
    const actualInterval = timestamps[i] - timestamps[i - 1];
    const deviation = Math.abs(actualInterval - expectedInterval);

    if (deviation > tolerance) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate delta time between frames, with safety caps
 */
export function calculateDeltaTime(currentTime: number, lastTime: number): number {
  const deltaTime = currentTime - lastTime;

  // Clamp negative deltas (time went backwards)
  if (deltaTime < 0) {
    return 0;
  }

  // Cap extremely large deltas (tab switching, etc.)
  return Math.min(deltaTime, GAME_TIMING.MAX_DELTA_TIME);
}

/**
 * Normalize frame time to a target fps multiplier
 * Returns a multiplier where 1.0 = target fps, 2.0 = half target fps, etc.
 */
export function normalizeFrameTime(frameTime: number, targetFps: number): number {
  const targetInterval = 1000 / targetFps;
  const multiplier = frameTime / targetInterval;

  // Clamp to reasonable bounds
  return Math.max(
    GAME_TIMING.MIN_NORMALIZED_TIME,
    Math.min(GAME_TIMING.MAX_NORMALIZED_TIME, multiplier)
  );
}

/**
 * Get current high-resolution timestamp
 */
export function getCurrentTime(): number {
  return performance.now();
}

/**
 * Sleep for a specific duration (for testing purposes)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a precise interval timer using setTimeout
 */
export function createPreciseInterval(
  callback: () => void,
  interval: number
): { start: () => void; stop: () => void } {
  let timeoutId: number | null = null;
  let startTime = 0;
  let expectedTime = 0;

  function tick() {
    const drift = getCurrentTime() - expectedTime;
    callback();

    expectedTime += interval;
    timeoutId = setTimeout(tick, Math.max(0, interval - drift));
  }

  return {
    start() {
      if (timeoutId !== null) return;

      startTime = getCurrentTime();
      expectedTime = startTime + interval;
      timeoutId = setTimeout(tick, interval);
    },

    stop() {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
  };
}
