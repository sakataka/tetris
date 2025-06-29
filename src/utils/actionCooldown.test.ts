import { beforeEach, describe, expect, test } from "bun:test";
import {
  type ActionCooldownManager,
  createActionCooldownManager,
  createInputDebouncer,
  type InputDebouncer,
  shouldFilterRapidInput,
} from "@/utils/actionCooldown";

describe("actionCooldown", () => {
  let mockCurrentTime = 1000;

  // Mock performance.now() for consistent testing
  const originalPerformanceNow = performance.now;
  beforeEach(() => {
    mockCurrentTime = 1000;
    performance.now = () => mockCurrentTime;
  });

  // Restore original function after tests
  // Note: In a real test environment, you might want to use afterEach or afterAll
  const restoreTime = () => {
    performance.now = originalPerformanceNow;
  };

  describe("createActionCooldownManager", () => {
    test("should create manager with default cooldown times", () => {
      const manager = createActionCooldownManager();

      expect(manager).toBeDefined();
      expect(typeof manager.isActionAllowed).toBe("function");
      expect(typeof manager.recordAction).toBe("function");
      expect(typeof manager.resetCooldown).toBe("function");
    });

    test("should create manager with custom cooldown times", () => {
      const customCooldowns = {
        movement: 30,
        rotation: 80,
        drop: 40,
        hardDrop: 250,
        hold: 150,
      };

      const manager = createActionCooldownManager(customCooldowns);
      expect(manager).toBeDefined();
    });
  });

  describe("isActionAllowed", () => {
    let manager: ActionCooldownManager;

    beforeEach(() => {
      manager = createActionCooldownManager();
    });

    test("should allow action when no previous action recorded", () => {
      const allowed = manager.isActionAllowed("movement");
      expect(allowed).toBe(true);
    });

    test("should block action within cooldown period", () => {
      // Record first action
      manager.recordAction("movement");

      // Advance time by less than cooldown (50ms)
      mockCurrentTime += 30;

      const allowed = manager.isActionAllowed("movement");
      expect(allowed).toBe(false);
    });

    test("should allow action after cooldown period", () => {
      // Record first action
      manager.recordAction("movement");

      // Advance time beyond cooldown (50ms)
      mockCurrentTime += 60;

      const allowed = manager.isActionAllowed("movement");
      expect(allowed).toBe(true);
    });

    test("should handle different action types independently", () => {
      // Record movement action
      manager.recordAction("movement");

      // Rotation should still be allowed
      const rotationAllowed = manager.isActionAllowed("rotation");
      expect(rotationAllowed).toBe(true);

      // Movement should be blocked
      const movementAllowed = manager.isActionAllowed("movement");
      expect(movementAllowed).toBe(false);
    });

    test("should respect different cooldown times for different actions", () => {
      const customCooldowns = {
        movement: 50,
        rotation: 100,
        drop: 50,
        hardDrop: 300,
        hold: 200,
      };

      manager = createActionCooldownManager(customCooldowns);

      // Record rotation action (100ms cooldown)
      manager.recordAction("rotation");

      // Check at 60ms - should still be blocked
      mockCurrentTime += 60;
      expect(manager.isActionAllowed("rotation")).toBe(false);

      // Check at 110ms - should be allowed
      mockCurrentTime += 50; // Total: 110ms
      expect(manager.isActionAllowed("rotation")).toBe(true);
    });
  });

  describe("recordAction", () => {
    let manager: ActionCooldownManager;

    beforeEach(() => {
      manager = createActionCooldownManager();
    });

    test("should record action timestamp", () => {
      const result = manager.recordAction("movement");
      expect(result).toBe(true);

      // Subsequent action should be blocked
      const allowed = manager.isActionAllowed("movement");
      expect(allowed).toBe(false);
    });

    test("should not record action if within cooldown", () => {
      // Record first action
      manager.recordAction("movement");

      // Try to record second action within cooldown
      mockCurrentTime += 30;
      const result = manager.recordAction("movement");
      expect(result).toBe(false);
    });

    test("should record action after cooldown expires", () => {
      // Record first action
      manager.recordAction("movement");

      // Wait for cooldown to expire
      mockCurrentTime += 60;

      // Should be able to record again
      const result = manager.recordAction("movement");
      expect(result).toBe(true);
    });
  });

  describe("resetCooldown", () => {
    let manager: ActionCooldownManager;

    beforeEach(() => {
      manager = createActionCooldownManager();
    });

    test("should reset cooldown for specific action", () => {
      // Record action
      manager.recordAction("movement");

      // Should be blocked
      expect(manager.isActionAllowed("movement")).toBe(false);

      // Reset cooldown
      manager.resetCooldown("movement");

      // Should now be allowed
      expect(manager.isActionAllowed("movement")).toBe(true);
    });

    test("should only reset specified action type", () => {
      // Record multiple actions
      manager.recordAction("movement");
      manager.recordAction("rotation");

      // Reset only movement
      manager.resetCooldown("movement");

      // Movement should be allowed, rotation should still be blocked
      expect(manager.isActionAllowed("movement")).toBe(true);
      expect(manager.isActionAllowed("rotation")).toBe(false);
    });
  });

  describe("resetAllCooldowns", () => {
    let manager: ActionCooldownManager;

    beforeEach(() => {
      manager = createActionCooldownManager();
    });

    test("should reset all action cooldowns", () => {
      // Record multiple actions
      manager.recordAction("movement");
      manager.recordAction("rotation");
      manager.recordAction("drop");

      // All should be blocked
      expect(manager.isActionAllowed("movement")).toBe(false);
      expect(manager.isActionAllowed("rotation")).toBe(false);
      expect(manager.isActionAllowed("drop")).toBe(false);

      // Reset all cooldowns
      manager.resetAllCooldowns();

      // All should now be allowed
      expect(manager.isActionAllowed("movement")).toBe(true);
      expect(manager.isActionAllowed("rotation")).toBe(true);
      expect(manager.isActionAllowed("drop")).toBe(true);
    });
  });

  describe("getCooldownRemaining", () => {
    let manager: ActionCooldownManager;

    beforeEach(() => {
      manager = createActionCooldownManager();
    });

    test("should return 0 when no action recorded", () => {
      const remaining = manager.getCooldownRemaining("movement");
      expect(remaining).toBe(0);
    });

    test("should return correct remaining time", () => {
      // Record action (50ms cooldown for movement)
      manager.recordAction("movement");

      // Advance time by 20ms
      mockCurrentTime += 20;

      const remaining = manager.getCooldownRemaining("movement");
      expect(remaining).toBe(30); // 50 - 20 = 30
    });

    test("should return 0 when cooldown has expired", () => {
      // Record action
      manager.recordAction("movement");

      // Advance time beyond cooldown
      mockCurrentTime += 60;

      const remaining = manager.getCooldownRemaining("movement");
      expect(remaining).toBe(0);
    });
  });

  describe("createInputDebouncer", () => {
    test("should create debouncer with default settings", () => {
      const debouncer = createInputDebouncer();

      expect(debouncer).toBeDefined();
      expect(typeof debouncer.shouldAllowInput).toBe("function");
      expect(typeof debouncer.recordInput).toBe("function");
    });

    test("should create debouncer with custom settings", () => {
      const debouncer = createInputDebouncer({
        debounceTime: 100,
        maxInputsPerSecond: 20,
      });

      expect(debouncer).toBeDefined();
    });
  });

  describe("InputDebouncer", () => {
    let debouncer: InputDebouncer;

    beforeEach(() => {
      debouncer = createInputDebouncer({
        debounceTime: 50,
        maxInputsPerSecond: 10,
      });
    });

    test("should allow first input", () => {
      const allowed = debouncer.shouldAllowInput();
      expect(allowed).toBe(true);
    });

    test("should block rapid inputs within debounce time", () => {
      // Record first input
      debouncer.recordInput();

      // Try second input within debounce time
      mockCurrentTime += 30;
      const allowed = debouncer.shouldAllowInput();
      expect(allowed).toBe(false);
    });

    test("should allow input after debounce time", () => {
      // Record first input
      debouncer.recordInput();

      // Wait beyond debounce time
      mockCurrentTime += 60;
      const allowed = debouncer.shouldAllowInput();
      expect(allowed).toBe(true);
    });

    test("should enforce max inputs per second limit", () => {
      const debouncer = createInputDebouncer({
        debounceTime: 10, // Very short debounce
        maxInputsPerSecond: 5, // Limit to 5 inputs per second
      });

      // Record 5 inputs within 1 second
      for (let i = 0; i < 5; i++) {
        expect(debouncer.shouldAllowInput()).toBe(true);
        debouncer.recordInput();
        mockCurrentTime += 200; // 200ms intervals = 5 per second
      }

      // 6th input should be blocked
      expect(debouncer.shouldAllowInput()).toBe(false);
    });

    test("should reset rate limit after time window", () => {
      const debouncer = createInputDebouncer({
        debounceTime: 10,
        maxInputsPerSecond: 3,
      });

      // Fill up the rate limit
      for (let i = 0; i < 3; i++) {
        debouncer.recordInput();
        mockCurrentTime += 300;
      }

      // Should be blocked
      expect(debouncer.shouldAllowInput()).toBe(false);

      // Wait for rate limit window to reset (1 second + some buffer)
      mockCurrentTime += 1200;

      // Should be allowed again
      expect(debouncer.shouldAllowInput()).toBe(true);
    });
  });

  describe("shouldFilterRapidInput", () => {
    test("should filter inputs that are too rapid", () => {
      const inputHistory = [1000, 1050, 1100]; // 50ms intervals
      const minInterval = 100; // Require 100ms between inputs

      const shouldFilter = shouldFilterRapidInput(inputHistory, minInterval);
      expect(shouldFilter).toBe(true);
    });

    test("should allow inputs with sufficient spacing", () => {
      const inputHistory = [1000, 1150, 1300]; // 150ms intervals
      const minInterval = 100;

      const shouldFilter = shouldFilterRapidInput(inputHistory, minInterval);
      expect(shouldFilter).toBe(false);
    });

    test("should handle empty input history", () => {
      const inputHistory: number[] = [];
      const minInterval = 100;

      const shouldFilter = shouldFilterRapidInput(inputHistory, minInterval);
      expect(shouldFilter).toBe(false);
    });

    test("should handle single input in history", () => {
      const inputHistory = [1000];
      const minInterval = 100;

      const shouldFilter = shouldFilterRapidInput(inputHistory, minInterval);
      expect(shouldFilter).toBe(false);
    });
  });

  // Cleanup after all tests
  setTimeout(() => {
    restoreTime();
  }, 0);
});
