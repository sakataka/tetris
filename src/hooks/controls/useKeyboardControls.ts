import { useCallback, useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";
import { DAS_CONSTANTS } from "@/utils/gameConstants";
import { useActionCooldown } from "./useActionCooldown";

export interface KeyboardControlsConfig {
  enableDAS?: boolean; // Enable Delayed Auto Shift for movement keys
  customKeybindings?: Partial<KeyBindings>;
  dasConfig?: {
    initialDelay?: number;
    repeatRate?: number;
    softDropRate?: number;
  };
}

export interface KeyBindings {
  // Movement
  moveLeft: string[];
  moveRight: string[];
  softDrop: string[];
  hardDrop: string[];

  // Rotation
  rotateCW: string[];
  rotateCCW: string[];

  // Game actions
  hold: string[];
  pause: string[];
  reset: string[];
  confirm: string[];
}

// Default key bindings based on specification
const DEFAULT_KEY_BINDINGS: KeyBindings = {
  moveLeft: ["ArrowLeft"],
  moveRight: ["ArrowRight"],
  softDrop: ["ArrowDown"],
  hardDrop: [" ", "Space"], // Space key
  rotateCW: ["ArrowUp", "x", "X"],
  rotateCCW: ["z", "Z"],
  hold: ["c", "C"],
  pause: ["p", "P", "Escape"],
  reset: ["r", "R"],
  confirm: ["Enter"],
};

interface DASState {
  leftPressed: boolean;
  rightPressed: boolean;
  downPressed: boolean;
  lastLeftTime: number;
  lastRightTime: number;
  lastDownTime: number;
  leftRepeatStarted: boolean;
  rightRepeatStarted: boolean;
  downRepeatStarted: boolean;
}

/**
 * React hook for handling keyboard controls with DAS (Delayed Auto Shift) support
 * Provides responsive keyboard input handling for Tetris gameplay
 *
 * @param config Configuration for keyboard controls and DAS
 *
 * @example
 * ```typescript
 * const useKeyboardControls({
 *   enableDAS: true,
 *   dasConfig: { initialDelay: 150, repeatRate: 40 }
 * });
 * ```
 */
export function useKeyboardControls(config: KeyboardControlsConfig = {}) {
  const { enableDAS = true, customKeybindings = {}, dasConfig = {} } = config;

  // Merge custom keybindings with defaults
  const keyBindings: KeyBindings = {
    ...DEFAULT_KEY_BINDINGS,
    ...customKeybindings,
  };

  // DAS configuration
  const dasSettings = {
    initialDelay: dasConfig.initialDelay ?? DAS_CONSTANTS.INITIAL_DELAY,
    repeatRate: dasConfig.repeatRate ?? DAS_CONSTANTS.REPEAT_RATE,
    softDropRate: dasConfig.softDropRate ?? DAS_CONSTANTS.SOFT_DROP_RATE,
  };

  // Game store actions
  const {
    moveLeft,
    moveRight,
    moveDown,
    rotate,
    drop,
    holdPiece,
    togglePause,
    resetGame,
    isGameOver,
    isPaused,
    isPlaying,
  } = useGameStore();

  // Action cooldown management
  const { isActionAllowed, recordAction } = useActionCooldown({
    customCooldowns: {
      movement: dasSettings.repeatRate,
      rotation: 100,
      drop: dasSettings.softDropRate,
      hardDrop: 300,
      hold: 200,
    },
  });

  // DAS state management
  const dasState = useRef<DASState>({
    leftPressed: false,
    rightPressed: false,
    downPressed: false,
    lastLeftTime: 0,
    lastRightTime: 0,
    lastDownTime: 0,
    leftRepeatStarted: false,
    rightRepeatStarted: false,
    downRepeatStarted: false,
  });

  // Animation frame ID for DAS repeat
  const dasAnimationFrame = useRef<number | null>(null);

  // Helper function to check if key matches binding
  const isKeyMatch = useCallback((key: string, bindings: string[]): boolean => {
    return bindings.some(
      (binding) =>
        binding === key ||
        (binding === " " && key === "Space") ||
        (binding === "Space" && key === " ")
    );
  }, []);

  // Execute DAS repeat for pressed keys
  const executeDASRepeat = useCallback(() => {
    if (!enableDAS) return;

    const currentTime = performance.now();
    const state = dasState.current;

    // Handle left movement repeat
    if (state.leftPressed) {
      const timeSincePress = currentTime - state.lastLeftTime;

      if (!state.leftRepeatStarted && timeSincePress >= dasSettings.initialDelay) {
        state.leftRepeatStarted = true;
        state.lastLeftTime = currentTime;
      } else if (state.leftRepeatStarted && timeSincePress >= dasSettings.repeatRate) {
        if (isActionAllowed("movement") && !isPaused && !isGameOver && isPlaying) {
          recordAction("movement");
          moveLeft();
          state.lastLeftTime = currentTime;
        }
      }
    }

    // Handle right movement repeat
    if (state.rightPressed) {
      const timeSincePress = currentTime - state.lastRightTime;

      if (!state.rightRepeatStarted && timeSincePress >= dasSettings.initialDelay) {
        state.rightRepeatStarted = true;
        state.lastRightTime = currentTime;
      } else if (state.rightRepeatStarted && timeSincePress >= dasSettings.repeatRate) {
        if (isActionAllowed("movement") && !isPaused && !isGameOver && isPlaying) {
          recordAction("movement");
          moveRight();
          state.lastRightTime = currentTime;
        }
      }
    }

    // Handle soft drop repeat
    if (state.downPressed) {
      const timeSincePress = currentTime - state.lastDownTime;

      if (!state.downRepeatStarted && timeSincePress >= dasSettings.initialDelay) {
        state.downRepeatStarted = true;
        state.lastDownTime = currentTime;
      } else if (state.downRepeatStarted && timeSincePress >= dasSettings.softDropRate) {
        if (isActionAllowed("drop") && !isPaused && !isGameOver && isPlaying) {
          recordAction("drop");
          moveDown();
          state.lastDownTime = currentTime;
        }
      }
    }

    // Continue DAS repeat if any keys are pressed
    if (state.leftPressed || state.rightPressed || state.downPressed) {
      dasAnimationFrame.current = requestAnimationFrame(executeDASRepeat);
    }
  }, [
    enableDAS,
    dasSettings,
    isActionAllowed,
    recordAction,
    moveLeft,
    moveRight,
    moveDown,
    isPaused,
    isGameOver,
    isPlaying,
  ]);

  // Handle keydown events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const key = event.key;

      // Prevent default behavior for game keys
      if (Object.values(keyBindings).some((bindings) => isKeyMatch(key, bindings))) {
        event.preventDefault();
      }

      // Handle movement keys with DAS
      if (isKeyMatch(key, keyBindings.moveLeft)) {
        if (!dasState.current.leftPressed) {
          // Initial press
          if (isActionAllowed("movement") && !isPaused && !isGameOver && isPlaying) {
            recordAction("movement");
            moveLeft();
          }

          if (enableDAS) {
            dasState.current.leftPressed = true;
            dasState.current.lastLeftTime = performance.now();
            dasState.current.leftRepeatStarted = false;

            // Start DAS repeat loop
            if (dasAnimationFrame.current === null) {
              dasAnimationFrame.current = requestAnimationFrame(executeDASRepeat);
            }
          }
        }
        return;
      }

      if (isKeyMatch(key, keyBindings.moveRight)) {
        if (!dasState.current.rightPressed) {
          // Initial press
          if (isActionAllowed("movement") && !isPaused && !isGameOver && isPlaying) {
            recordAction("movement");
            moveRight();
          }

          if (enableDAS) {
            dasState.current.rightPressed = true;
            dasState.current.lastRightTime = performance.now();
            dasState.current.rightRepeatStarted = false;

            // Start DAS repeat loop
            if (dasAnimationFrame.current === null) {
              dasAnimationFrame.current = requestAnimationFrame(executeDASRepeat);
            }
          }
        }
        return;
      }

      if (isKeyMatch(key, keyBindings.softDrop)) {
        if (!dasState.current.downPressed) {
          // Initial press
          if (isActionAllowed("drop") && !isPaused && !isGameOver && isPlaying) {
            recordAction("drop");
            moveDown();
          }

          if (enableDAS) {
            dasState.current.downPressed = true;
            dasState.current.lastDownTime = performance.now();
            dasState.current.downRepeatStarted = false;

            // Start DAS repeat loop
            if (dasAnimationFrame.current === null) {
              dasAnimationFrame.current = requestAnimationFrame(executeDASRepeat);
            }
          }
        }
        return;
      }

      // Handle non-repeating keys (single action per press)
      if (isKeyMatch(key, keyBindings.hardDrop)) {
        if (isActionAllowed("hardDrop") && !isPaused && !isGameOver && isPlaying) {
          recordAction("hardDrop");
          drop();
        }
        return;
      }

      if (isKeyMatch(key, keyBindings.rotateCW)) {
        if (isActionAllowed("rotation") && !isPaused && !isGameOver && isPlaying) {
          recordAction("rotation");
          rotate();
        }
        return;
      }

      if (isKeyMatch(key, keyBindings.rotateCCW)) {
        // TODO: Implement counter-clockwise rotation when available
        if (isActionAllowed("rotation") && !isPaused && !isGameOver && isPlaying) {
          recordAction("rotation");
          // For now, use clockwise rotation
          rotate();
        }
        return;
      }

      if (isKeyMatch(key, keyBindings.hold)) {
        if (isActionAllowed("hold") && !isPaused && !isGameOver && isPlaying) {
          recordAction("hold");
          holdPiece();
        }
        return;
      }

      if (isKeyMatch(key, keyBindings.pause)) {
        togglePause();
        return;
      }

      if (isKeyMatch(key, keyBindings.reset)) {
        if (isGameOver) {
          resetGame();
        }
        return;
      }

      if (isKeyMatch(key, keyBindings.confirm)) {
        if (isGameOver) {
          resetGame();
        } else if (isPaused) {
          togglePause();
        }
        return;
      }
    },
    [
      keyBindings,
      isKeyMatch,
      isActionAllowed,
      recordAction,
      moveLeft,
      moveRight,
      moveDown,
      drop,
      rotate,
      holdPiece,
      togglePause,
      resetGame,
      isPaused,
      isGameOver,
      isPlaying,
      enableDAS,
      executeDASRepeat,
    ]
  );

  // Handle keyup events
  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      const key = event.key;

      // Stop DAS for movement keys
      if (isKeyMatch(key, keyBindings.moveLeft)) {
        dasState.current.leftPressed = false;
        dasState.current.leftRepeatStarted = false;
      } else if (isKeyMatch(key, keyBindings.moveRight)) {
        dasState.current.rightPressed = false;
        dasState.current.rightRepeatStarted = false;
      } else if (isKeyMatch(key, keyBindings.softDrop)) {
        dasState.current.downPressed = false;
        dasState.current.downRepeatStarted = false;
      }

      // Stop DAS animation if no movement keys are pressed
      if (
        !dasState.current.leftPressed &&
        !dasState.current.rightPressed &&
        !dasState.current.downPressed
      ) {
        if (dasAnimationFrame.current !== null) {
          cancelAnimationFrame(dasAnimationFrame.current);
          dasAnimationFrame.current = null;
        }
      }
    },
    [keyBindings, isKeyMatch]
  );

  // Set up event listeners
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);

      // Clean up DAS animation frame
      if (dasAnimationFrame.current !== null) {
        cancelAnimationFrame(dasAnimationFrame.current);
        dasAnimationFrame.current = null;
      }
    };
  }, [handleKeyDown, handleKeyUp]);

  // Clean up DAS when component unmounts or game state changes
  useEffect(() => {
    if (isPaused || isGameOver) {
      // Reset DAS state
      dasState.current = {
        leftPressed: false,
        rightPressed: false,
        downPressed: false,
        lastLeftTime: 0,
        lastRightTime: 0,
        lastDownTime: 0,
        leftRepeatStarted: false,
        rightRepeatStarted: false,
        downRepeatStarted: false,
      };

      // Cancel DAS animation
      if (dasAnimationFrame.current !== null) {
        cancelAnimationFrame(dasAnimationFrame.current);
        dasAnimationFrame.current = null;
      }
    }
  }, [isPaused, isGameOver]);

  // Return DAS state for debugging/testing
  return {
    keyBindings,
    dasSettings,
    isDASActive:
      enableDAS &&
      (dasState.current.leftPressed ||
        dasState.current.rightPressed ||
        dasState.current.downPressed),
  };
}

/**
 * Predefined keyboard control configurations
 */
export const KEYBOARD_PRESETS = {
  // Standard Tetris controls
  standard: {
    enableDAS: true,
    customKeybindings: {},
    dasConfig: {
      initialDelay: DAS_CONSTANTS.INITIAL_DELAY,
      repeatRate: DAS_CONSTANTS.REPEAT_RATE,
      softDropRate: DAS_CONSTANTS.SOFT_DROP_RATE,
    },
  },

  // Responsive controls for competitive play
  responsive: {
    enableDAS: true,
    customKeybindings: {},
    dasConfig: {
      initialDelay: 120,
      repeatRate: 30,
      softDropRate: 30,
    },
  },

  // Alternative key layout (WASD-style)
  alternative: {
    enableDAS: true,
    customKeybindings: {
      moveLeft: ["a", "A"],
      moveRight: ["d", "D"],
      softDrop: ["s", "S"],
      hardDrop: ["w", "W"],
      rotateCW: ["ArrowUp", "e", "E"],
      rotateCCW: ["q", "Q"],
    },
    dasConfig: {
      initialDelay: DAS_CONSTANTS.INITIAL_DELAY,
      repeatRate: DAS_CONSTANTS.REPEAT_RATE,
      softDropRate: DAS_CONSTANTS.SOFT_DROP_RATE,
    },
  },
} as const;

/**
 * Convenience hook for using predefined keyboard control configurations
 *
 * @param preset Preset configuration name
 *
 * @example
 * ```typescript
 * useKeyboardControlsPreset('responsive');
 * ```
 */
export function useKeyboardControlsPreset(preset: keyof typeof KEYBOARD_PRESETS) {
  return useKeyboardControls(KEYBOARD_PRESETS[preset]);
}
