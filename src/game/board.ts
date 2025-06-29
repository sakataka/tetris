/**
 * Board operations and game logic for Tetris
 * All functions are pure - they don't modify input parameters
 */

import type {
  CellValue,
  GameBoard,
  GameBoardWithBuffer,
  Position,
  Tetromino,
  TetrominoTypeName,
} from "../types/game";
import { COLOR_CONSTANTS, GAME_CONSTANTS } from "../utils/gameConstants";

/**
 * Creates an empty visible game board (20x10)
 * @returns New empty board for display purposes
 */
export function createEmptyBoard(): GameBoard {
  return Array(GAME_CONSTANTS.BOARD.HEIGHT)
    .fill(null)
    .map(() => Array(GAME_CONSTANTS.BOARD.WIDTH).fill(0));
}

/**
 * Creates an empty game board with buffer area (24x10)
 * @returns New empty board with buffer area for game logic
 */
export function createEmptyBoardWithBuffer(): GameBoardWithBuffer {
  return Array(GAME_CONSTANTS.BOARD.TOTAL_HEIGHT)
    .fill(null)
    .map(() => Array(GAME_CONSTANTS.BOARD.WIDTH).fill(0));
}

/**
 * Checks if a tetromino can be placed at the given position
 * @param board - Game board with buffer area
 * @param shape - Tetromino shape matrix
 * @param position - Position to check
 * @returns True if position is valid
 */
export function isValidPosition(
  board: GameBoardWithBuffer,
  shape: number[][],
  position: Position
): boolean {
  // Handle empty shape
  if (!shape || shape.length === 0) {
    return true;
  }

  // Check each cell of the piece
  for (let py = 0; py < shape.length; py++) {
    for (let px = 0; px < shape[py].length; px++) {
      // Skip empty cells in the piece
      if (shape[py][px] === 0) {
        continue;
      }

      // Calculate absolute position
      const x = position.x + px;
      const y = position.y + py;

      // Check bounds
      if (x < 0 || x >= GAME_CONSTANTS.BOARD.WIDTH) {
        return false; // Outside horizontal bounds
      }

      if (y < 0 || y >= GAME_CONSTANTS.BOARD.TOTAL_HEIGHT) {
        return false; // Outside vertical bounds (including buffer)
      }

      // Check collision with existing blocks
      if (board[y] && board[y][x] !== 0) {
        return false; // Collision with existing piece
      }
    }
  }

  return true;
}

/**
 * Iterates over each non-zero cell in a tetromino shape
 * @param shape - Tetromino shape matrix
 * @param position - Position of the piece
 * @param callback - Function to call for each non-zero cell
 */
export function forEachPieceCell(
  shape: number[][],
  position: Position,
  callback: (x: number, y: number, value: number) => void
): void {
  if (!shape || shape.length === 0) {
    return;
  }

  for (let py = 0; py < shape.length; py++) {
    for (let px = 0; px < shape[py].length; px++) {
      const cellValue = shape[py][px];

      // Only process non-zero cells
      if (cellValue !== 0) {
        const x = position.x + px;
        const y = position.y + py;
        callback(x, y, cellValue);
      }
    }
  }
}

/**
 * Places a tetromino on the board and returns a new board
 * @param board - Original board
 * @param tetromino - Tetromino to place
 * @returns New board with tetromino placed
 */
export function placeTetromino(
  board: GameBoardWithBuffer,
  tetromino: Tetromino
): GameBoardWithBuffer {
  // Create a deep copy of the board
  const newBoard = board.map((row) => [...row]);

  // Get the color index for this piece type
  const colorIndex = getTetrominoColorIndex(tetromino.type);

  // Place the piece on the new board
  forEachPieceCell(tetromino.shape, tetromino.position, (x, y) => {
    if (
      y >= 0 &&
      y < GAME_CONSTANTS.BOARD.TOTAL_HEIGHT &&
      x >= 0 &&
      x < GAME_CONSTANTS.BOARD.WIDTH
    ) {
      newBoard[y][x] = colorIndex;
    }
  });

  return newBoard;
}

/**
 * Clears completed lines from the board
 * @param board - Game board to check
 * @returns Tuple of [new board, cleared line indices]
 */
export function clearLines(board: GameBoard): [GameBoard, number[]] {
  const clearedLines: number[] = [];
  const newBoard: GameBoard = [];

  // Check each row from bottom to top
  for (let y = board.length - 1; y >= 0; y--) {
    const row = board[y];

    // Check if row is completely filled
    const isComplete = row.every((cell) => cell !== 0);

    if (isComplete) {
      clearedLines.push(y);
    } else {
      // Keep the row (it will be shifted down by cleared lines)
      newBoard.unshift([...row]);
    }
  }

  // Add empty rows at the top for each cleared line
  while (newBoard.length < GAME_CONSTANTS.BOARD.HEIGHT) {
    newBoard.unshift(Array(GAME_CONSTANTS.BOARD.WIDTH).fill(0));
  }

  // Sort cleared lines in ascending order for consistency
  clearedLines.sort((a, b) => a - b);

  return [newBoard, clearedLines];
}

/**
 * Gets the spawn position for a tetromino type
 * @param pieceType - Type of tetromino
 * @returns Spawn position in buffer area
 */
export function getSpawnPosition(pieceType: TetrominoTypeName): Position {
  // Get piece width for centering
  const pieceWidths = {
    I: 4,
    O: 2,
    T: 3,
    S: 3,
    Z: 3,
    J: 3,
    L: 3,
  } as const;

  const pieceWidth = pieceWidths[pieceType];
  const centerX = Math.floor((GAME_CONSTANTS.BOARD.WIDTH - pieceWidth) / 2);

  return {
    x: centerX,
    y: GAME_CONSTANTS.TETROMINO.SPAWN_Y, // y = 21 (in buffer area)
  };
}

/**
 * Gets the color index for a tetromino type
 * @param pieceType - Type of tetromino
 * @returns Color index for the piece
 */
function getTetrominoColorIndex(pieceType: TetrominoTypeName): CellValue {
  const colorMap = {
    I: COLOR_CONSTANTS.I_PIECE,
    O: COLOR_CONSTANTS.O_PIECE,
    T: COLOR_CONSTANTS.T_PIECE,
    S: COLOR_CONSTANTS.S_PIECE,
    Z: COLOR_CONSTANTS.Z_PIECE,
    J: COLOR_CONSTANTS.J_PIECE,
    L: COLOR_CONSTANTS.L_PIECE,
  } as const;

  return colorMap[pieceType];
}

/**
 * Checks if the game is over (new piece cannot be placed at spawn)
 * @param board - Game board with buffer
 * @param newPiece - Piece to check
 * @returns True if game is over
 */
export function isGameOver(board: GameBoardWithBuffer, newPiece: Tetromino): boolean {
  return !isValidPosition(board, newPiece.shape, newPiece.position);
}

/**
 * Converts board with buffer to visible board for display
 * @param boardWithBuffer - Full board including buffer area
 * @returns Visible portion of the board (20x10)
 */
export function getVisibleBoard(boardWithBuffer: GameBoardWithBuffer): GameBoard {
  // Return only the visible portion (rows 0-19)
  return boardWithBuffer.slice(0, GAME_CONSTANTS.BOARD.HEIGHT).map((row) => [...row]);
}

/**
 * Checks if a line is completely filled
 * @param row - Board row to check
 * @returns True if row is completely filled
 */
export function isLineFull(row: CellValue[]): boolean {
  return row.every((cell) => cell !== 0);
}

/**
 * Counts the number of completed lines on the board
 * @param board - Game board to check
 * @returns Number of completed lines
 */
export function countCompletedLines(board: GameBoard): number {
  return board.filter(isLineFull).length;
}
