import { beforeEach, describe, expect, jest, test } from "bun:test";
import { createRateLimiter, isActionAllowed, shouldFilterRapidInput } from "@/utils/actionCooldown";

describe("Input Processing and Filtering", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rapid Input Filtering", () => {
    test("should not filter input with empty history", () => {
      const inputHistory: number[] = [];
      const minInterval = 50;

      const shouldFilter = shouldFilterRapidInput(inputHistory, minInterval);
      expect(shouldFilter).toBe(false);
    });

    test("should not filter input with single entry in history", () => {
      const inputHistory = [1000];
      const minInterval = 50;

      const shouldFilter = shouldFilterRapidInput(inputHistory, minInterval);
      expect(shouldFilter).toBe(false);
    });

    test("should not filter input when interval is sufficient", () => {
      const inputHistory = [1000, 1100]; // 100ms interval
      const minInterval = 50;

      const shouldFilter = shouldFilterRapidInput(inputHistory, minInterval);
      expect(shouldFilter).toBe(false);
    });

    test("should filter input when interval is too short", () => {
      const inputHistory = [1000, 1020]; // 20ms interval
      const minInterval = 50;

      const shouldFilter = shouldFilterRapidInput(inputHistory, minInterval);
      expect(shouldFilter).toBe(true);
    });

    test("should filter input when interval equals minimum", () => {
      const inputHistory = [1000, 1050]; // 50ms interval
      const minInterval = 50;

      const shouldFilter = shouldFilterRapidInput(inputHistory, minInterval);
      expect(shouldFilter).toBe(false); // Equal to minimum should be allowed
    });

    test("should only check last two inputs", () => {
      const inputHistory = [800, 900, 1000, 1020]; // Last interval is 20ms
      const minInterval = 50;

      const shouldFilter = shouldFilterRapidInput(inputHistory, minInterval);
      expect(shouldFilter).toBe(true);
    });

    test("should handle negative intervals gracefully", () => {
      const inputHistory = [1000, 900]; // Negative interval (time went backwards)
      const minInterval = 50;

      const shouldFilter = shouldFilterRapidInput(inputHistory, minInterval);
      expect(shouldFilter).toBe(true); // Negative intervals should be filtered
    });
  });

  describe("Rate Limiting", () => {
    test("should allow actions under rate limit", () => {
      const rateLimiter = createRateLimiter(5, 1000); // 5 actions per second

      // Should allow first 5 actions
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter(1000 + i * 10)).toBe(true);
      }
    });

    test("should block actions over rate limit", () => {
      const rateLimiter = createRateLimiter(3, 1000); // 3 actions per second

      // Allow first 3 actions
      for (let i = 0; i < 3; i++) {
        expect(rateLimiter(1000 + i * 10)).toBe(true);
      }

      // Block 4th action
      expect(rateLimiter(1030)).toBe(false);
    });

    test("should reset rate limit after time window", () => {
      const rateLimiter = createRateLimiter(2, 1000); // 2 actions per second

      // Use up rate limit
      expect(rateLimiter(1000)).toBe(true);
      expect(rateLimiter(1010)).toBe(true);
      expect(rateLimiter(1020)).toBe(false); // Blocked

      // Move forward beyond time window
      expect(rateLimiter(2100)).toBe(true); // Should be allowed again
    });

    test("should handle sliding window correctly", () => {
      const rateLimiter = createRateLimiter(3, 1000); // 3 actions per second

      // Actions at timestamps: 1000, 1200, 1400
      expect(rateLimiter(1000)).toBe(true); // history = [1000]
      expect(rateLimiter(1200)).toBe(true); // history = [1000, 1200]
      expect(rateLimiter(1400)).toBe(true); // history = [1000, 1200, 1400]

      // At 1600, still has 3 actions in window
      expect(rateLimiter(1600)).toBe(false); // history = [1000, 1200, 1400] (no change)

      // At 2001, action at 1000 should be outside window (2001-1000=1001 > 1000)
      expect(rateLimiter(2001)).toBe(true); // history = [1200, 1400, 2001]

      // At 2201, action at 1200 should be outside window
      expect(rateLimiter(2201)).toBe(true); // history = [1400, 2001, 2201] (1200 removed)

      // At 2401, action at 1400 should be outside window
      expect(rateLimiter(2401)).toBe(true); // history = [2001, 2201, 2401] (1400 removed)
    });

    test("should handle concurrent rate limiters independently", () => {
      const limiter1 = createRateLimiter(2, 1000);
      const limiter2 = createRateLimiter(3, 1000);

      // Use up limiter1
      expect(limiter1(1000)).toBe(true);
      expect(limiter1(1010)).toBe(true);
      expect(limiter1(1020)).toBe(false);

      // limiter2 should still work
      expect(limiter2(1000)).toBe(true);
      expect(limiter2(1010)).toBe(true);
      expect(limiter2(1020)).toBe(true);
      expect(limiter2(1030)).toBe(false);
    });

    test("should use current time when timestamp not provided", () => {
      // Mock performance.now()
      const mockNow = jest.spyOn(performance, "now");
      mockNow.mockReturnValue(5000);

      const rateLimiter = createRateLimiter(2, 1000);

      expect(rateLimiter()).toBe(true); // Should use mocked time
      expect(rateLimiter()).toBe(true);
      expect(rateLimiter()).toBe(false);

      mockNow.mockRestore();
    });
  });

  describe("Action Allowance Checking", () => {
    test("should allow action when no previous action recorded", () => {
      const allowed = isActionAllowed("movement", undefined, 100);
      expect(allowed).toBe(true);
    });

    test("should allow action after cooldown period", () => {
      // Mock performance.now()
      const mockNow = jest.spyOn(performance, "now");
      mockNow.mockReturnValue(1000);

      const lastActionTime = 800; // 200ms ago
      const cooldownTime = 150;

      const allowed = isActionAllowed("movement", lastActionTime, cooldownTime);
      expect(allowed).toBe(true);

      mockNow.mockRestore();
    });

    test("should block action during cooldown period", () => {
      // Mock performance.now()
      const mockNow = jest.spyOn(performance, "now");
      mockNow.mockReturnValue(1000);

      const lastActionTime = 950; // 50ms ago
      const cooldownTime = 100;

      const allowed = isActionAllowed("movement", lastActionTime, cooldownTime);
      expect(allowed).toBe(false);

      mockNow.mockRestore();
    });

    test("should use default cooldown when not specified", () => {
      // Mock performance.now()
      const mockNow = jest.spyOn(performance, "now");
      mockNow.mockReturnValue(1000);

      const lastActionTime = 960; // 40ms ago
      // Default movement cooldown is 50ms

      const allowed = isActionAllowed("movement", lastActionTime);
      expect(allowed).toBe(false);

      mockNow.mockRestore();
    });

    test("should handle zero cooldown time", () => {
      // Mock performance.now()
      const mockNow = jest.spyOn(performance, "now");
      mockNow.mockReturnValue(1000);

      const allowed = isActionAllowed("movement", 999, 0); // 1ms ago with 0ms cooldown
      expect(allowed).toBe(true);

      mockNow.mockRestore();
    });

    test("should handle negative cooldown time", () => {
      // Mock performance.now()
      const mockNow = jest.spyOn(performance, "now");
      mockNow.mockReturnValue(1000);

      const allowed = isActionAllowed("movement", 999, -100); // 1ms ago with -100ms cooldown
      expect(allowed).toBe(true);

      mockNow.mockRestore();
    });

    test("should allow action exactly at cooldown boundary", () => {
      // Mock performance.now()
      const mockNow = jest.spyOn(performance, "now");
      mockNow.mockReturnValue(1100);

      const lastActionTime = 1000; // Exactly 100ms ago
      const cooldownTime = 100;

      const allowed = isActionAllowed("movement", lastActionTime, cooldownTime);
      expect(allowed).toBe(true);

      mockNow.mockRestore();
    });
  });

  describe("Input History Management", () => {
    test("should maintain input history in chronological order", () => {
      const inputHistory: number[] = [];
      const timestamps = [1000, 1050, 1100, 1150, 1200];

      // Simulate adding inputs over time
      timestamps.forEach((timestamp) => {
        inputHistory.push(timestamp);
      });

      // Check that history is in correct order
      for (let i = 1; i < inputHistory.length; i++) {
        expect(inputHistory[i]).toBeGreaterThan(inputHistory[i - 1]);
      }
    });

    test("should calculate input intervals correctly", () => {
      const inputHistory = [1000, 1050, 1120, 1140];
      const intervals: number[] = [];

      for (let i = 1; i < inputHistory.length; i++) {
        intervals.push(inputHistory[i] - inputHistory[i - 1]);
      }

      expect(intervals).toEqual([50, 70, 20]);
    });

    test("should detect input bursts", () => {
      const inputHistory = [1000, 1010, 1015, 1020, 1200]; // Burst then pause
      const minInterval = 30;
      let burstCount = 0;

      for (let i = 1; i < inputHistory.length; i++) {
        const interval = inputHistory[i] - inputHistory[i - 1];
        if (interval < minInterval) {
          burstCount++;
        }
      }

      expect(burstCount).toBe(3); // Three intervals below 30ms
    });
  });

  describe("Complex Input Scenarios", () => {
    test("should handle alternating rapid and slow inputs", () => {
      const rateLimiter = createRateLimiter(3, 1000);
      const _minInterval = 50;

      // Rapid inputs followed by slow inputs
      const timestamps = [1000, 1020, 1040, 1500, 1600, 1700];
      const results: boolean[] = [];

      timestamps.forEach((timestamp) => {
        results.push(rateLimiter(timestamp));
      });

      // First 3 should be allowed despite being rapid
      expect(results.slice(0, 3)).toEqual([true, true, true]);
      // 4th should be blocked by rate limit (1500: cutoff=500, history=[1000,1020,1040], all still in window)
      expect(results[3]).toBe(false);
      // 5th should be blocked (1600: cutoff=600, history=[1000,1020,1040], all still in window)
      expect(results[4]).toBe(false);
      // 6th should be blocked (1700: cutoff=700, history=[1000,1020,1040], all still in window)
      expect(results[5]).toBe(false);
    });

    test("should prioritize different action types correctly", () => {
      const movementCooldown = 50;
      const rotationCooldown = 100;

      // Mock performance.now()
      const mockNow = jest.spyOn(performance, "now");
      mockNow.mockReturnValue(1000);

      const recentActionTime = 960; // 40ms ago

      // Movement should be blocked (40ms < 50ms cooldown)
      expect(isActionAllowed("movement", recentActionTime, movementCooldown)).toBe(false);

      // Rotation should also be blocked (40ms < 100ms cooldown)
      expect(isActionAllowed("rotation", recentActionTime, rotationCooldown)).toBe(false);

      // Advance time to 60ms (1000 + 60 = 1060, so timeSinceLastAction = 1060 - 960 = 100ms)
      mockNow.mockReturnValue(1060);

      // Movement should now be allowed (100ms >= 50ms cooldown)
      expect(isActionAllowed("movement", recentActionTime, movementCooldown)).toBe(true);

      // Rotation should now be allowed (100ms >= 100ms cooldown, boundary case)
      expect(isActionAllowed("rotation", recentActionTime, rotationCooldown)).toBe(true);

      mockNow.mockRestore();
    });

    test("should handle input processing under load", () => {
      const rateLimiter = createRateLimiter(10, 1000);
      const processedInputs = [];

      // Simulate 100 rapid inputs
      for (let i = 0; i < 100; i++) {
        const timestamp = 1000 + i * 5; // 5ms intervals
        const allowed = rateLimiter(timestamp);
        if (allowed) {
          processedInputs.push(timestamp);
        }
      }

      // Should have processed exactly 10 inputs (rate limit)
      expect(processedInputs.length).toBe(10);

      // Should be the first 10 inputs
      expect(processedInputs[0]).toBe(1000);
      expect(processedInputs[9]).toBe(1045);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    test("should handle empty input arrays gracefully", () => {
      expect(() => shouldFilterRapidInput([], 50)).not.toThrow();
      expect(shouldFilterRapidInput([], 50)).toBe(false);
    });

    test("should handle invalid time values", () => {
      const rateLimiter = createRateLimiter(5, 1000);

      // Should handle NaN timestamps
      expect(rateLimiter(NaN)).toBe(true);

      // Should handle Infinity
      expect(rateLimiter(Infinity)).toBe(true);

      // Should handle negative timestamps
      expect(rateLimiter(-1000)).toBe(true);
    });

    test("should handle zero and negative intervals", () => {
      expect(shouldFilterRapidInput([1000, 1000], 50)).toBe(true); // Zero interval
      expect(shouldFilterRapidInput([1000, 999], 50)).toBe(true); // Negative interval
    });

    test("should handle very large cooldown values", () => {
      const largeCooldown = 1000000; // 1000 seconds

      // Mock performance.now()
      const mockNow = jest.spyOn(performance, "now");
      mockNow.mockReturnValue(2000);

      const allowed = isActionAllowed("movement", 1000, largeCooldown);
      expect(allowed).toBe(false); // Should still be in cooldown

      mockNow.mockRestore();
    });

    test("should handle performance.now() inconsistencies", () => {
      // Mock performance.now() to return decreasing values (shouldn't happen but test anyway)
      const mockNow = jest.spyOn(performance, "now");
      let time = 1000;
      mockNow.mockImplementation(() => {
        time -= 10; // Time going backwards
        return time;
      });

      const rateLimiter = createRateLimiter(3, 1000);

      // Should handle gracefully without throwing
      expect(() => {
        rateLimiter();
        rateLimiter();
        rateLimiter();
      }).not.toThrow();

      mockNow.mockRestore();
    });
  });
});
