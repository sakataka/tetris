import type { GameBoard } from "@/types/game";

/**
 * Line clear animation utilities
 * Provides functionality for line clearing visual effects
 */

export interface LineClearAnimationState {
  clearingLines: number[];
  animationPhase: "flash" | "collapse" | "complete" | "idle";
  startTime: number;
  duration: number;
  lineClearCount: number;
}

export interface LineClearAnimationConfig {
  flashDuration: number; // Flash animation duration in ms
  collapseDuration: number; // Collapse animation duration in ms
  totalDuration: number; // Total animation duration
  flashCount: number; // Number of flashes
  delayBetweenLines: number; // Delay between line animations
}

// Default animation configuration
export const DEFAULT_LINE_CLEAR_CONFIG: LineClearAnimationConfig = {
  flashDuration: 100, // Fast flash for each line
  collapseDuration: 300, // Smooth collapse animation
  totalDuration: 500, // Total duration including delays
  flashCount: 3, // Flash 3 times before collapse
  delayBetweenLines: 50, // 50ms delay between each line in multi-line clears
};

// Animation variants for different line clear counts
export const getLineClearVariants = (lineClearCount: number) => {
  const baseVariants = {
    idle: {
      opacity: 1,
      scale: 1,
      backgroundColor: "var(--cell-color)",
    },
    flash: {
      opacity: [1, 0.3, 1],
      scale: [1, 1.05, 1],
      backgroundColor: ["var(--cell-color)", "#ffffff", "var(--cell-color)"],
      transition: {
        duration: DEFAULT_LINE_CLEAR_CONFIG.flashDuration / 1000,
        ease: "easeInOut",
        repeat: DEFAULT_LINE_CLEAR_CONFIG.flashCount - 1,
      },
    },
    collapse: {
      opacity: [1, 1, 0],
      scale: [1, 1.1, 0],
      height: ["var(--cell-height)", "var(--cell-height)", "0px"],
      transition: {
        duration: DEFAULT_LINE_CLEAR_CONFIG.collapseDuration / 1000,
        ease: "easeInOut",
        times: [0, 0.3, 1],
      },
    },
  };

  // Add special effects for multi-line clears
  if (lineClearCount >= 2) {
    baseVariants.flash.scale = [1, 1.1, 1];
    baseVariants.flash.backgroundColor = [
      "var(--cell-color)",
      lineClearCount === 4 ? "#ffd700" : "#ff6b6b", // Gold for Tetris, red for others
      "var(--cell-color)",
    ];
  }

  if (lineClearCount === 4) {
    // Special Tetris animation
    baseVariants.flash.transition.repeat = 4; // More flashes for Tetris
    baseVariants.collapse.transition.duration = 0.4; // Slower collapse for dramatic effect
  }

  return baseVariants;
};

/**
 * Calculate staggered animation delays for multiple line clears
 */
export const calculateLineAnimationDelays = (
  clearingLines: number[],
  config: LineClearAnimationConfig = DEFAULT_LINE_CLEAR_CONFIG
): Map<number, number> => {
  const delays = new Map<number, number>();

  // Sort lines by position (bottom to top for natural clearing order)
  const sortedLines = [...clearingLines].sort((a, b) => b - a);

  sortedLines.forEach((lineIndex, order) => {
    // Stagger the start of each line's animation
    const delay = order * config.delayBetweenLines;
    delays.set(lineIndex, delay);
  });

  return delays;
};

/**
 * Get animation timing for specific animation phase
 */
export const getAnimationPhaseInfo = (
  elapsedTime: number,
  config: LineClearAnimationConfig = DEFAULT_LINE_CLEAR_CONFIG
) => {
  const flashTotalDuration = config.flashDuration * config.flashCount;

  if (elapsedTime < flashTotalDuration) {
    return {
      phase: "flash" as const,
      progress: elapsedTime / flashTotalDuration,
      remaining: flashTotalDuration - elapsedTime,
    };
  }

  const collapseStart = flashTotalDuration;
  const collapseEnd = collapseStart + config.collapseDuration;

  if (elapsedTime < collapseEnd) {
    return {
      phase: "collapse" as const,
      progress: (elapsedTime - collapseStart) / config.collapseDuration,
      remaining: collapseEnd - elapsedTime,
    };
  }

  return {
    phase: "complete" as const,
    progress: 1,
    remaining: 0,
  };
};

/**
 * Create line clear animation state
 */
export const createLineClearAnimationState = (
  clearingLines: number[],
  config: LineClearAnimationConfig = DEFAULT_LINE_CLEAR_CONFIG
): LineClearAnimationState => ({
  clearingLines: [...clearingLines],
  animationPhase: "flash",
  startTime: Date.now(),
  duration: config.totalDuration,
  lineClearCount: clearingLines.length,
});

/**
 * Update line clear animation state
 */
export const updateLineClearAnimationState = (
  state: LineClearAnimationState,
  config: LineClearAnimationConfig = DEFAULT_LINE_CLEAR_CONFIG
): LineClearAnimationState => {
  const currentTime = Date.now();
  const elapsedTime = currentTime - state.startTime;
  const phaseInfo = getAnimationPhaseInfo(elapsedTime, config);

  return {
    ...state,
    animationPhase: phaseInfo.phase,
  };
};

/**
 * Check if line clear animation is complete
 */
export const isLineClearAnimationComplete = (state: LineClearAnimationState): boolean => {
  return state.animationPhase === "complete";
};

/**
 * Get line clear feedback message based on number of lines cleared
 */
export const getLineClearFeedback = (lineCount: number): string => {
  switch (lineCount) {
    case 1:
      return "game.feedback.lineClear.single";
    case 2:
      return "game.feedback.lineClear.double";
    case 3:
      return "game.feedback.lineClear.triple";
    case 4:
      return "game.feedback.lineClear.tetris";
    default:
      return "";
  }
};

/**
 * Get animation CSS custom properties for cell styling
 */
export const getLineClearCSSProperties = (
  rowIndex: number,
  clearingLines: number[],
  lineClearCount: number
): React.CSSProperties => {
  const isClearing = clearingLines.includes(rowIndex);

  if (!isClearing) {
    return {};
  }

  const cellColor = lineClearCount === 4 ? "#ffd700" : "#ff6b6b";

  return {
    "--cell-color": cellColor,
    "--cell-height": "100%",
  } as React.CSSProperties;
};

/**
 * Calculate board rows that need to move down after line clearing
 */
export const calculateRowShifts = (
  board: GameBoard,
  clearedLines: number[]
): Map<number, number> => {
  const shifts = new Map<number, number>();
  const sortedClearedLines = [...clearedLines].sort((a, b) => a - b);

  for (let row = board.length - 1; row >= 0; row--) {
    let shiftAmount = 0;

    // Count how many cleared lines are below this row
    for (const clearedLine of sortedClearedLines) {
      if (clearedLine > row) {
        shiftAmount++;
      }
    }

    if (shiftAmount > 0) {
      shifts.set(row, shiftAmount);
    }
  }

  return shifts;
};

/**
 * Get row collapse animation variants
 */
export const getRowCollapseVariants = (shiftAmount: number) => ({
  initial: {
    y: 0,
    opacity: 1,
  },
  collapse: {
    y: shiftAmount * 32, // Assume 32px cell height
    opacity: 1,
    transition: {
      duration: DEFAULT_LINE_CLEAR_CONFIG.collapseDuration / 1000,
      ease: "easeInOut",
      delay:
        (DEFAULT_LINE_CLEAR_CONFIG.flashDuration * DEFAULT_LINE_CLEAR_CONFIG.flashCount) / 1000,
    },
  },
});

export default {
  DEFAULT_LINE_CLEAR_CONFIG,
  getLineClearVariants,
  calculateLineAnimationDelays,
  getAnimationPhaseInfo,
  createLineClearAnimationState,
  updateLineClearAnimationState,
  isLineClearAnimationComplete,
  getLineClearFeedback,
  getLineClearCSSProperties,
  calculateRowShifts,
  getRowCollapseVariants,
};
