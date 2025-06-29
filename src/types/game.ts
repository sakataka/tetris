/**
 * Core game type definitions for Tetris game
 * All types are strictly typed with no any usage
 */

// Tetromino piece type names (7 standard pieces)
export type TetrominoTypeName = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

// Rotation states (0=spawn, 1=right, 2=180, 3=left)
export type RotationState = 0 | 1 | 2 | 3;

// Cell values (0=empty, 1-7=colored pieces)
export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

// Position coordinates for pieces and board
export interface Position {
  x: number;
  y: number;
}

// Tetromino piece definition
export interface Tetromino {
  type: TetrominoTypeName;
  position: Position;
  rotation: RotationState;
  shape: number[][]; // 2D array representing piece shape
}

// Game board types
export type GameBoard = CellValue[][]; // Visible board only (20x10)
export type GameBoardWithBuffer = CellValue[][]; // Full board with buffer (24x10)

// Lock delay state for piece placement timing
export interface LockDelayState {
  isActive: boolean;
  startTime: number;
  resetCount: number; // Track number of moves/rotations during delay
  lastLowestY: number; // Track the lowest Y position reached during lock delay
}

// Delayed Auto Shift (DAS) state for smooth controls
export interface DASState {
  leftPressed: boolean;
  rightPressed: boolean;
  downPressed: boolean;
  lastLeftTime: number;
  lastRightTime: number;
  lastDownTime: number;
  leftRepeatStarted: boolean;
  rightRepeatStarted: boolean;
  downRepeatStarted: boolean;
}

// Complete game state interface
export interface GameState {
  // Board and pieces
  board: GameBoard; // Visible board only for display
  boardWithBuffer: GameBoardWithBuffer; // Full board with buffer for game logic
  currentPiece: Tetromino | null;
  nextPiece: TetrominoTypeName;
  heldPiece: TetrominoTypeName | null;
  canHold: boolean;

  // Scoring and progression
  score: number;
  lines: number;
  level: number;

  // Game state flags
  isGameOver: boolean;
  isPaused: boolean;
  isPlaying: boolean;

  // Game mechanics
  ghostPosition: Position | null;
  pieceBag: TetrominoTypeName[];
  lockDelay: LockDelayState | null;

  // Timing
  lastDropTime: number; // For natural fall timing
  dropInterval: number; // Current drop speed in milliseconds
  gameStartTime: number;
  totalGameTime: number;

  // Animation states
  linesClearing: number[]; // Array of line indices being cleared
  animationInProgress: boolean;
  lineClearAnimation: LineClearAnimationState | null; // Line clear animation state
}

// Touch gesture types for mobile controls
export type TouchGesture =
  | "tap"
  | "double-tap"
  | "swipe-left"
  | "swipe-right"
  | "soft-drop"
  | "hard-drop"
  | "none";

// Game action types for input processing
export type GameAction =
  | "move-left"
  | "move-right"
  | "move-down"
  | "rotate-cw"
  | "rotate-ccw"
  | "hard-drop"
  | "hold"
  | "pause"
  | "resume"
  | "reset";

// Line clear types for scoring
export type LineClearType = "single" | "double" | "triple" | "tetris";

// Line clear animation states
export interface LineClearAnimationState {
  clearingLines: number[];
  animationPhase: "flash" | "collapse" | "complete" | "idle";
  startTime: number;
  duration: number;
  lineClearCount: number;
  feedbackMessage?: string;
}

// Game difficulty settings
export interface GameDifficulty {
  name: string;
  initialDropSpeed: number;
  speedIncrease: number;
  maxSpeed: number;
}
