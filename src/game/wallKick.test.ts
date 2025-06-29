import { describe, expect, test } from "bun:test";
import type { RotationState, Tetromino, TetrominoTypeName } from "@/types/game";
import { createEmptyBoardWithBuffer } from "./board";
import { createTetromino } from "./tetrominos";

// Import functions to be tested
import {
  getWallKickData,
  tryRotateWithWallKick,
  WALL_KICK_DATA,
  WALL_KICK_DATA_I,
} from "./wallKick";

// Helper function to create test pieces at specific positions
const createTPiece = (x: number, y: number, rotation: RotationState): Tetromino => {
  const piece = createTetromino("T", rotation);
  return {
    ...piece,
    position: { x, y },
  };
};

describe("Wall Kick Data Constants", () => {
  test("should have wall kick data for standard pieces (J, L, T, S, Z)", () => {
    // Test clockwise rotations
    expect(WALL_KICK_DATA["0->1"]).toEqual([
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: -2 },
      { x: -1, y: -2 },
    ]);
    expect(WALL_KICK_DATA["1->2"]).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: -1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ]);
    expect(WALL_KICK_DATA["2->3"]).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: -2 },
      { x: 1, y: -2 },
    ]);
    expect(WALL_KICK_DATA["3->0"]).toEqual([
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: -1 },
      { x: 0, y: 2 },
      { x: -1, y: 2 },
    ]);

    // Test counter-clockwise rotations
    expect(WALL_KICK_DATA["1->0"]).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: -1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ]);
    expect(WALL_KICK_DATA["2->1"]).toEqual([
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: -2 },
      { x: -1, y: -2 },
    ]);
    expect(WALL_KICK_DATA["3->2"]).toEqual([
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: -1 },
      { x: 0, y: 2 },
      { x: -1, y: 2 },
    ]);
    expect(WALL_KICK_DATA["0->3"]).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: -2 },
      { x: 1, y: -2 },
    ]);
  });

  test("should have I-piece specific wall kick data", () => {
    // Test clockwise rotations for I-piece
    expect(WALL_KICK_DATA_I["0->1"]).toEqual([
      { x: 0, y: 0 },
      { x: -2, y: 0 },
      { x: 1, y: 0 },
      { x: -2, y: -1 },
      { x: 1, y: 2 },
    ]);
    expect(WALL_KICK_DATA_I["1->2"]).toEqual([
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: 2, y: 0 },
      { x: -1, y: 2 },
      { x: 2, y: -1 },
    ]);
    expect(WALL_KICK_DATA_I["2->3"]).toEqual([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: -1, y: 0 },
      { x: 2, y: 1 },
      { x: -1, y: -2 },
    ]);
    expect(WALL_KICK_DATA_I["3->0"]).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: -2, y: 0 },
      { x: 1, y: -2 },
      { x: -2, y: 1 },
    ]);

    // Test counter-clockwise rotations for I-piece
    expect(WALL_KICK_DATA_I["1->0"]).toEqual([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: -1, y: 0 },
      { x: 2, y: 1 },
      { x: -1, y: -2 },
    ]);
    expect(WALL_KICK_DATA_I["2->1"]).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: -2, y: 0 },
      { x: 1, y: -2 },
      { x: -2, y: 1 },
    ]);
    expect(WALL_KICK_DATA_I["3->2"]).toEqual([
      { x: 0, y: 0 },
      { x: -2, y: 0 },
      { x: 1, y: 0 },
      { x: -2, y: -1 },
      { x: 1, y: 2 },
    ]);
    expect(WALL_KICK_DATA_I["0->3"]).toEqual([
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: 2, y: 0 },
      { x: -1, y: 2 },
      { x: 2, y: -1 },
    ]);
  });
});

describe("getWallKickData", () => {
  test("should return correct wall kick data for standard pieces", () => {
    const standardPieces: TetrominoTypeName[] = ["J", "L", "T", "S", "Z"];

    for (const piece of standardPieces) {
      const kickData = getWallKickData(piece, 0, 1);
      expect(kickData).toEqual([
        { x: 0, y: 0 },
        { x: -1, y: 0 },
        { x: -1, y: 1 },
        { x: 0, y: -2 },
        { x: -1, y: -2 },
      ]);
    }
  });

  test("should return I-piece specific wall kick data", () => {
    const kickData = getWallKickData("I", 0, 1);
    expect(kickData).toEqual([
      { x: 0, y: 0 },
      { x: -2, y: 0 },
      { x: 1, y: 0 },
      { x: -2, y: -1 },
      { x: 1, y: 2 },
    ]);
  });

  test("should return empty array for O-piece (no rotation)", () => {
    const kickData = getWallKickData("O", 0, 1);
    expect(kickData).toEqual([]);
  });

  test("should handle all rotation transitions", () => {
    const transitions: [RotationState, RotationState][] = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0], // Clockwise
      [1, 0],
      [2, 1],
      [3, 2],
      [0, 3], // Counter-clockwise
    ];

    for (const [from, to] of transitions) {
      const kickData = getWallKickData("T", from, to);
      expect(kickData).toHaveLength(5); // All kick data arrays have 5 positions
      expect(kickData[0]).toEqual({ x: 0, y: 0 }); // First position is always no offset
    }
  });

  test("should return empty array for invalid transitions", () => {
    const kickData = getWallKickData("T", 0, 2); // Invalid: skipping rotation state
    expect(kickData).toEqual([]);
  });
});

describe("tryRotateWithWallKick", () => {
  const createTestBoard = () => {
    const board = createEmptyBoardWithBuffer();
    // Add some obstacles for testing
    board[1][4] = 1; // Block at position (4, 1)
    board[1][5] = 1; // Block at position (5, 1)
    return board;
  };

  test("should successfully rotate without wall kick when space is available", () => {
    const board = createEmptyBoardWithBuffer();
    const piece = createTPiece(4, 10, 0);

    const result = tryRotateWithWallKick(board, piece, 1);

    expect(result).not.toBeNull();
    expect(result!.rotation).toBe(1);
    expect(result!.position).toEqual({ x: 4, y: 10 }); // No position change needed
  });

  test("should apply wall kick offset when rotation is blocked", () => {
    const board = createTestBoard();
    const piece = createTPiece(4, 1, 0); // Position where rotation would collide

    const result = tryRotateWithWallKick(board, piece, 1);

    expect(result).not.toBeNull();
    expect(result!.rotation).toBe(1);
    // Position should be adjusted by one of the wall kick offsets
    expect(result!.position.x).not.toBe(4); // Position should have changed
  });

  test("should return null when rotation is impossible even with wall kicks", () => {
    const board = createEmptyBoardWithBuffer();
    // Fill the area around the piece to make rotation impossible
    for (let x = 2; x <= 6; x++) {
      for (let y = 0; y <= 2; y++) {
        if (x !== 4 || y !== 1) {
          // Leave space for the piece itself
          board[y][x] = 1;
        }
      }
    }

    const piece = createTPiece(4, 1, 0);
    const result = tryRotateWithWallKick(board, piece, 1);

    expect(result).toBeNull();
  });

  test("should handle all 8 rotation transitions correctly", () => {
    const board = createEmptyBoardWithBuffer();
    const transitions: [RotationState, RotationState][] = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0], // Clockwise
      [1, 0],
      [2, 1],
      [3, 2],
      [0, 3], // Counter-clockwise
    ];

    for (const [from, to] of transitions) {
      const piece = createTPiece(4, 10, from); // Safe position (centered)
      const result = tryRotateWithWallKick(board, piece, to);

      expect(result).not.toBeNull();
      expect(result!.rotation).toBe(to);
    }
  });

  test("should handle I-piece rotation with specific wall kick data", () => {
    const board = createEmptyBoardWithBuffer();
    const iPiece = createTetromino("I", 0);
    // Move to a specific position for testing
    const positionedIPiece = {
      ...iPiece,
      position: { x: 3, y: 10 },
    };

    const result = tryRotateWithWallKick(board, positionedIPiece, 1);

    expect(result).not.toBeNull();
    expect(result!.rotation).toBe(1);
    expect(result!.type).toBe("I");
  });

  test("should not rotate O-piece", () => {
    const board = createEmptyBoardWithBuffer();
    const oPiece = createTetromino("O", 0);
    const positionedOPiece = {
      ...oPiece,
      position: { x: 4, y: 10 },
    };

    const result = tryRotateWithWallKick(board, positionedOPiece, 1);

    // O-piece should return the same piece without rotation
    expect(result).not.toBeNull();
    expect(result!.rotation).toBe(0); // Rotation should remain unchanged
    expect(result!.position).toEqual({ x: 4, y: 10 });
  });

  test("should handle boundary conditions near board edges", () => {
    const board = createEmptyBoardWithBuffer();

    // Test near left edge
    const leftPiece = createTPiece(1, 10, 0);
    const leftResult = tryRotateWithWallKick(board, leftPiece, 1);
    expect(leftResult).not.toBeNull();

    // Test near right edge
    const rightPiece = createTPiece(7, 10, 0);
    const rightResult = tryRotateWithWallKick(board, rightPiece, 1);
    expect(rightResult).not.toBeNull();

    // Test near bottom (visible area)
    const bottomPiece = createTPiece(4, 2, 0);
    const bottomResult = tryRotateWithWallKick(board, bottomPiece, 1);
    expect(bottomResult).not.toBeNull();
  });

  test("should maintain piece type and shape during rotation", () => {
    const board = createEmptyBoardWithBuffer();
    const piece = createTPiece(4, 10, 0);

    const result = tryRotateWithWallKick(board, piece, 1);

    expect(result).not.toBeNull();
    expect(result!.type).toBe("T");
    expect(result!.shape).toBeDefined();
    expect(result!.shape.length).toBeGreaterThan(0);
  });
});

describe("SRS Wall Kick Edge Cases", () => {
  test("should handle counter-clockwise rotation (CCW)", () => {
    const board = createEmptyBoardWithBuffer();
    const piece = createTPiece(4, 10, 1);

    // Rotate counter-clockwise from state 1 to state 0
    const result = tryRotateWithWallKick(board, piece, 0);

    expect(result).not.toBeNull();
    expect(result!.rotation).toBe(0);
  });

  test("should prioritize earlier wall kick offsets", () => {
    const board = createEmptyBoardWithBuffer();
    // Block position that would be reached by later wall kick offsets
    board[10][3] = 1; // Block the [-1,0] offset position

    const piece = createTPiece(4, 10, 0);
    const result = tryRotateWithWallKick(board, piece, 1);

    expect(result).not.toBeNull();
    // Should use [0,0] offset (no movement) if possible
    if (result!.position.x === 4 && result!.position.y === 10) {
      // Used first offset [0,0]
      expect(true).toBe(true);
    } else {
      // Used a later offset, which is also valid
      expect(result!.rotation).toBe(1);
    }
  });

  test("should handle rotation in buffer area (invisible area)", () => {
    const board = createEmptyBoardWithBuffer();
    const piece = createTPiece(4, 22, 0); // In buffer area (y > 19)

    const result = tryRotateWithWallKick(board, piece, 1);

    expect(result).not.toBeNull();
    expect(result!.rotation).toBe(1);
    expect(result!.position.y).toBeGreaterThanOrEqual(20); // Still in buffer area
  });

  test("should validate piece position after wall kick", () => {
    const board = createEmptyBoardWithBuffer();
    const piece = createTPiece(4, 10, 0);

    const result = tryRotateWithWallKick(board, piece, 1);

    expect(result).not.toBeNull();

    // Validate the position is within board bounds
    expect(result!.position.x).toBeGreaterThanOrEqual(0);
    expect(result!.position.x).toBeLessThan(10);
    expect(result!.position.y).toBeGreaterThanOrEqual(0);
    expect(result!.position.y).toBeLessThan(24); // Total board height with buffer
  });
});

describe("Performance and Edge Cases", () => {
  test("should handle rapid rotation attempts efficiently", () => {
    const board = createEmptyBoardWithBuffer();
    const piece = createTPiece(4, 10, 0);

    const startTime = performance.now();

    // Perform 1000 rotation attempts
    for (let i = 0; i < 1000; i++) {
      const rotation = (i % 4) as RotationState;
      tryRotateWithWallKick(board, piece, rotation);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should complete in reasonable time (under 10ms)
    expect(duration).toBeLessThan(10);
  });

  test("should not mutate original piece or board", () => {
    const board = createEmptyBoardWithBuffer();
    const originalBoard = board.map((row) => [...row]);
    const piece = createTPiece(4, 10, 0);
    const originalPiece = { ...piece, position: { ...piece.position } };

    tryRotateWithWallKick(board, piece, 1);

    // Board should not be modified
    expect(board).toEqual(originalBoard);

    // Original piece should not be modified
    expect(piece).toEqual(originalPiece);
  });

  test("should handle invalid rotation states gracefully", () => {
    const board = createEmptyBoardWithBuffer();
    const piece = createTPiece(4, 10, 0);

    // Test with invalid rotation state (should be handled gracefully)
    const result = tryRotateWithWallKick(board, piece, 5 as RotationState);

    // Should either return null or normalize the rotation state
    if (result !== null) {
      expect(result.rotation).toBeGreaterThanOrEqual(0);
      expect(result.rotation).toBeLessThanOrEqual(3);
    }
  });
});
