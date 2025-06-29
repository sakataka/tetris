// Debug script for lock delay test
import { createInitialGameState, moveTetrominoBy } from './src/game/game.js';
import { createEmptyBoardWithBuffer } from './src/game/board.js';
import { BOARD_CONSTANTS } from './src/utils/gameConstants.js';

const state = createInitialGameState();

if (\!state.currentPiece) {
  console.log("ERROR: No current piece");
  process.exit(1);
}

console.log("Current piece position:", state.currentPiece.position);
console.log("Current piece type:", state.currentPiece.type);

// Create blocked board to trigger lock delay
const blockedBoard = createEmptyBoardWithBuffer();
blockedBoard[0] = Array(BOARD_CONSTANTS.WIDTH).fill(1); // Fill bottom row

console.log("Bottom row filled:", blockedBoard[0]);

const pieceAtBottom = {
  ...state.currentPiece,
  position: { x: state.currentPiece.position.x, y: 1 },
};

console.log("Piece moved to:", pieceAtBottom.position);

const blockedState = {
  ...state,
  boardWithBuffer: blockedBoard,
  currentPiece: pieceAtBottom,
};

console.log("Attempting to move piece down by 1...");
const newState = moveTetrominoBy(blockedState, 0, -1);

console.log("Lock delay after move:", newState.lockDelay);
console.log("Piece position after move:", newState.currentPiece?.position);
EOF < /dev/null