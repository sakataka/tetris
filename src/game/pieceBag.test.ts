import { describe, expect, test } from "bun:test";
import type { TetrominoTypeName } from "@/types/game";

// Import functions to be tested (they don't exist yet, but we're following TDD)
import { createPieceBag, getBagContents, getNextPiece, setBagForTesting } from "./pieceBag";

describe("createPieceBag", () => {
  test("should contain all 7 pieces exactly once", () => {
    const bag = createPieceBag();

    expect(bag).toHaveLength(7);

    const expectedPieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];
    const sortedBag = [...bag].sort();
    const sortedExpected = [...expectedPieces].sort();

    expect(sortedBag).toEqual(sortedExpected);
  });

  test("should return randomized order", () => {
    const bag1 = createPieceBag();
    const bag2 = createPieceBag();

    // With 7! = 5040 possible permutations, it's extremely unlikely
    // two random bags would be identical
    expect(bag1).not.toEqual(bag2);
  });

  test("should have each piece appear exactly once", () => {
    const bag = createPieceBag();
    const pieceCounts: Record<TetrominoTypeName, number> = {
      I: 0,
      O: 0,
      T: 0,
      S: 0,
      Z: 0,
      J: 0,
      L: 0,
    };

    for (const piece of bag) {
      pieceCounts[piece]++;
    }

    // Each piece should appear exactly once
    expect(pieceCounts.I).toBe(1);
    expect(pieceCounts.O).toBe(1);
    expect(pieceCounts.T).toBe(1);
    expect(pieceCounts.S).toBe(1);
    expect(pieceCounts.Z).toBe(1);
    expect(pieceCounts.J).toBe(1);
    expect(pieceCounts.L).toBe(1);
  });
});

describe("getNextPiece", () => {
  test("should return first piece and remaining bag", () => {
    const testBag: TetrominoTypeName[] = ["I", "T", "O", "L", "J", "S", "Z"];

    const [nextPiece, remainingBag] = getNextPiece(testBag);

    expect(nextPiece).toBe("I");
    expect(remainingBag).toEqual(["T", "O", "L", "J", "S", "Z"]);
    expect(remainingBag).toHaveLength(6);
  });

  test("should refill bag when empty", () => {
    const emptyBag: TetrominoTypeName[] = [];

    const [nextPiece, remainingBag] = getNextPiece(emptyBag);

    // Should get a piece from a new bag
    expect(nextPiece).toMatch(/^[IOTSZJL]$/);
    expect(remainingBag).toHaveLength(6); // 7 - 1 = 6

    // Remaining bag should contain 6 unique pieces
    const uniquePieces = new Set(remainingBag);
    expect(uniquePieces.size).toBe(6);
  });

  test("should handle single piece in bag", () => {
    const singlePieceBag: TetrominoTypeName[] = ["T"];

    const [nextPiece, remainingBag] = getNextPiece(singlePieceBag);

    expect(nextPiece).toBe("T");
    expect(remainingBag).toEqual([]);
  });

  test("should not mutate original bag", () => {
    const originalBag: TetrominoTypeName[] = ["I", "T", "O"];
    const bagCopy = [...originalBag];

    getNextPiece(originalBag);

    expect(originalBag).toEqual(bagCopy);
  });
});

describe("bag distribution over multiple generations", () => {
  test("over 1000 bags, each piece should appear approximately 142 times", () => {
    const totalBags = 1000;
    const pieceCounts: Record<TetrominoTypeName, number> = {
      I: 0,
      O: 0,
      T: 0,
      S: 0,
      Z: 0,
      J: 0,
      L: 0,
    };

    // Generate 1000 bags and count pieces
    for (let i = 0; i < totalBags; i++) {
      const bag = createPieceBag();
      for (const piece of bag) {
        pieceCounts[piece]++;
      }
    }

    // Each piece should appear exactly 1000 times (once per bag)
    expect(pieceCounts.I).toBe(1000);
    expect(pieceCounts.O).toBe(1000);
    expect(pieceCounts.T).toBe(1000);
    expect(pieceCounts.S).toBe(1000);
    expect(pieceCounts.Z).toBe(1000);
    expect(pieceCounts.J).toBe(1000);
    expect(pieceCounts.L).toBe(1000);
  });

  test("distribution should be fair over many getNextPiece calls", () => {
    let currentBag: TetrominoTypeName[] = [];
    const pieceCounts: Record<TetrominoTypeName, number> = {
      I: 0,
      O: 0,
      T: 0,
      S: 0,
      Z: 0,
      J: 0,
      L: 0,
    };

    // Get 7000 pieces (equivalent to 1000 complete bags)
    for (let i = 0; i < 7000; i++) {
      const [piece, remainingBag] = getNextPiece(currentBag);
      pieceCounts[piece]++;
      currentBag = remainingBag;
    }

    // Each piece should appear exactly 1000 times
    expect(pieceCounts.I).toBe(1000);
    expect(pieceCounts.O).toBe(1000);
    expect(pieceCounts.T).toBe(1000);
    expect(pieceCounts.S).toBe(1000);
    expect(pieceCounts.Z).toBe(1000);
    expect(pieceCounts.J).toBe(1000);
    expect(pieceCounts.L).toBe(1000);
  });
});

describe("Fisher-Yates shuffle implementation", () => {
  test("should properly randomize array without bias", () => {
    // Test that pieces appear in all positions with roughly equal frequency
    const positionCounts: number[][] = Array(7)
      .fill(null)
      .map(() => Array(7).fill(0));
    const iterations = 10000;

    // This test verifies that createPieceBag produces sufficiently random results
    // by checking if each piece appears in each position with equal probability

    for (let i = 0; i < iterations; i++) {
      const bag = createPieceBag();
      bag.forEach((piece, index) => {
        const pieceIndex = ["I", "O", "T", "S", "Z", "J", "L"].indexOf(piece);
        positionCounts[pieceIndex][index]++;
      });
    }

    // Each piece should appear in each position roughly equally (within statistical variance)
    const expectedCount = iterations / 7;
    const tolerance = expectedCount * 0.15; // 15% tolerance

    for (let piece = 0; piece < 7; piece++) {
      for (let position = 0; position < 7; position++) {
        expect(positionCounts[piece][position]).toBeGreaterThan(expectedCount - tolerance);
        expect(positionCounts[piece][position]).toBeLessThan(expectedCount + tolerance);
      }
    }
  });
});

describe("edge cases and error handling", () => {
  test("should handle empty bag gracefully", () => {
    const emptyBag: TetrominoTypeName[] = [];

    expect(() => getNextPiece(emptyBag)).not.toThrow();

    const [piece, remainingBag] = getNextPiece(emptyBag);
    expect(piece).toMatch(/^[IOTSZJL]$/);
    expect(remainingBag).toHaveLength(6);
  });

  test("setBagForTesting should allow deterministic testing", () => {
    const testBag: TetrominoTypeName[] = ["I", "T", "O"];
    setBagForTesting(testBag);

    const [piece1, bag1] = getNextPiece([]);
    const [piece2, bag2] = getNextPiece(bag1);
    const [piece3, bag3] = getNextPiece(bag2);

    expect(piece1).toBe("I");
    expect(piece2).toBe("T");
    expect(piece3).toBe("O");
    expect(bag3).toEqual([]);
  });

  test("getBagContents should return copy of current test bag", () => {
    const testBag: TetrominoTypeName[] = ["J", "L", "S"];
    setBagForTesting(testBag);

    const contents = getBagContents();
    expect(contents).toEqual(testBag);

    // Should be a copy, not a reference
    contents.push("Z");
    expect(getBagContents()).toEqual(testBag);
  });

  test("should reset to normal behavior after test", () => {
    // Set test bag
    setBagForTesting(["I"]);

    // Reset to normal
    setBagForTesting(null);

    // Should now behave normally
    const bag = createPieceBag();
    expect(bag).toHaveLength(7);

    const uniquePieces = new Set(bag);
    expect(uniquePieces.size).toBe(7);
  });
});

describe("performance and memory", () => {
  test("should handle large number of operations efficiently", () => {
    const startTime = performance.now();

    // Generate 10000 bags
    for (let i = 0; i < 10000; i++) {
      createPieceBag();
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should complete in reasonable time (under 100ms)
    expect(duration).toBeLessThan(100);
  });

  test("should not cause memory leaks with repeated calls", () => {
    let currentBag: TetrominoTypeName[] = [];

    // Simulate long game session
    for (let i = 0; i < 10000; i++) {
      const [, remainingBag] = getNextPiece(currentBag);
      currentBag = remainingBag;
    }

    // Should still work correctly after many operations
    expect(currentBag.length).toBeGreaterThanOrEqual(0);
    expect(currentBag.length).toBeLessThanOrEqual(6);
  });
});
