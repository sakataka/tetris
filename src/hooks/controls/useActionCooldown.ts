import { useCallback, useRef } from "react";
import {
  type ActionCooldownManager,
  type ActionType,
  createActionCooldownManager,
  createInputDebouncer,
  type InputDebouncer,
  type InputDebouncerConfig,
} from "@/utils/actionCooldown";

export interface UseActionCooldownConfig {
  customCooldowns?: Partial<Record<ActionType, number>>;
  debouncerConfig?: Partial<InputDebouncerConfig>;
}

export interface UseActionCooldownReturn {
  isActionAllowed: (actionType: ActionType) => boolean;
  recordAction: (actionType: ActionType) => boolean;
  resetCooldown: (actionType: ActionType) => void;
  resetAllCooldowns: () => void;
  getCooldownRemaining: (actionType: ActionType) => number;
  shouldAllowInput: () => boolean;
  recordInput: () => void;
  resetDebouncer: () => void;
  getInputRate: () => number;
}

/**
 * React hook for managing action cooldowns and input debouncing
 * Provides rate limiting for game actions to prevent spam and ensure smooth gameplay
 *
 * @param config Configuration for cooldowns and debouncing
 * @returns Object with cooldown and debouncing functions
 *
 * @example
 * ```typescript
 * const { isActionAllowed, recordAction } = useActionCooldown({
 *   customCooldowns: { rotation: 150 }, // Custom rotation cooldown
 *   debouncerConfig: { debounceTime: 30 } // Custom debounce time
 * });
 *
 * const handleRotate = () => {
 *   if (isActionAllowed('rotation')) {
 *     recordAction('rotation');
 *     // Execute rotation logic
 *   }
 * };
 * ```
 */
export function useActionCooldown(config: UseActionCooldownConfig = {}): UseActionCooldownReturn {
  const { customCooldowns, debouncerConfig } = config;

  // Use refs to maintain stable instances across re-renders
  const cooldownManagerRef = useRef<ActionCooldownManager | null>(null);
  const debouncerRef = useRef<InputDebouncer | null>(null);

  // Initialize cooldown manager on first render
  if (cooldownManagerRef.current === null) {
    cooldownManagerRef.current = createActionCooldownManager(customCooldowns);
  }

  // Initialize input debouncer on first render
  if (debouncerRef.current === null) {
    debouncerRef.current = createInputDebouncer(debouncerConfig);
  }

  const cooldownManager = cooldownManagerRef.current;
  const debouncer = debouncerRef.current;

  // Stable callback functions using useCallback
  const isActionAllowed = useCallback(
    (actionType: ActionType): boolean => {
      return cooldownManager.isActionAllowed(actionType);
    },
    [cooldownManager]
  );

  const recordAction = useCallback(
    (actionType: ActionType): boolean => {
      return cooldownManager.recordAction(actionType);
    },
    [cooldownManager]
  );

  const resetCooldown = useCallback(
    (actionType: ActionType): void => {
      cooldownManager.resetCooldown(actionType);
    },
    [cooldownManager]
  );

  const resetAllCooldowns = useCallback((): void => {
    cooldownManager.resetAllCooldowns();
  }, [cooldownManager]);

  const getCooldownRemaining = useCallback(
    (actionType: ActionType): number => {
      return cooldownManager.getCooldownRemaining(actionType);
    },
    [cooldownManager]
  );

  const shouldAllowInput = useCallback((): boolean => {
    return debouncer.shouldAllowInput();
  }, [debouncer]);

  const recordInput = useCallback((): void => {
    debouncer.recordInput();
  }, [debouncer]);

  const resetDebouncer = useCallback((): void => {
    debouncer.reset();
  }, [debouncer]);

  const getInputRate = useCallback((): number => {
    return debouncer.getInputRate();
  }, [debouncer]);

  return {
    isActionAllowed,
    recordAction,
    resetCooldown,
    resetAllCooldowns,
    getCooldownRemaining,
    shouldAllowInput,
    recordInput,
    resetDebouncer,
    getInputRate,
  };
}

/**
 * Predefined configurations for common use cases
 */
export const COOLDOWN_PRESETS = {
  // Standard configuration for normal gameplay
  standard: {
    customCooldowns: {},
    debouncerConfig: { debounceTime: 50, maxInputsPerSecond: 15 },
  },

  // Responsive configuration for competitive play
  responsive: {
    customCooldowns: {
      movement: 30,
      rotation: 80,
      drop: 30,
    },
    debouncerConfig: { debounceTime: 30, maxInputsPerSecond: 20 },
  },

  // Relaxed configuration for casual play
  relaxed: {
    customCooldowns: {
      movement: 80,
      rotation: 150,
      drop: 80,
      hardDrop: 400,
      hold: 300,
    },
    debouncerConfig: { debounceTime: 80, maxInputsPerSecond: 10 },
  },

  // Mobile-optimized configuration with longer cooldowns for touch
  mobile: {
    customCooldowns: {
      movement: 100,
      rotation: 200,
      drop: 100,
      hardDrop: 500,
      hold: 400,
    },
    debouncerConfig: { debounceTime: 100, maxInputsPerSecond: 8 },
  },
} as const;

/**
 * Convenience hook for using predefined cooldown configurations
 *
 * @param preset Preset configuration name
 * @returns useActionCooldown return value with preset configuration
 *
 * @example
 * ```typescript
 * const cooldowns = useActionCooldownPreset('responsive');
 * ```
 */
export function useActionCooldownPreset(
  preset: keyof typeof COOLDOWN_PRESETS
): UseActionCooldownReturn {
  return useActionCooldown(COOLDOWN_PRESETS[preset]);
}
