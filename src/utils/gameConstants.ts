/**
 * Game constants for Tetris game
 * All game configuration values in one centralized location
 */

// Board dimensions and layout
export const BOARD_CONSTANTS = {
  WIDTH: 10,
  HEIGHT: 20, // Visible playing field
  BUFFER_HEIGHT: 4, // Invisible area above visible board
  TOTAL_HEIGHT: 24, // HEIGHT + BUFFER_HEIGHT
  CELL_SIZE: 30, // Base cell size in pixels
  BORDER_WIDTH: 1, // Border width in pixels
} as const;

// Timing constants
export const TIMING_CONSTANTS = {
  // Drop speeds
  INITIAL_DROP_SPEED: 1000, // Initial drop speed in milliseconds
  MIN_DROP_SPEED: 100, // Minimum drop speed (level 10+)
  SPEED_DECREASE_PER_LEVEL: 100, // Speed increase per level

  // Game loop
  FRAME_RATE: 60, // Target frame rate
  FRAME_INTERVAL: 16.67, // 1000/60 ms per frame

  // Animation durations
  LINE_CLEAR_DURATION: 200, // Line clear animation duration
  PIECE_LOCK_DELAY: 100, // Visual delay before piece locks
  SCORE_ANIMATION_DURATION: 500, // Score change animation
  LEVEL_UP_ANIMATION_DURATION: 800, // Level up animation
} as const;

// DAS (Delayed Auto Shift) constants
export const DAS_CONSTANTS = {
  INITIAL_DELAY: 170, // Time before auto-repeat starts (ms)
  REPEAT_RATE: 50, // Time between auto-repeats (ms)
  SOFT_DROP_RATE: 50, // Soft drop repeat rate (ms)
} as const;

// Lock delay constants
export const LOCK_DELAY_CONSTANTS = {
  DELAY_MS: 500, // Time before piece locks after landing
  MAX_RESET_COUNT: 15, // Maximum number of moves/rotations allowed during lock delay
} as const;

// Tetromino constants
export const TETROMINO_CONSTANTS = {
  GRID_SIZE: 4, // Maximum tetromino grid size (4x4)
  MIN_GRID_SIZE: 2, // Minimum tetromino grid size (for O piece)
  TOTAL_PIECES: 7, // Number of different tetromino types
  ROTATION_STATES: 4, // Number of rotation states (0-3)
  SPAWN_Y: 1, // Spawn Y position (in buffer area, near top)
} as const;

// Touch control constants
export const TOUCH_CONSTANTS = {
  MIN_SWIPE_DISTANCE: 30, // Minimum pixels to register as swipe
  MAX_SWIPE_TIME: 500, // Maximum time for swipe gesture (ms)
  TAP_MAX_TIME: 200, // Maximum duration for tap (ms)
  TAP_MAX_DISTANCE: 10, // Maximum movement for tap (pixels)
  DOUBLE_TAP_MAX_INTERVAL: 300, // Maximum time between taps for double tap (ms)
  LONG_SWIPE_THRESHOLD: 80, // Minimum distance for hard drop swipe (pixels)
  SWIPE_VELOCITY_THRESHOLD: 0.5, // Minimum pixels/ms for swipe recognition
} as const;

// UI constants
export const UI_CONSTANTS = {
  // Button sizes
  BUTTON_HEIGHT: 44, // Standard button height
  SMALL_BUTTON_HEIGHT: 32, // Small button height
  ICON_SIZE: 24, // Standard icon size

  // Spacing
  PADDING_SMALL: 8, // Small padding
  PADDING_MEDIUM: 16, // Medium padding
  PADDING_LARGE: 24, // Large padding

  // Breakpoints (matches Tailwind CSS)
  MOBILE_BREAKPOINT: 768, // md breakpoint in pixels

  // Z-index values
  Z_INDEX_OVERLAY: 1000, // Game overlays
  Z_INDEX_MODAL: 2000, // Modals and settings
  Z_INDEX_TOOLTIP: 3000, // Tooltips
} as const;

// Scoring constants
export const SCORING_CONSTANTS = {
  BASE_SCORES: [0, 100, 300, 500, 800], // Base scores for 0-4 lines cleared
  LINES_PER_LEVEL: 10, // Lines needed to advance one level
  STARTING_LEVEL: 1, // Initial game level
  MAX_LEVEL: 99, // Maximum level (for display purposes)
} as const;

// Gameplay constants
export const GAMEPLAY_CONSTANTS = {
  PIECE_BAG_SIZE: 7, // Number of pieces in 7-bag randomization
  SPAWN_DELAY: 50, // Delay before spawning next piece (ms)
  INITIAL_SCORE: 0, // Starting score
  INITIAL_LINES: 0, // Starting lines cleared
  GAME_OVER_DELAY: 1000, // Delay before showing game over screen
} as const;

// Color constants for tetromino pieces
export const COLOR_CONSTANTS = {
  EMPTY: 0, // Empty cell
  I_PIECE: 1, // Cyan/Light Blue
  O_PIECE: 2, // Yellow
  T_PIECE: 3, // Purple
  S_PIECE: 4, // Green
  Z_PIECE: 5, // Red
  J_PIECE: 6, // Blue
  L_PIECE: 7, // Orange
} as const;

// CSS color values for pieces
export const PIECE_COLORS = {
  [COLOR_CONSTANTS.EMPTY]: "transparent",
  [COLOR_CONSTANTS.I_PIECE]: "#00f5ff", // Cyan
  [COLOR_CONSTANTS.O_PIECE]: "#ffff00", // Yellow
  [COLOR_CONSTANTS.T_PIECE]: "#a000f0", // Purple
  [COLOR_CONSTANTS.S_PIECE]: "#00ff00", // Green
  [COLOR_CONSTANTS.Z_PIECE]: "#ff0000", // Red
  [COLOR_CONSTANTS.J_PIECE]: "#0000ff", // Blue
  [COLOR_CONSTANTS.L_PIECE]: "#ff8000", // Orange
} as const;

// Ghost piece styling
export const GHOST_PIECE_CONSTANTS = {
  OPACITY: 0.3, // Ghost piece opacity
  BORDER_STYLE: "dashed", // Ghost piece border style
  BORDER_WIDTH: 2, // Ghost piece border width
} as const;

// Animation easing constants
export const ANIMATION_CONSTANTS = {
  EASE_OUT_CUBIC: "cubic-bezier(0.215, 0.61, 0.355, 1)",
  EASE_IN_OUT_QUAD: "cubic-bezier(0.455, 0.03, 0.515, 0.955)",
  EASE_OUT_BACK: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  SPRING_CONFIG: { tension: 300, friction: 30 }, // For Framer Motion spring
} as const;

// Combine all constants for easier importing
export const GAME_CONSTANTS = {
  BOARD: BOARD_CONSTANTS,
  TIMING: TIMING_CONSTANTS,
  DAS: DAS_CONSTANTS,
  LOCK_DELAY: LOCK_DELAY_CONSTANTS,
  TETROMINO: TETROMINO_CONSTANTS,
  TOUCH: TOUCH_CONSTANTS,
  UI: UI_CONSTANTS,
  SCORING: SCORING_CONSTANTS,
  GAMEPLAY: GAMEPLAY_CONSTANTS,
  COLORS: COLOR_CONSTANTS,
  PIECE_COLORS,
  GHOST_PIECE: GHOST_PIECE_CONSTANTS,
  ANIMATIONS: ANIMATION_CONSTANTS,
} as const;

// Utility functions for constants
export const getDropSpeed = (level: number): number => {
  return Math.max(
    TIMING_CONSTANTS.MIN_DROP_SPEED,
    TIMING_CONSTANTS.INITIAL_DROP_SPEED - (level - 1) * TIMING_CONSTANTS.SPEED_DECREASE_PER_LEVEL
  );
};

export const calculateLevel = (totalLines: number): number => {
  return (
    Math.floor(totalLines / SCORING_CONSTANTS.LINES_PER_LEVEL) + SCORING_CONSTANTS.STARTING_LEVEL
  );
};

export const calculateScore = (linesCleared: number, level: number): number => {
  if (linesCleared < 0 || linesCleared >= SCORING_CONSTANTS.BASE_SCORES.length) {
    return 0;
  }
  return SCORING_CONSTANTS.BASE_SCORES[linesCleared] * level;
};
