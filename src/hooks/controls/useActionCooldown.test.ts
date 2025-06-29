import { beforeEach, describe, expect, jest, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import type { ActionType } from "@/utils/actionCooldown";
import { COOLDOWN_PRESETS, useActionCooldown } from "./useActionCooldown";

// Mock performance.now() for consistent testing
const mockPerformanceNow = jest.fn();
Object.defineProperty(global, "performance", {
  value: { now: mockPerformanceNow },
  writable: true,
});

describe("useActionCooldown", () => {
  beforeEach(() => {
    mockPerformanceNow.mockReset();
    let currentTime = 0;
    mockPerformanceNow.mockImplementation(() => {
      currentTime += 10; // Increment by 10ms each call
      return currentTime;
    });
  });

  describe("Action Cooldown Management", () => {
    test("should allow action on first call", () => {
      const { result } = renderHook(() => useActionCooldown());

      act(() => {
        const allowed = result.current.isActionAllowed("movement");
        expect(allowed).toBe(true);
      });
    });

    test("should record action and enforce cooldown", () => {
      const { result } = renderHook(() =>
        useActionCooldown({
          customCooldowns: { movement: 100 },
        })
      );

      act(() => {
        // First action should be allowed and recorded
        const recorded = result.current.recordAction("movement");
        expect(recorded).toBe(true);
      });

      act(() => {
        // Immediately after, action should not be allowed
        const allowed = result.current.isActionAllowed("movement");
        expect(allowed).toBe(false);
      });

      // Advance time beyond cooldown
      mockPerformanceNow.mockReturnValue(150);

      act(() => {
        // After cooldown, action should be allowed again
        const allowed = result.current.isActionAllowed("movement");
        expect(allowed).toBe(true);
      });
    });

    test("should handle different action types with different cooldowns", () => {
      const { result } = renderHook(() =>
        useActionCooldown({
          customCooldowns: {
            movement: 50,
            rotation: 100,
            hardDrop: 300,
          },
        })
      );

      const actionTypes: ActionType[] = ["movement", "rotation", "hardDrop"];

      // Record all actions
      act(() => {
        actionTypes.forEach((actionType) => {
          result.current.recordAction(actionType);
        });
      });

      // Check that all are blocked immediately
      act(() => {
        actionTypes.forEach((actionType) => {
          expect(result.current.isActionAllowed(actionType)).toBe(false);
        });
      });

      // Advance time to 60ms
      mockPerformanceNow.mockReturnValue(60);

      act(() => {
        // Movement should be available (50ms cooldown)
        expect(result.current.isActionAllowed("movement")).toBe(true);
        // Rotation should still be blocked (100ms cooldown)
        expect(result.current.isActionAllowed("rotation")).toBe(false);
        // Hard drop should still be blocked (300ms cooldown)
        expect(result.current.isActionAllowed("hardDrop")).toBe(false);
      });

      // Advance time to 110ms
      mockPerformanceNow.mockReturnValue(110);

      act(() => {
        // Movement and rotation should be available
        expect(result.current.isActionAllowed("movement")).toBe(true);
        expect(result.current.isActionAllowed("rotation")).toBe(true);
        // Hard drop should still be blocked
        expect(result.current.isActionAllowed("hardDrop")).toBe(false);
      });
    });

    test("should reset specific cooldown", () => {
      const { result } = renderHook(() =>
        useActionCooldown({
          customCooldowns: { movement: 100 },
        })
      );

      act(() => {
        result.current.recordAction("movement");
        expect(result.current.isActionAllowed("movement")).toBe(false);
      });

      act(() => {
        result.current.resetCooldown("movement");
        expect(result.current.isActionAllowed("movement")).toBe(true);
      });
    });

    test("should reset all cooldowns", () => {
      const { result } = renderHook(() => useActionCooldown());

      const actionTypes: ActionType[] = ["movement", "rotation", "drop"];

      // Record multiple actions
      act(() => {
        actionTypes.forEach((actionType) => {
          result.current.recordAction(actionType);
        });
      });

      // Verify all are blocked
      act(() => {
        actionTypes.forEach((actionType) => {
          expect(result.current.isActionAllowed(actionType)).toBe(false);
        });
      });

      // Reset all cooldowns
      act(() => {
        result.current.resetAllCooldowns();
      });

      // Verify all are now allowed
      act(() => {
        actionTypes.forEach((actionType) => {
          expect(result.current.isActionAllowed(actionType)).toBe(true);
        });
      });
    });

    test("should calculate remaining cooldown time correctly", () => {
      const { result } = renderHook(() =>
        useActionCooldown({
          customCooldowns: { movement: 100 },
        })
      );

      mockPerformanceNow.mockReturnValue(1000);

      act(() => {
        result.current.recordAction("movement");
      });

      // Advance time to 1050ms (50ms after action)
      mockPerformanceNow.mockReturnValue(1050);

      act(() => {
        const remaining = result.current.getCooldownRemaining("movement");
        expect(remaining).toBe(50); // 100ms cooldown - 50ms elapsed = 50ms remaining
      });

      // Advance time beyond cooldown
      mockPerformanceNow.mockReturnValue(1150);

      act(() => {
        const remaining = result.current.getCooldownRemaining("movement");
        expect(remaining).toBe(0); // No remaining cooldown
      });
    });
  });

  describe("Input Debouncing", () => {
    test("should allow input when no previous input", () => {
      const { result } = renderHook(() => useActionCooldown());

      act(() => {
        const allowed = result.current.shouldAllowInput();
        expect(allowed).toBe(true);
      });
    });

    test("should enforce debounce time", () => {
      const { result } = renderHook(() =>
        useActionCooldown({
          debouncerConfig: { debounceTime: 100, maxInputsPerSecond: 15 },
        })
      );

      act(() => {
        result.current.recordInput();
        // Immediately after recording, input should be blocked
        const allowed = result.current.shouldAllowInput();
        expect(allowed).toBe(false);
      });

      // Advance time beyond debounce period
      mockPerformanceNow.mockReturnValue(150);

      act(() => {
        const allowed = result.current.shouldAllowInput();
        expect(allowed).toBe(true);
      });
    });

    test("should enforce rate limiting", () => {
      const { result } = renderHook(() =>
        useActionCooldown({
          debouncerConfig: { debounceTime: 10, maxInputsPerSecond: 3 },
        })
      );

      let currentTime = 1000;
      mockPerformanceNow.mockImplementation(() => {
        currentTime += 20; // 20ms intervals
        return currentTime;
      });

      // Record 3 inputs (should all be allowed)
      for (let i = 0; i < 3; i++) {
        act(() => {
          expect(result.current.shouldAllowInput()).toBe(true);
          result.current.recordInput();
        });
      }

      // 4th input should be blocked due to rate limit
      act(() => {
        expect(result.current.shouldAllowInput()).toBe(false);
      });

      // Advance time by 1 second to clear rate limit window
      mockPerformanceNow.mockReturnValue(currentTime + 1000);

      act(() => {
        expect(result.current.shouldAllowInput()).toBe(true);
      });
    });

    test("should reset debouncer", () => {
      const { result } = renderHook(() =>
        useActionCooldown({
          debouncerConfig: { debounceTime: 100 },
        })
      );

      act(() => {
        result.current.recordInput();
        expect(result.current.shouldAllowInput()).toBe(false);
      });

      act(() => {
        result.current.resetDebouncer();
        expect(result.current.shouldAllowInput()).toBe(true);
      });
    });

    test("should track input rate correctly", () => {
      const { result } = renderHook(() => useActionCooldown());

      let currentTime = 1000;
      mockPerformanceNow.mockImplementation(() => {
        currentTime += 100; // 100ms intervals
        return currentTime;
      });

      // Record 5 inputs
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.recordInput();
        }
      });

      act(() => {
        const rate = result.current.getInputRate();
        expect(rate).toBe(5);
      });

      // Advance time by 2 seconds to age out some inputs
      mockPerformanceNow.mockReturnValue(currentTime + 2000);

      act(() => {
        const rate = result.current.getInputRate();
        expect(rate).toBe(0); // All inputs should be aged out
      });
    });
  });

  describe("Edge Cases", () => {
    test("should handle action type not in cooldown configuration", () => {
      const { result } = renderHook(() =>
        useActionCooldown({
          customCooldowns: { movement: 100 },
        })
      );

      act(() => {
        // Should use default cooldown for rotation
        const recorded = result.current.recordAction("rotation");
        expect(recorded).toBe(true);
        expect(result.current.isActionAllowed("rotation")).toBe(false);
      });
    });

    test("should maintain stable references across re-renders", () => {
      const { result, rerender } = renderHook(() => useActionCooldown());

      const firstRenderFunctions = {
        isActionAllowed: result.current.isActionAllowed,
        recordAction: result.current.recordAction,
        resetCooldown: result.current.resetCooldown,
      };

      rerender();

      const secondRenderFunctions = {
        isActionAllowed: result.current.isActionAllowed,
        recordAction: result.current.recordAction,
        resetCooldown: result.current.resetCooldown,
      };

      // Functions should be the same reference
      expect(firstRenderFunctions.isActionAllowed).toBe(secondRenderFunctions.isActionAllowed);
      expect(firstRenderFunctions.recordAction).toBe(secondRenderFunctions.recordAction);
      expect(firstRenderFunctions.resetCooldown).toBe(secondRenderFunctions.resetCooldown);
    });
  });

  describe("Preset Configurations", () => {
    test("should apply standard preset correctly", () => {
      const standardConfig = COOLDOWN_PRESETS.standard;
      const { result } = renderHook(() => useActionCooldown(standardConfig));

      // Should use default cooldowns and debouncer settings
      act(() => {
        expect(result.current.shouldAllowInput()).toBe(true);
        result.current.recordInput();
        expect(result.current.shouldAllowInput()).toBe(false);
      });
    });

    test("should apply responsive preset with faster cooldowns", () => {
      const responsiveConfig = COOLDOWN_PRESETS.responsive;
      const { result } = renderHook(() => useActionCooldown(responsiveConfig));

      act(() => {
        result.current.recordAction("movement");
        expect(result.current.isActionAllowed("movement")).toBe(false);
      });

      // Responsive preset should have faster movement cooldown (30ms)
      mockPerformanceNow.mockReturnValue(40);

      act(() => {
        expect(result.current.isActionAllowed("movement")).toBe(true);
      });
    });

    test("should apply mobile preset with longer cooldowns", () => {
      const mobileConfig = COOLDOWN_PRESETS.mobile;
      const { result } = renderHook(() => useActionCooldown(mobileConfig));

      act(() => {
        result.current.recordAction("movement");
        expect(result.current.isActionAllowed("movement")).toBe(false);
      });

      // Mobile preset should have longer movement cooldown (100ms)
      mockPerformanceNow.mockReturnValue(90);

      act(() => {
        expect(result.current.isActionAllowed("movement")).toBe(false);
      });

      mockPerformanceNow.mockReturnValue(110);

      act(() => {
        expect(result.current.isActionAllowed("movement")).toBe(true);
      });
    });
  });

  describe("Performance Considerations", () => {
    test("should handle rapid successive calls efficiently", () => {
      const { result } = renderHook(() => useActionCooldown());

      act(() => {
        // Make many rapid calls
        for (let i = 0; i < 1000; i++) {
          result.current.isActionAllowed("movement");
        }
      });

      // Should not throw or cause performance issues
      expect(result.current.isActionAllowed("movement")).toBe(true);
    });

    test("should cleanup input history to prevent memory leaks", () => {
      const { result } = renderHook(() =>
        useActionCooldown({
          debouncerConfig: { maxInputsPerSecond: 2 },
        })
      );

      let currentTime = 1000;
      mockPerformanceNow.mockImplementation(() => {
        currentTime += 50;
        return currentTime;
      });

      // Record many inputs over time
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.recordInput();
        }
      });

      // Input rate should only count recent inputs, not all 100
      act(() => {
        const rate = result.current.getInputRate();
        expect(rate).toBeLessThan(100);
      });
    });
  });
});
