/**
 * Tests for board operations and game logic
 * Following TDD approach - tests written before implementation
 */

import { describe, expect, test } from "bun:test";
import type { Position, Tetromino } from "../types/game";
import { GAME_CONSTANTS } from "../utils/gameConstants";
import {
  clearLines,
  createEmptyBoard,
  createEmptyBoardWithBuffer,
  forEachPieceCell,
  getSpawnPosition,
  isValidPosition,
  placeTetromino,
} from "./board";

describe("createEmptyBoard", () => {
  test("should create 20x10 visible grid of zeros", () => {
    const board = createEmptyBoard();

    expect(board).toHaveLength(GAME_CONSTANTS.BOARD.HEIGHT); // 20 rows
    expect(board[0]).toHaveLength(GAME_CONSTANTS.BOARD.WIDTH); // 10 columns

    // Check all cells are zero
    for (let y = 0; y < GAME_CONSTANTS.BOARD.HEIGHT; y++) {
      for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH; x++) {
        expect(board[y][x]).toBe(0);
      }
    }
  });

  test("should create new instance each time (no shared references)", () => {
    const board1 = createEmptyBoard();
    const board2 = createEmptyBoard();

    // Modify one board
    board1[0][0] = 1;

    // Other board should remain unchanged
    expect(board2[0][0]).toBe(0);
    expect(board1 !== board2).toBe(true);
  });

  test("should handle dimensions correctly", () => {
    const board = createEmptyBoard();

    // Verify exact dimensions
    expect(board.length).toBe(20);
    expect(board[0].length).toBe(10);
    expect(board[19].length).toBe(10); // Last row
  });
});

describe("createEmptyBoardWithBuffer", () => {
  test("should create 24x10 total grid of zeros", () => {
    const board = createEmptyBoardWithBuffer();

    expect(board).toHaveLength(GAME_CONSTANTS.BOARD.TOTAL_HEIGHT); // 24 rows
    expect(board[0]).toHaveLength(GAME_CONSTANTS.BOARD.WIDTH); // 10 columns

    // Check all cells are zero
    for (let y = 0; y < GAME_CONSTANTS.BOARD.TOTAL_HEIGHT; y++) {
      for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH; x++) {
        expect(board[y][x]).toBe(0);
      }
    }
  });

  test("should create new instance each time (no shared references)", () => {
    const board1 = createEmptyBoardWithBuffer();
    const board2 = createEmptyBoardWithBuffer();

    // Modify one board
    board1[0][0] = 1;

    // Other board should remain unchanged
    expect(board2[0][0]).toBe(0);
    expect(board1 !== board2).toBe(true);
  });

  test("should include buffer area above visible board", () => {
    const board = createEmptyBoardWithBuffer();

    // Total height should be visible + buffer
    expect(board.length).toBe(24);

    // Buffer area (rows 20-23) should exist and be empty
    for (let y = 20; y < 24; y++) {
      for (let x = 0; x < 10; x++) {
        expect(board[y][x]).toBe(0);
      }
    }
  });
});

describe("isValidPosition", () => {
  const mockTetromino: Tetromino = {
    type: "T",
    position: { x: 0, y: 0 },
    rotation: 0,
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
  };

  test("should return true for valid position within bounds", () => {
    const board = createEmptyBoardWithBuffer();
    const position: Position = { x: 3, y: 21 }; // Valid spawn position

    expect(isValidPosition(board, mockTetromino.shape, position)).toBe(true);
  });

  test("should return false for position outside left boundary", () => {
    const board = createEmptyBoardWithBuffer();
    const position: Position = { x: -1, y: 21 }; // Outside left boundary

    expect(isValidPosition(board, mockTetromino.shape, position)).toBe(false);
  });

  test("should return false for position outside right boundary", () => {
    const board = createEmptyBoardWithBuffer();
    const position: Position = { x: 8, y: 21 }; // Too far right for 3-wide piece

    expect(isValidPosition(board, mockTetromino.shape, position)).toBe(false);
  });

  test("should return false for position outside bottom boundary", () => {
    const board = createEmptyBoardWithBuffer();
    const position: Position = { x: 3, y: -1 }; // Below bottom of board

    expect(isValidPosition(board, mockTetromino.shape, position)).toBe(false);
  });

  test("should return false for position outside top boundary", () => {
    const board = createEmptyBoardWithBuffer();
    const position: Position = { x: 3, y: 23 }; // Above buffer area

    expect(isValidPosition(board, mockTetromino.shape, position)).toBe(false);
  });

  test("should return false when colliding with existing blocks", () => {
    const board = createEmptyBoardWithBuffer();

    // Place a block where the piece would go
    board[21][4] = 1; // Block in middle of T piece

    const position: Position = { x: 3, y: 21 };

    expect(isValidPosition(board, mockTetromino.shape, position)).toBe(false);
  });

  test("should handle different piece shapes correctly", () => {
    const board = createEmptyBoardWithBuffer();

    // I-piece (4-wide)
    const iPieceShape = [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    // Should fit at x=0
    expect(isValidPosition(board, iPieceShape, { x: 0, y: 21 })).toBe(true);

    // Should not fit at x=7 (would go outside right boundary)
    expect(isValidPosition(board, iPieceShape, { x: 7, y: 21 })).toBe(false);
  });

  test("should validate position in buffer area correctly", () => {
    const board = createEmptyBoardWithBuffer();

    // Position in buffer area (above visible board)
    const position: Position = { x: 3, y: 22 };

    expect(isValidPosition(board, mockTetromino.shape, position)).toBe(true);
  });

  test("should handle empty shape arrays", () => {
    const board = createEmptyBoardWithBuffer();
    const emptyShape: number[][] = [];
    const position: Position = { x: 0, y: 0 };

    expect(isValidPosition(board, emptyShape, position)).toBe(true);
  });
});

describe("getSpawnPosition", () => {
  test("should return correct spawn position for 3-wide pieces", () => {
    const position = getSpawnPosition("T");

    expect(position.x).toBe(3); // Centered for 3-wide piece
    expect(position.y).toBe(21); // In buffer area
  });

  test("should return correct spawn position for I-piece", () => {
    const position = getSpawnPosition("I");

    expect(position.x).toBe(3); // Centered for 4-wide piece
    expect(position.y).toBe(21); // In buffer area
  });

  test("should return correct spawn position for O-piece", () => {
    const position = getSpawnPosition("O");

    expect(position.x).toBe(4); // Centered for 2-wide piece
    expect(position.y).toBe(21); // In buffer area
  });

  test("should return spawn position in buffer area for all pieces", () => {
    const pieces = ["I", "O", "T", "S", "Z", "J", "L"] as const;

    for (const piece of pieces) {
      const position = getSpawnPosition(piece);
      expect(position.y).toBe(21); // All pieces spawn in buffer area
    }
  });
});

describe("placeTetromino", () => {
  test("should place tetromino on empty board correctly", () => {
    const board = createEmptyBoardWithBuffer();
    const tetromino: Tetromino = {
      type: "T",
      position: { x: 3, y: 21 },
      rotation: 0,
      shape: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
    };

    const newBoard = placeTetromino(board, tetromino);

    // Check that piece is placed correctly
    expect(newBoard[21][4]).toBe(3); // T-piece color
    expect(newBoard[22][3]).toBe(3);
    expect(newBoard[22][4]).toBe(3);
    expect(newBoard[22][5]).toBe(3);

    // Original board should be unchanged
    expect(board[21][4]).toBe(0);
  });

  test("should not modify original board", () => {
    const board = createEmptyBoardWithBuffer();
    const tetromino: Tetromino = {
      type: "I",
      position: { x: 0, y: 21 },
      rotation: 0,
      shape: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    };

    const newBoard = placeTetromino(board, tetromino);

    // Original board should remain empty
    expect(board[22][0]).toBe(0);
    expect(board[22][1]).toBe(0);
    expect(board[22][2]).toBe(0);
    expect(board[22][3]).toBe(0);

    // New board should have the piece
    expect(newBoard[22][0]).toBe(1); // I-piece color
    expect(newBoard[22][1]).toBe(1);
    expect(newBoard[22][2]).toBe(1);
    expect(newBoard[22][3]).toBe(1);
  });
});

describe("clearLines", () => {
  test("should detect and clear single completed line", () => {
    const board = createEmptyBoard();

    // Fill bottom row completely
    for (let x = 0; x < 10; x++) {
      board[19][x] = 1;
    }

    const [clearedBoard, clearedLines] = clearLines(board);

    expect(clearedLines).toEqual([19]);
    expect(clearedBoard[19].every((cell) => cell === 0)).toBe(true);
  });

  test("should clear multiple completed lines", () => {
    const board = createEmptyBoard();

    // Fill multiple rows
    for (let x = 0; x < 10; x++) {
      board[18][x] = 1; // Fill row 18
      board[19][x] = 2; // Fill row 19
    }

    const [clearedBoard, clearedLines] = clearLines(board);

    expect(clearedLines).toEqual([18, 19]);
    expect(clearedBoard[18].every((cell) => cell === 0)).toBe(true);
    expect(clearedBoard[19].every((cell) => cell === 0)).toBe(true);
  });

  test("should shift remaining blocks down after line clear", () => {
    const board = createEmptyBoard();

    // Place some blocks above a completed line
    board[17][0] = 3;
    board[17][1] = 4;

    // Fill bottom row
    for (let x = 0; x < 10; x++) {
      board[19][x] = 1;
    }

    const [clearedBoard, clearedLines] = clearLines(board);

    expect(clearedLines).toEqual([19]);

    // Blocks should have moved down
    expect(clearedBoard[18][0]).toBe(3);
    expect(clearedBoard[18][1]).toBe(4);
    expect(clearedBoard[17][0]).toBe(0);
    expect(clearedBoard[17][1]).toBe(0);
  });

  test("should handle no completed lines", () => {
    const board = createEmptyBoard();

    // Partially fill some rows
    board[19][0] = 1;
    board[19][1] = 1;
    board[18][5] = 2;

    const [clearedBoard, clearedLines] = clearLines(board);

    expect(clearedLines).toEqual([]);
    expect(clearedBoard).toEqual(board);
  });
});

describe("forEachPieceCell", () => {
  test("should iterate over non-zero cells correctly", () => {
    const shape = [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ];
    const position: Position = { x: 3, y: 21 };

    const cells: Array<{ x: number; y: number; value: number }> = [];

    forEachPieceCell(shape, position, (x, y, value) => {
      cells.push({ x, y, value });
    });

    expect(cells).toHaveLength(4); // 4 non-zero cells in T-piece
    expect(cells).toContainEqual({ x: 4, y: 21, value: 1 });
    expect(cells).toContainEqual({ x: 3, y: 22, value: 1 });
    expect(cells).toContainEqual({ x: 4, y: 22, value: 1 });
    expect(cells).toContainEqual({ x: 5, y: 22, value: 1 });
  });

  test("should handle empty shape", () => {
    const shape: number[][] = [];
    const position: Position = { x: 0, y: 0 };

    let callCount = 0;
    forEachPieceCell(shape, position, () => {
      callCount++;
    });

    expect(callCount).toBe(0);
  });

  test("should handle shape with all zeros", () => {
    const shape = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    const position: Position = { x: 0, y: 0 };

    let callCount = 0;
    forEachPieceCell(shape, position, () => {
      callCount++;
    });

    expect(callCount).toBe(0);
  });
});
