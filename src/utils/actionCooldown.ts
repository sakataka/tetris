// Action cooldown and input rate limiting utilities

export type ActionType = "movement" | "rotation" | "drop" | "hardDrop" | "hold";

// Default cooldown times for different actions (in milliseconds)
const DEFAULT_COOLDOWNS: Record<ActionType, number> = {
  movement: 50, // DAS repeat rate
  rotation: 100, // Rotation cooldown
  drop: 50, // Soft drop rate
  hardDrop: 300, // Hard drop cooldown
  hold: 200, // Hold action cooldown
};

// Input debouncing configuration
export interface InputDebouncerConfig {
  debounceTime: number; // Minimum time between inputs (ms)
  maxInputsPerSecond: number; // Maximum allowed inputs per second
}

const DEFAULT_DEBOUNCER_CONFIG: InputDebouncerConfig = {
  debounceTime: 50,
  maxInputsPerSecond: 15,
};

/**
 * Action cooldown manager interface
 */
export interface ActionCooldownManager {
  isActionAllowed: (actionType: ActionType) => boolean;
  recordAction: (actionType: ActionType) => boolean;
  resetCooldown: (actionType: ActionType) => void;
  resetAllCooldowns: () => void;
  getCooldownRemaining: (actionType: ActionType) => number;
}

/**
 * Input debouncer interface
 */
export interface InputDebouncer {
  shouldAllowInput: () => boolean;
  recordInput: () => void;
  reset: () => void;
  getInputRate: () => number;
}

/**
 * Create an action cooldown manager
 * @param customCooldowns Optional custom cooldown times
 * @returns ActionCooldownManager instance
 */
export function createActionCooldownManager(
  customCooldowns?: Partial<Record<ActionType, number>>
): ActionCooldownManager {
  const cooldowns = { ...DEFAULT_COOLDOWNS, ...customCooldowns };
  const lastActionTimes: Partial<Record<ActionType, number>> = {};

  return {
    isActionAllowed(actionType: ActionType): boolean {
      const lastTime = lastActionTimes[actionType];
      if (lastTime === undefined) {
        return true; // No previous action recorded
      }

      const currentTime = performance.now();
      const timeSinceLastAction = currentTime - lastTime;
      return timeSinceLastAction >= cooldowns[actionType];
    },

    recordAction(actionType: ActionType): boolean {
      if (!this.isActionAllowed(actionType)) {
        return false; // Action not allowed due to cooldown
      }

      lastActionTimes[actionType] = performance.now();
      return true;
    },

    resetCooldown(actionType: ActionType): void {
      delete lastActionTimes[actionType];
    },

    resetAllCooldowns(): void {
      for (const actionType in lastActionTimes) {
        delete lastActionTimes[actionType as ActionType];
      }
    },

    getCooldownRemaining(actionType: ActionType): number {
      const lastTime = lastActionTimes[actionType];
      if (lastTime === undefined) {
        return 0; // No cooldown active
      }

      const currentTime = performance.now();
      const timeSinceLastAction = currentTime - lastTime;
      const remainingTime = cooldowns[actionType] - timeSinceLastAction;

      return Math.max(0, remainingTime);
    },
  };
}

/**
 * Create an input debouncer to prevent rapid input spam
 * @param config Optional debouncer configuration
 * @returns InputDebouncer instance
 */
export function createInputDebouncer(config: Partial<InputDebouncerConfig> = {}): InputDebouncer {
  const { debounceTime, maxInputsPerSecond } = { ...DEFAULT_DEBOUNCER_CONFIG, ...config };

  let lastInputTime = 0;
  const inputHistory: number[] = [];
  const RATE_LIMIT_WINDOW = 1000; // 1 second window for rate limiting

  return {
    shouldAllowInput(): boolean {
      const currentTime = performance.now();

      // Check debounce time
      if (currentTime - lastInputTime < debounceTime) {
        return false;
      }

      // Clean old inputs from history (older than 1 second)
      const cutoffTime = currentTime - RATE_LIMIT_WINDOW;
      while (inputHistory.length > 0 && inputHistory[0] < cutoffTime) {
        inputHistory.shift();
      }

      // Check rate limit
      if (inputHistory.length >= maxInputsPerSecond) {
        return false;
      }

      return true;
    },

    recordInput(): void {
      const currentTime = performance.now();
      lastInputTime = currentTime;
      inputHistory.push(currentTime);

      // Keep history size reasonable
      if (inputHistory.length > maxInputsPerSecond * 2) {
        inputHistory.shift();
      }
    },

    reset(): void {
      lastInputTime = 0;
      inputHistory.length = 0;
    },

    getInputRate(): number {
      const currentTime = performance.now();
      const cutoffTime = currentTime - RATE_LIMIT_WINDOW;

      // Count inputs in the last second
      const recentInputs = inputHistory.filter((time) => time >= cutoffTime);
      return recentInputs.length;
    },
  };
}

/**
 * Check if rapid input should be filtered based on input history
 * @param inputHistory Array of input timestamps
 * @param minInterval Minimum interval between inputs (ms)
 * @returns True if input should be filtered
 */
export function shouldFilterRapidInput(inputHistory: number[], minInterval: number): boolean {
  if (inputHistory.length < 2) {
    return false; // Need at least 2 inputs to check interval
  }

  // Check the interval between the last two inputs
  const lastInput = inputHistory[inputHistory.length - 1];
  const secondLastInput = inputHistory[inputHistory.length - 2];
  const interval = lastInput - secondLastInput;

  return interval < minInterval;
}

/**
 * Standalone function to check if an action is allowed
 * @param actionType Type of action
 * @param lastActionTime Timestamp of last action
 * @param cooldownTime Cooldown duration for this action
 * @returns True if action is allowed
 */
export function isActionAllowed(
  actionType: ActionType,
  lastActionTime: number | undefined,
  cooldownTime?: number
): boolean {
  if (lastActionTime === undefined) {
    return true;
  }

  const currentTime = performance.now();
  const timeSinceLastAction = currentTime - lastActionTime;
  const requiredCooldown = cooldownTime ?? DEFAULT_COOLDOWNS[actionType];

  return timeSinceLastAction >= requiredCooldown;
}

/**
 * Reset cooldown for a specific action type
 * @param actionType Type of action to reset
 * @param lastActionTimes Object containing last action times
 */
export function resetCooldown(
  actionType: ActionType,
  lastActionTimes: Partial<Record<ActionType, number>>
): void {
  delete lastActionTimes[actionType];
}

/**
 * Reset all cooldowns
 * @param lastActionTimes Object containing last action times
 */
export function resetAllCooldowns(lastActionTimes: Partial<Record<ActionType, number>>): void {
  for (const actionType in lastActionTimes) {
    delete lastActionTimes[actionType as ActionType];
  }
}

/**
 * Get remaining cooldown time for an action
 * @param actionType Type of action
 * @param lastActionTime Timestamp of last action
 * @param cooldownTime Cooldown duration for this action
 * @returns Remaining cooldown time in milliseconds
 */
export function getCooldownRemaining(
  actionType: ActionType,
  lastActionTime: number | undefined,
  cooldownTime?: number
): number {
  if (lastActionTime === undefined) {
    return 0;
  }

  const currentTime = performance.now();
  const timeSinceLastAction = currentTime - lastActionTime;
  const requiredCooldown = cooldownTime ?? DEFAULT_COOLDOWNS[actionType];
  const remainingTime = requiredCooldown - timeSinceLastAction;

  return Math.max(0, remainingTime);
}

/**
 * Create a rate limiter for specific input patterns
 * @param maxCount Maximum allowed actions in time window
 * @param timeWindow Time window in milliseconds
 * @returns Rate limiter function
 */
export function createRateLimiter(
  maxCount: number,
  timeWindow: number
): (timestamp?: number) => boolean {
  const actionHistory: number[] = [];

  return function isAllowed(timestamp?: number): boolean {
    const currentTime = timestamp ?? performance.now();

    // Remove old actions outside the time window
    const cutoffTime = currentTime - timeWindow;
    while (actionHistory.length > 0 && actionHistory[0] < cutoffTime) {
      actionHistory.shift();
    }

    // Check if we're under the rate limit
    if (actionHistory.length < maxCount) {
      actionHistory.push(currentTime);
      return true;
    }

    return false;
  };
}
