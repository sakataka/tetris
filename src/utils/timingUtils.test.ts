import { describe, expect, test } from "bun:test";
import {
  calculateActionCooldown,
  calculateDeltaTime,
  calculateFallSpeed,
  createFrameRateLimiter,
  isTimingConsistent,
  normalizeFrameTime,
  validateTimingInterval,
} from "@/utils/timingUtils";

describe("timingUtils", () => {
  describe("calculateFallSpeed", () => {
    test("should return correct fall speed for level 1", () => {
      const speed = calculateFallSpeed(1);
      expect(speed).toBe(1000); // Initial drop speed
    });

    test("should return correct fall speed for level 5", () => {
      const speed = calculateFallSpeed(5);
      expect(speed).toBe(600); // 1000 - (5-1) * 100
    });

    test("should return correct fall speed for level 10", () => {
      const speed = calculateFallSpeed(10);
      expect(speed).toBe(100); // 1000 - (10-1) * 100 = 100 (minimum)
    });

    test("should return minimum speed for levels above 10", () => {
      const speed = calculateFallSpeed(15);
      expect(speed).toBe(100); // Should stay at minimum
    });

    test("should return minimum speed for very high levels", () => {
      const speed = calculateFallSpeed(999);
      expect(speed).toBe(100); // Should stay at minimum
    });

    test("should handle level 0 gracefully", () => {
      const speed = calculateFallSpeed(0);
      expect(speed).toBe(1100); // 1000 - (0-1) * 100 = 1100
    });

    test("should handle negative levels", () => {
      const speed = calculateFallSpeed(-5);
      expect(speed).toBe(1600); // 1000 - (-5-1) * 100 = 1600
    });
  });

  describe("validateTimingInterval", () => {
    test("should validate correct timing interval", () => {
      const isValid = validateTimingInterval(16.67); // ~60fps
      expect(isValid).toBe(true);
    });

    test("should reject too short intervals", () => {
      const isValid = validateTimingInterval(1);
      expect(isValid).toBe(false);
    });

    test("should reject too long intervals", () => {
      const isValid = validateTimingInterval(1000);
      expect(isValid).toBe(false);
    });

    test("should validate 30fps interval", () => {
      const isValid = validateTimingInterval(33.33);
      expect(isValid).toBe(true);
    });

    test("should reject zero interval", () => {
      const isValid = validateTimingInterval(0);
      expect(isValid).toBe(false);
    });

    test("should reject negative intervals", () => {
      const isValid = validateTimingInterval(-10);
      expect(isValid).toBe(false);
    });
  });

  describe("calculateActionCooldown", () => {
    test("should calculate movement cooldown correctly", () => {
      const cooldown = calculateActionCooldown("movement");
      expect(cooldown).toBe(50); // DAS repeat rate
    });

    test("should calculate rotation cooldown correctly", () => {
      const cooldown = calculateActionCooldown("rotation");
      expect(cooldown).toBe(100); // Rotation cooldown
    });

    test("should calculate drop cooldown correctly", () => {
      const cooldown = calculateActionCooldown("drop");
      expect(cooldown).toBe(50); // Soft drop rate
    });

    test("should calculate hard drop cooldown correctly", () => {
      const cooldown = calculateActionCooldown("hardDrop");
      expect(cooldown).toBe(300); // Hard drop cooldown
    });

    test("should calculate hold cooldown correctly", () => {
      const cooldown = calculateActionCooldown("hold");
      expect(cooldown).toBe(200); // Hold action cooldown
    });

    test("should handle unknown action type", () => {
      const cooldown = calculateActionCooldown("unknown" as any);
      expect(cooldown).toBe(100); // Default cooldown
    });
  });

  describe("createFrameRateLimiter", () => {
    test("should create frame rate limiter with correct interval", () => {
      const limiter = createFrameRateLimiter(60);
      expect(limiter.targetInterval).toBe(16.666666666666668); // 1000/60
    });

    test("should handle 30fps target", () => {
      const limiter = createFrameRateLimiter(30);
      expect(limiter.targetInterval).toBeCloseTo(33.33, 2);
    });

    test("should handle maximum fps limit", () => {
      const limiter = createFrameRateLimiter(144);
      expect(limiter.targetInterval).toBeCloseTo(6.94, 2);
    });

    test("should detect when frame should be skipped", () => {
      const limiter = createFrameRateLimiter(60);
      const now = performance.now();

      // First frame should not be skipped
      expect(limiter.shouldSkipFrame(now)).toBe(false);

      // Frame after very short time should be skipped
      expect(limiter.shouldSkipFrame(now + 1)).toBe(true);

      // Frame after target interval should not be skipped
      expect(limiter.shouldSkipFrame(now + limiter.targetInterval + 1)).toBe(false);
    });
  });

  describe("isTimingConsistent", () => {
    test("should detect consistent timing", () => {
      const timestamps = [100, 116.67, 133.34, 150.01]; // ~60fps
      const isConsistent = isTimingConsistent(timestamps, 16.67, 2); // ±2ms tolerance
      expect(isConsistent).toBe(true);
    });

    test("should detect inconsistent timing", () => {
      const timestamps = [100, 150, 180, 250]; // Irregular intervals
      const isConsistent = isTimingConsistent(timestamps, 16.67, 2);
      expect(isConsistent).toBe(false);
    });

    test("should handle single timestamp", () => {
      const timestamps = [100];
      const isConsistent = isTimingConsistent(timestamps, 16.67, 2);
      expect(isConsistent).toBe(true); // Single timestamp is consistent
    });

    test("should handle empty array", () => {
      const timestamps: number[] = [];
      const isConsistent = isTimingConsistent(timestamps, 16.67, 2);
      expect(isConsistent).toBe(true); // Empty array is consistent
    });

    test("should work with strict tolerance", () => {
      const timestamps = [100, 116.67, 133.5, 150.01]; // One slightly off
      const isConsistent = isTimingConsistent(timestamps, 16.67, 0.1);
      expect(isConsistent).toBe(false);
    });
  });

  describe("calculateDeltaTime", () => {
    test("should calculate correct delta time", () => {
      const currentTime = 1000;
      const lastTime = 950;
      const delta = calculateDeltaTime(currentTime, lastTime);
      expect(delta).toBe(50);
    });

    test("should handle zero delta", () => {
      const currentTime = 1000;
      const lastTime = 1000;
      const delta = calculateDeltaTime(currentTime, lastTime);
      expect(delta).toBe(0);
    });

    test("should handle negative delta (time went backwards)", () => {
      const currentTime = 950;
      const lastTime = 1000;
      const delta = calculateDeltaTime(currentTime, lastTime);
      expect(delta).toBe(0); // Should clamp to 0
    });

    test("should cap extremely large deltas", () => {
      const currentTime = 2000;
      const lastTime = 0;
      const delta = calculateDeltaTime(currentTime, lastTime);
      expect(delta).toBe(100); // Should cap at 100ms max
    });
  });

  describe("normalizeFrameTime", () => {
    test("should normalize frame time to 60fps equivalent", () => {
      const frameTime = 33.33; // 30fps
      const normalized = normalizeFrameTime(frameTime, 60);
      expect(normalized).toBeCloseTo(2, 1); // 30fps is 2x slower than 60fps
    });

    test("should handle 60fps as baseline", () => {
      const frameTime = 16.67; // 60fps
      const normalized = normalizeFrameTime(frameTime, 60);
      expect(normalized).toBeCloseTo(1, 1); // Should be 1x multiplier
    });

    test("should handle 120fps", () => {
      const frameTime = 8.33; // 120fps
      const normalized = normalizeFrameTime(frameTime, 60);
      expect(normalized).toBeCloseTo(0.5, 1); // 120fps is 0.5x faster than 60fps
    });

    test("should cap minimum normalized time", () => {
      const frameTime = 1; // Very fast
      const normalized = normalizeFrameTime(frameTime, 60);
      expect(normalized).toBeGreaterThanOrEqual(0.1); // Should not go below 0.1x
    });

    test("should cap maximum normalized time", () => {
      const frameTime = 1000; // Very slow
      const normalized = normalizeFrameTime(frameTime, 60);
      expect(normalized).toBeLessThanOrEqual(10); // Should not go above 10x
    });
  });
});
