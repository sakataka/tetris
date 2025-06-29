import { useCallback, useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";
import { TOUCH_CONSTANTS } from "@/utils/gameConstants";
import { useActionCooldown } from "./useActionCooldown";

export interface TouchGestureConfig {
  enableSwipeGestures?: boolean;
  enableTapGestures?: boolean;
  customThresholds?: Partial<TouchThresholds>;
  targetElement?: HTMLElement | null;
}

export interface TouchThresholds {
  minSwipeDistance: number;
  maxSwipeTime: number;
  tapMaxTime: number;
  tapMaxDistance: number;
  doubleTapMaxInterval: number;
  longSwipeThreshold: number;
  swipeVelocityThreshold: number;
}

export type TouchGestureType =
  | "swipe-left"
  | "swipe-right"
  | "swipe-down"
  | "hard-drop"
  | "tap"
  | "double-tap"
  | "none";

interface TouchState {
  startPosition: { x: number; y: number };
  startTime: number;
  lastTapTime: number;
  isMoving: boolean;
  touchActive: boolean;
}

// Default touch thresholds from game constants
const DEFAULT_THRESHOLDS: TouchThresholds = {
  minSwipeDistance: TOUCH_CONSTANTS.MIN_SWIPE_DISTANCE,
  maxSwipeTime: TOUCH_CONSTANTS.MAX_SWIPE_TIME,
  tapMaxTime: TOUCH_CONSTANTS.TAP_MAX_TIME,
  tapMaxDistance: TOUCH_CONSTANTS.TAP_MAX_DISTANCE,
  doubleTapMaxInterval: TOUCH_CONSTANTS.DOUBLE_TAP_MAX_INTERVAL,
  longSwipeThreshold: TOUCH_CONSTANTS.LONG_SWIPE_THRESHOLD,
  swipeVelocityThreshold: TOUCH_CONSTANTS.SWIPE_VELOCITY_THRESHOLD,
};

/**
 * Recognize touch gesture based on touch start and end points
 * @param touchStart Starting touch point
 * @param touchEnd Ending touch point
 * @param duration Touch duration in milliseconds
 * @param thresholds Touch gesture thresholds
 * @returns Recognized gesture type
 */
function recognizeGesture(
  touchStart: { x: number; y: number },
  touchEnd: { x: number; y: number },
  duration: number,
  thresholds: TouchThresholds
): TouchGestureType {
  const deltaX = touchEnd.x - touchStart.x;
  const deltaY = touchEnd.y - touchStart.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const velocity = duration > 0 ? distance / duration : 0;

  // Tap recognition: short time, minimal movement
  if (duration <= thresholds.tapMaxTime && distance <= thresholds.tapMaxDistance) {
    return "tap";
  }

  // Swipe recognition: sufficient distance and velocity
  if (
    distance >= thresholds.minSwipeDistance &&
    velocity >= thresholds.swipeVelocityThreshold &&
    duration <= thresholds.maxSwipeTime
  ) {
    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      return deltaX > 0 ? "swipe-right" : "swipe-left";
    } else if (deltaY > 0) {
      // Vertical swipe (downward)
      // Distinguish between soft drop and hard drop based on distance
      return distance >= thresholds.longSwipeThreshold ? "hard-drop" : "swipe-down";
    }
  }

  return "none";
}

/**
 * React hook for handling touch gestures for mobile Tetris controls
 * Provides swipe and tap gesture recognition for game actions
 *
 * @param config Configuration for touch gesture recognition
 *
 * @example
 * ```typescript
 * const touchHandlers = useTouchGestures({
 *   enableSwipeGestures: true,
 *   enableTapGestures: true,
 *   targetElement: gameAreaRef.current
 * });
 * ```
 */
export function useTouchGestures(config: TouchGestureConfig = {}) {
  const {
    enableSwipeGestures = true,
    enableTapGestures = true,
    customThresholds = {},
    targetElement = null,
  } = config;

  // Merge custom thresholds with defaults
  const thresholds: TouchThresholds = {
    ...DEFAULT_THRESHOLDS,
    ...customThresholds,
  };

  // Game store actions
  const { moveLeft, moveRight, moveDown, rotate, drop, holdPiece, isPaused, isGameOver } =
    useGameStore();

  // Action cooldown management with mobile-optimized settings
  const { isActionAllowed, recordAction } = useActionCooldown({
    customCooldowns: {
      movement: 100, // Slightly slower for touch
      rotation: 200,
      drop: 100,
      hardDrop: 500,
      hold: 400,
    },
  });

  // Touch state management
  const touchState = useRef<TouchState>({
    startPosition: { x: 0, y: 0 },
    startTime: 0,
    lastTapTime: 0,
    isMoving: false,
    touchActive: false,
  });

  // Execute gesture action
  const executeGestureAction = useCallback(
    (gesture: TouchGestureType) => {
      if (isPaused || isGameOver) return;

      switch (gesture) {
        case "swipe-left":
          if (isActionAllowed("movement")) {
            recordAction("movement");
            moveLeft();
          }
          break;

        case "swipe-right":
          if (isActionAllowed("movement")) {
            recordAction("movement");
            moveRight();
          }
          break;

        case "swipe-down":
          if (isActionAllowed("drop")) {
            recordAction("drop");
            moveDown();
          }
          break;

        case "hard-drop":
          if (isActionAllowed("hardDrop")) {
            recordAction("hardDrop");
            drop();
          }
          break;

        case "tap":
          if (isActionAllowed("rotation")) {
            recordAction("rotation");
            rotate();
          }
          break;

        case "double-tap":
          if (isActionAllowed("hold")) {
            recordAction("hold");
            holdPiece();
          }
          break;

        default:
          // No action for unrecognized gestures
          break;
      }
    },
    [
      isPaused,
      isGameOver,
      isActionAllowed,
      recordAction,
      moveLeft,
      moveRight,
      moveDown,
      drop,
      rotate,
      holdPiece,
    ]
  );

  // Handle touch start
  const handleTouchStart = useCallback((event: TouchEvent) => {
    // Prevent default touch behaviors (scrolling, zooming)
    event.preventDefault();

    if (event.touches.length !== 1) return; // Only handle single finger

    const touch = event.touches[0];
    const currentTime = performance.now();

    touchState.current = {
      ...touchState.current,
      startPosition: { x: touch.clientX, y: touch.clientY },
      startTime: currentTime,
      isMoving: false,
      touchActive: true,
    };
  }, []);

  // Handle touch move
  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      // Prevent default scrolling behavior
      event.preventDefault();

      if (!touchState.current.touchActive || event.touches.length !== 1) return;

      const touch = event.touches[0];
      const currentPosition = { x: touch.clientX, y: touch.clientY };
      const distance = Math.sqrt(
        (currentPosition.x - touchState.current.startPosition.x) ** 2 +
          (currentPosition.y - touchState.current.startPosition.y) ** 2
      );

      // Mark as moving if distance exceeds tap threshold
      if (distance > thresholds.tapMaxDistance) {
        touchState.current.isMoving = true;
      }
    },
    [thresholds.tapMaxDistance]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      // Prevent default touch behaviors
      event.preventDefault();

      if (!touchState.current.touchActive) return;

      const touch = event.changedTouches[0];
      const endPosition = { x: touch.clientX, y: touch.clientY };
      const currentTime = performance.now();
      const duration = currentTime - touchState.current.startTime;

      // Recognize gesture
      const gesture = recognizeGesture(
        touchState.current.startPosition,
        endPosition,
        duration,
        thresholds
      );

      // Handle double tap detection
      if (gesture === "tap" && enableTapGestures) {
        const timeSinceLastTap = currentTime - touchState.current.lastTapTime;

        if (timeSinceLastTap <= thresholds.doubleTapMaxInterval) {
          // Double tap detected
          executeGestureAction("double-tap");
          touchState.current.lastTapTime = 0; // Reset to prevent triple tap
        } else {
          // Single tap - delay execution to check for double tap
          touchState.current.lastTapTime = currentTime;

          setTimeout(() => {
            // Execute single tap if no double tap occurred
            if (currentTime === touchState.current.lastTapTime) {
              executeGestureAction("tap");
            }
          }, thresholds.doubleTapMaxInterval);
        }
      } else if (gesture !== "tap" && gesture !== "none") {
        // Execute swipe gestures immediately
        if (enableSwipeGestures) {
          executeGestureAction(gesture);
        }
      }

      // Reset touch state
      touchState.current.touchActive = false;
    },
    [thresholds, enableTapGestures, enableSwipeGestures, executeGestureAction]
  );

  // Handle touch cancel (e.g., when finger leaves screen area)
  const handleTouchCancel = useCallback((event: TouchEvent) => {
    event.preventDefault();
    touchState.current.touchActive = false;
  }, []);

  // Set up touch event listeners
  useEffect(() => {
    const target = targetElement || document;

    target.addEventListener("touchstart", handleTouchStart, { passive: false });
    target.addEventListener("touchmove", handleTouchMove, { passive: false });
    target.addEventListener("touchend", handleTouchEnd, { passive: false });
    target.addEventListener("touchcancel", handleTouchCancel, { passive: false });

    return () => {
      target.removeEventListener("touchstart", handleTouchStart);
      target.removeEventListener("touchmove", handleTouchMove);
      target.removeEventListener("touchend", handleTouchEnd);
      target.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [targetElement, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);

  // Reset touch state when game state changes
  useEffect(() => {
    if (isPaused || isGameOver) {
      touchState.current = {
        startPosition: { x: 0, y: 0 },
        startTime: 0,
        lastTapTime: 0,
        isMoving: false,
        touchActive: false,
      };
    }
  }, [isPaused, isGameOver]);

  // Return touch handlers and state for debugging/testing
  return {
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
    },
    thresholds,
    isGestureActive: touchState.current.touchActive,
    recognizeGesture: (
      start: { x: number; y: number },
      end: { x: number; y: number },
      duration: number
    ) => recognizeGesture(start, end, duration, thresholds),
  };
}

/**
 * Predefined touch gesture configurations
 */
export const TOUCH_PRESETS = {
  // Standard mobile configuration
  standard: {
    enableSwipeGestures: true,
    enableTapGestures: true,
    customThresholds: {},
  },

  // Sensitive configuration for responsive play
  sensitive: {
    enableSwipeGestures: true,
    enableTapGestures: true,
    customThresholds: {
      minSwipeDistance: 20,
      tapMaxTime: 150,
      tapMaxDistance: 8,
      doubleTapMaxInterval: 250,
    },
  },

  // Relaxed configuration for casual play
  relaxed: {
    enableSwipeGestures: true,
    enableTapGestures: true,
    customThresholds: {
      minSwipeDistance: 40,
      tapMaxTime: 300,
      tapMaxDistance: 15,
      doubleTapMaxInterval: 400,
      longSwipeThreshold: 100,
    },
  },

  // Swipe-only configuration (no tap gestures)
  swipeOnly: {
    enableSwipeGestures: true,
    enableTapGestures: false,
    customThresholds: {
      minSwipeDistance: 25,
      longSwipeThreshold: 70,
    },
  },
} as const;

/**
 * Convenience hook for using predefined touch gesture configurations
 *
 * @param preset Preset configuration name
 * @param targetElement Optional target element for touch events
 *
 * @example
 * ```typescript
 * const touchHandlers = useTouchGesturesPreset('sensitive', gameAreaRef.current);
 * ```
 */
export function useTouchGesturesPreset(
  preset: keyof typeof TOUCH_PRESETS,
  targetElement?: HTMLElement | null
) {
  return useTouchGestures({
    ...TOUCH_PRESETS[preset],
    targetElement,
  });
}
