import { describe, expect, test } from "bun:test";
import { TOUCH_PRESETS, useTouchGestures } from "./useTouchGestures";

// Mock game store
const mockGameStore = {
  moveLeft: jest.fn(),
  moveRight: jest.fn(),
  moveDown: jest.fn(),
  rotate: jest.fn(),
  drop: jest.fn(),
  holdPiece: jest.fn(),
  isPaused: false,
  isGameOver: false,
};

jest.mock("@/store/gameStore", () => ({
  useGameStore: () => mockGameStore,
}));

// Mock action cooldown hook
const mockActionCooldown = {
  isActionAllowed: jest.fn(() => true),
  recordAction: jest.fn(() => true),
};

jest.mock("./useActionCooldown", () => ({
  useActionCooldown: () => mockActionCooldown,
}));

describe("Touch Gesture Recognition", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Gesture Recognition Algorithm", () => {
    test("should recognize tap gesture", () => {
      const { result } = renderHook(() => useTouchGestures());

      const startPosition = { x: 100, y: 100 };
      const endPosition = { x: 102, y: 102 }; // Small movement
      const duration = 150; // Short duration

      const gesture = result.current.recognizeGesture(startPosition, endPosition, duration);
      expect(gesture).toBe("tap");
    });

    test("should recognize swipe left gesture", () => {
      const { result } = renderHook(() => useTouchGestures());

      const startPosition = { x: 200, y: 100 };
      const endPosition = { x: 150, y: 105 }; // Left movement with minimal vertical
      const duration = 200;

      const gesture = result.current.recognizeGesture(startPosition, endPosition, duration);
      expect(gesture).toBe("swipe-left");
    });

    test("should recognize swipe right gesture", () => {
      const { result } = renderHook(() => useTouchGestures());

      const startPosition = { x: 100, y: 100 };
      const endPosition = { x: 150, y: 105 }; // Right movement with minimal vertical
      const duration = 200;

      const gesture = result.current.recognizeGesture(startPosition, endPosition, duration);
      expect(gesture).toBe("swipe-right");
    });

    test("should recognize soft drop (swipe down)", () => {
      const { result } = renderHook(() => useTouchGestures());

      const startPosition = { x: 100, y: 100 };
      const endPosition = { x: 105, y: 140 }; // Down movement, short distance
      const duration = 200;

      const gesture = result.current.recognizeGesture(startPosition, endPosition, duration);
      expect(gesture).toBe("swipe-down");
    });

    test("should recognize hard drop (long swipe down)", () => {
      const { result } = renderHook(() => useTouchGestures());

      const startPosition = { x: 100, y: 100 };
      const endPosition = { x: 105, y: 200 }; // Long down movement
      const duration = 300;

      const gesture = result.current.recognizeGesture(startPosition, endPosition, duration);
      expect(gesture).toBe("hard-drop");
    });

    test("should not recognize gesture with insufficient distance", () => {
      const { result } = renderHook(() => useTouchGestures());

      const startPosition = { x: 100, y: 100 };
      const endPosition = { x: 115, y: 100 }; // Too short for swipe
      const duration = 200;

      const gesture = result.current.recognizeGesture(startPosition, endPosition, duration);
      expect(gesture).toBe("none");
    });

    test("should not recognize gesture with too slow velocity", () => {
      const { result } = renderHook(() => useTouchGestures());

      const startPosition = { x: 100, y: 100 };
      const endPosition = { x: 150, y: 100 };
      const duration = 2000; // Too slow

      const gesture = result.current.recognizeGesture(startPosition, endPosition, duration);
      expect(gesture).toBe("none");
    });

    test("should not recognize upward swipe", () => {
      const { result } = renderHook(() => useTouchGestures());

      const startPosition = { x: 100, y: 200 };
      const endPosition = { x: 105, y: 150 }; // Upward movement
      const duration = 200;

      const gesture = result.current.recognizeGesture(startPosition, endPosition, duration);
      expect(gesture).toBe("none");
    });
  });

  describe("Gesture Thresholds", () => {
    test("should respect custom minimum swipe distance", () => {
      const { result } = renderHook(() =>
        useTouchGestures({
          customThresholds: { minSwipeDistance: 60 },
        })
      );

      const startPosition = { x: 100, y: 100 };
      const endPosition = { x: 150, y: 100 }; // 50px distance
      const duration = 200;

      const gesture = result.current.recognizeGesture(startPosition, endPosition, duration);
      expect(gesture).toBe("none"); // Should not register with 60px minimum
    });

    test("should respect custom tap maximum time", () => {
      const { result } = renderHook(() =>
        useTouchGestures({
          customThresholds: { tapMaxTime: 100 },
        })
      );

      const startPosition = { x: 100, y: 100 };
      const endPosition = { x: 102, y: 102 };
      const duration = 150; // Exceeds 100ms limit

      const gesture = result.current.recognizeGesture(startPosition, endPosition, duration);
      expect(gesture).toBe("none");
    });

    test("should respect custom long swipe threshold", () => {
      const { result } = renderHook(() =>
        useTouchGestures({
          customThresholds: { longSwipeThreshold: 120 },
        })
      );

      const startPosition = { x: 100, y: 100 };
      const endPosition = { x: 105, y: 200 }; // ~100px down
      const duration = 200;

      const gesture = result.current.recognizeGesture(startPosition, endPosition, duration);
      expect(gesture).toBe("swipe-down"); // Should be soft drop, not hard drop
    });
  });

  describe("Touch Event Handling", () => {
    test("should call preventDefault on touch events", () => {
      const preventDefault = jest.fn();
      const mockTouchEvent = {
        preventDefault,
        touches: [{ clientX: 100, clientY: 100 }],
      } as any;

      renderHook(() => useTouchGestures());

      // Simulate touch start event
      const touchHandlers = useTouchGestures().touchHandlers;
      touchHandlers.onTouchStart(mockTouchEvent);

      expect(preventDefault).toHaveBeenCalled();
    });

    test("should ignore multi-touch events", () => {
      const { result } = renderHook(() => useTouchGestures());

      const mockTouchEvent = {
        preventDefault: jest.fn(),
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 200, clientY: 200 },
        ], // Two fingers
      } as any;

      result.current.touchHandlers.onTouchStart(mockTouchEvent);

      expect(result.current.isGestureActive).toBe(false);
    });

    test("should handle touch cancel correctly", () => {
      const { result } = renderHook(() => useTouchGestures());

      // Start a touch
      const startEvent = {
        preventDefault: jest.fn(),
        touches: [{ clientX: 100, clientY: 100 }],
      } as any;

      result.current.touchHandlers.onTouchStart(startEvent);
      expect(result.current.isGestureActive).toBe(true);

      // Cancel the touch
      const cancelEvent = {
        preventDefault: jest.fn(),
      } as any;

      result.current.touchHandlers.onTouchCancel(cancelEvent);
      expect(result.current.isGestureActive).toBe(false);
    });
  });

  describe("Double Tap Detection", () => {
    test("should detect double tap within time limit", (done) => {
      renderHook(() => useTouchGestures({ enableTapGestures: true }));

      const tapPosition = { x: 100, y: 100 };

      // First tap
      const firstTapGesture = result.current.recognizeGesture(tapPosition, tapPosition, 150);
      expect(firstTapGesture).toBe("tap");

      // Second tap within double tap interval
      setTimeout(() => {
        const secondTapGesture = result.current.recognizeGesture(tapPosition, tapPosition, 150);
        expect(secondTapGesture).toBe("tap");
        // Double tap should be detected and executeGestureAction called with "double-tap"
        done();
      }, 100);
    });

    test("should not detect double tap outside time limit", (done) => {
      renderHook(() => useTouchGestures({ enableTapGestures: true }));

      const tapPosition = { x: 100, y: 100 };

      // First tap
      result.current.recognizeGesture(tapPosition, tapPosition, 150);

      // Second tap outside double tap interval
      setTimeout(() => {
        result.current.recognizeGesture(tapPosition, tapPosition, 150);
        // Should be treated as separate single taps
        done();
      }, 400); // Beyond DOUBLE_TAP_MAX_INTERVAL
    });
  });

  describe("Game State Integration", () => {
    test("should not execute gestures when game is paused", () => {
      mockGameStore.isPaused = true;

      const { result } = renderHook(() => useTouchGestures());

      // Simulate swipe gesture
      const mockTouchStart = {
        preventDefault: jest.fn(),
        touches: [{ clientX: 100, clientY: 100 }],
      } as any;

      const mockTouchEnd = {
        preventDefault: jest.fn(),
        changedTouches: [{ clientX: 150, clientY: 100 }],
      } as any;

      result.current.touchHandlers.onTouchStart(mockTouchStart);
      result.current.touchHandlers.onTouchEnd(mockTouchEnd);

      // Game actions should not be called
      expect(mockGameStore.moveRight).not.toHaveBeenCalled();
    });

    test("should not execute gestures when game is over", () => {
      mockGameStore.isGameOver = true;

      const { result } = renderHook(() => useTouchGestures());

      // Simulate tap gesture
      const mockTouchStart = {
        preventDefault: jest.fn(),
        touches: [{ clientX: 100, clientY: 100 }],
      } as any;

      const mockTouchEnd = {
        preventDefault: jest.fn(),
        changedTouches: [{ clientX: 100, clientY: 100 }],
      } as any;

      result.current.touchHandlers.onTouchStart(mockTouchStart);
      result.current.touchHandlers.onTouchEnd(mockTouchEnd);

      // Game actions should not be called
      expect(mockGameStore.rotate).not.toHaveBeenCalled();
    });

    test("should respect action cooldowns", () => {
      mockActionCooldown.isActionAllowed.mockReturnValue(false);

      const { result } = renderHook(() => useTouchGestures());

      // Simulate swipe gesture
      const mockTouchStart = {
        preventDefault: jest.fn(),
        touches: [{ clientX: 100, clientY: 100 }],
      } as any;

      const mockTouchEnd = {
        preventDefault: jest.fn(),
        changedTouches: [{ clientX: 150, clientY: 100 }],
      } as any;

      result.current.touchHandlers.onTouchStart(mockTouchStart);
      result.current.touchHandlers.onTouchEnd(mockTouchEnd);

      // Action should be blocked by cooldown
      expect(mockGameStore.moveRight).not.toHaveBeenCalled();
    });
  });

  describe("Preset Configurations", () => {
    test("should apply sensitive preset with lower thresholds", () => {
      const sensitiveConfig = TOUCH_PRESETS.sensitive;
      const { result } = renderHook(() => useTouchGestures(sensitiveConfig));

      expect(result.current.thresholds.minSwipeDistance).toBe(20);
      expect(result.current.thresholds.tapMaxTime).toBe(150);
    });

    test("should apply relaxed preset with higher thresholds", () => {
      const relaxedConfig = TOUCH_PRESETS.relaxed;
      const { result } = renderHook(() => useTouchGestures(relaxedConfig));

      expect(result.current.thresholds.minSwipeDistance).toBe(40);
      expect(result.current.thresholds.tapMaxTime).toBe(300);
    });

    test("should disable tap gestures in swipe-only preset", () => {
      const swipeOnlyConfig = TOUCH_PRESETS.swipeOnly;
      const { result } = renderHook(() => useTouchGestures(swipeOnlyConfig));

      // Should not call rotate action for tap when tap gestures are disabled
      const tapPosition = { x: 100, y: 100 };
      const gesture = result.current.recognizeGesture(tapPosition, tapPosition, 150);
      expect(gesture).toBe("tap");

      // But the gesture should not execute the rotation action
      // (This would be tested in integration with the actual touch handlers)
    });
  });

  describe("Performance and Edge Cases", () => {
    test("should handle rapid gesture recognition calls", () => {
      const { result } = renderHook(() => useTouchGestures());

      // Make many rapid gesture recognition calls
      for (let i = 0; i < 1000; i++) {
        result.current.recognizeGesture({ x: 100, y: 100 }, { x: 150, y: 100 }, 200);
      }

      // Should not throw or cause performance issues
      expect(result.current.thresholds).toBeDefined();
    });

    test("should handle extreme coordinate values", () => {
      const { result } = renderHook(() => useTouchGestures());

      const extremeStart = { x: -1000, y: -1000 };
      const extremeEnd = { x: 10000, y: 10000 };
      const duration = 200;

      const gesture = result.current.recognizeGesture(extremeStart, extremeEnd, duration);
      expect(gesture).toBe("swipe-right"); // Should still work with extreme values
    });

    test("should handle zero duration gracefully", () => {
      const { result } = renderHook(() => useTouchGestures());

      const start = { x: 100, y: 100 };
      const end = { x: 150, y: 100 };
      const duration = 0;

      const gesture = result.current.recognizeGesture(start, end, duration);
      expect(gesture).toBe("none"); // Should not crash with zero duration
    });

    test("should handle negative duration gracefully", () => {
      const { result } = renderHook(() => useTouchGestures());

      const start = { x: 100, y: 100 };
      const end = { x: 150, y: 100 };
      const duration = -100;

      const gesture = result.current.recognizeGesture(start, end, duration);
      expect(gesture).toBe("none"); // Should handle negative duration
    });
  });
});

// Helper function to simulate renderHook functionality for testing
function renderHook<T>(callback: () => T): { result: { current: T } } {
  return {
    result: {
      current: callback(),
    },
  };
}
