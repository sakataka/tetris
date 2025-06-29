/**
 * Tests for tetromino operations and definitions
 * Following TDD approach - tests written before implementation
 */

import { describe, expect, test } from "bun:test";
import type { RotationState, TetrominoTypeName } from "../types/game";
import { COLOR_CONSTANTS } from "../utils/gameConstants";
import {
  createTetromino,
  getTetrominoColorIndex,
  getTetrominoShape,
  rotateTetromino,
  TETROMINO_COLOR_MAP,
  TETROMINO_SHAPES,
} from "./tetrominos";

describe("TETROMINO_SHAPES", () => {
  test("should contain all 7 standard tetromino shapes", () => {
    const expectedPieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];

    for (const piece of expectedPieces) {
      expect(TETROMINO_SHAPES[piece]).toBeDefined();
      expect(Array.isArray(TETROMINO_SHAPES[piece])).toBe(true);
    }
  });

  test("should have correct I-piece shape", () => {
    const expected = [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    expect(TETROMINO_SHAPES.I).toEqual(expected);
  });

  test("should have correct O-piece shape", () => {
    const expected = [
      [1, 1],
      [1, 1],
    ];
    expect(TETROMINO_SHAPES.O).toEqual(expected);
  });

  test("should have correct T-piece shape", () => {
    const expected = [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ];
    expect(TETROMINO_SHAPES.T).toEqual(expected);
  });

  test("should have correct S-piece shape", () => {
    const expected = [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ];
    expect(TETROMINO_SHAPES.S).toEqual(expected);
  });

  test("should have correct Z-piece shape", () => {
    const expected = [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ];
    expect(TETROMINO_SHAPES.Z).toEqual(expected);
  });

  test("should have correct J-piece shape", () => {
    const expected = [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ];
    expect(TETROMINO_SHAPES.J).toEqual(expected);
  });

  test("should have correct L-piece shape", () => {
    const expected = [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ];
    expect(TETROMINO_SHAPES.L).toEqual(expected);
  });
});

describe("TETROMINO_COLOR_MAP", () => {
  test("should map each piece to correct color index", () => {
    expect(TETROMINO_COLOR_MAP.I).toBe(COLOR_CONSTANTS.I_PIECE);
    expect(TETROMINO_COLOR_MAP.O).toBe(COLOR_CONSTANTS.O_PIECE);
    expect(TETROMINO_COLOR_MAP.T).toBe(COLOR_CONSTANTS.T_PIECE);
    expect(TETROMINO_COLOR_MAP.S).toBe(COLOR_CONSTANTS.S_PIECE);
    expect(TETROMINO_COLOR_MAP.Z).toBe(COLOR_CONSTANTS.Z_PIECE);
    expect(TETROMINO_COLOR_MAP.J).toBe(COLOR_CONSTANTS.J_PIECE);
    expect(TETROMINO_COLOR_MAP.L).toBe(COLOR_CONSTANTS.L_PIECE);
  });

  test("should have all 7 piece types mapped", () => {
    const pieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];
    expect(Object.keys(TETROMINO_COLOR_MAP)).toHaveLength(7);

    for (const piece of pieces) {
      expect(TETROMINO_COLOR_MAP[piece]).toBeGreaterThan(0);
      expect(TETROMINO_COLOR_MAP[piece]).toBeLessThanOrEqual(7);
    }
  });
});

describe("getTetrominoShape", () => {
  test("should return correct shapes for all piece types", () => {
    const pieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];

    for (const piece of pieces) {
      const shape = getTetrominoShape(piece);
      expect(shape).toEqual(TETROMINO_SHAPES[piece]);
    }
  });

  test("should return deep copy (not reference)", () => {
    const shape1 = getTetrominoShape("T");
    const shape2 = getTetrominoShape("T");

    // Modify one shape
    shape1[0][0] = 9;

    // Other shape should remain unchanged
    expect(shape2[0][0]).toBe(0);
    expect(shape1 !== shape2).toBe(true);
  });

  test("should return valid 2D arrays", () => {
    const pieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];

    for (const piece of pieces) {
      const shape = getTetrominoShape(piece);

      expect(Array.isArray(shape)).toBe(true);
      expect(shape.length).toBeGreaterThan(0);

      for (const row of shape) {
        expect(Array.isArray(row)).toBe(true);
        expect(row.length).toBeGreaterThan(0);

        for (const cell of row) {
          expect(typeof cell).toBe("number");
          expect(cell === 0 || cell === 1).toBe(true);
        }
      }
    }
  });
});

describe("getTetrominoColorIndex", () => {
  test("should return correct color indices", () => {
    expect(getTetrominoColorIndex("I")).toBe(1);
    expect(getTetrominoColorIndex("O")).toBe(2);
    expect(getTetrominoColorIndex("T")).toBe(3);
    expect(getTetrominoColorIndex("S")).toBe(4);
    expect(getTetrominoColorIndex("Z")).toBe(5);
    expect(getTetrominoColorIndex("J")).toBe(6);
    expect(getTetrominoColorIndex("L")).toBe(7);
  });

  test("should return valid color indices for all pieces", () => {
    const pieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];

    for (const piece of pieces) {
      const colorIndex = getTetrominoColorIndex(piece);
      expect(colorIndex).toBeGreaterThan(0);
      expect(colorIndex).toBeLessThanOrEqual(7);
    }
  });
});

describe("rotateTetromino", () => {
  test("should rotate T-piece clockwise correctly", () => {
    const original = [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ];

    const rotated = rotateTetromino(original);
    const expected = [
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 0],
    ];

    expect(rotated).toEqual(expected);
  });

  test("should rotate I-piece clockwise correctly", () => {
    const original = [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    const rotated = rotateTetromino(original);
    const expected = [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ];

    expect(rotated).toEqual(expected);
  });

  test("should not modify O-piece when rotated", () => {
    const original = [
      [1, 1],
      [1, 1],
    ];

    const rotated = rotateTetromino(original);
    expect(rotated).toEqual(original);
  });

  test("should return to original after 4 rotations", () => {
    const pieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];

    for (const piece of pieces) {
      let shape = getTetrominoShape(piece);
      const original = getTetrominoShape(piece);

      // Rotate 4 times
      for (let i = 0; i < 4; i++) {
        shape = rotateTetromino(shape);
      }

      expect(shape).toEqual(original);
    }
  });

  test("should handle all standard piece rotations", () => {
    const pieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];

    for (const piece of pieces) {
      const shape = getTetrominoShape(piece);
      const rotated = rotateTetromino(shape);

      // Should be a valid 2D array
      expect(Array.isArray(rotated)).toBe(true);
      expect(rotated.length).toBeGreaterThan(0);

      // Should contain only 0s and 1s
      for (const row of rotated) {
        for (const cell of row) {
          expect(cell === 0 || cell === 1).toBe(true);
        }
      }
    }
  });

  test("should not modify original shape matrix", () => {
    const original = [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ];

    const originalCopy = original.map((row) => [...row]);
    const rotated = rotateTetromino(original);

    expect(original).toEqual(originalCopy);
    expect(rotated !== original).toBe(true);
  });
});

describe("createTetromino", () => {
  test("should create tetromino at correct spawn position", () => {
    const tetromino = createTetromino("T");

    expect(tetromino.type).toBe("T");
    expect(tetromino.rotation).toBe(0);
    expect(tetromino.position.y).toBe(21); // Buffer area spawn
    expect(tetromino.position.x).toBe(3); // Centered for 3-wide piece
    expect(tetromino.shape).toEqual(TETROMINO_SHAPES.T);
  });

  test("should handle all piece types correctly", () => {
    const pieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];

    for (const piece of pieces) {
      const tetromino = createTetromino(piece);

      expect(tetromino.type).toBe(piece);
      expect(tetromino.rotation).toBe(0);
      expect(tetromino.position.y).toBe(21);
      expect(tetromino.shape).toEqual(TETROMINO_SHAPES[piece]);

      // X position should be valid for centering
      expect(tetromino.position.x).toBeGreaterThanOrEqual(0);
      expect(tetromino.position.x).toBeLessThan(10);
    }
  });

  test("should center pieces correctly based on width", () => {
    // I-piece (4-wide) should be at x=3
    const iPiece = createTetromino("I");
    expect(iPiece.position.x).toBe(3);

    // O-piece (2-wide) should be at x=4
    const oPiece = createTetromino("O");
    expect(oPiece.position.x).toBe(4);

    // T-piece (3-wide) should be at x=3
    const tPiece = createTetromino("T");
    expect(tPiece.position.x).toBe(3);
  });

  test("should create new instance each time", () => {
    const tetromino1 = createTetromino("T");
    const tetromino2 = createTetromino("T");

    expect(tetromino1 !== tetromino2).toBe(true);
    expect(tetromino1.shape !== tetromino2.shape).toBe(true);

    // Modify one tetromino
    tetromino1.position.x = 5;

    // Other should remain unchanged
    expect(tetromino2.position.x).toBe(3);
  });

  test("should create tetromino with specified rotation", () => {
    const tetromino = createTetromino("T", 1);

    expect(tetromino.type).toBe("T");
    expect(tetromino.rotation).toBe(1);
    expect(tetromino.position.y).toBe(21);

    // Shape should be rotated
    const expectedShape = rotateTetromino(TETROMINO_SHAPES.T);
    expect(tetromino.shape).toEqual(expectedShape);
  });

  test("should handle all rotation states", () => {
    const rotations: RotationState[] = [0, 1, 2, 3];

    for (const rotation of rotations) {
      const tetromino = createTetromino("T", rotation);
      expect(tetromino.rotation).toBe(rotation);
    }
  });
});
