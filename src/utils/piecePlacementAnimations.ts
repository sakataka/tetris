import type { Position, Tetromino } from "@/types/game";

/**
 * Piece placement animation utilities
 * Provides functionality for piece lock and placement visual effects
 */

export interface PieceLockAnimationState {
  isLocking: boolean;
  lockingPiece: Tetromino | null;
  lockStartTime: number;
  lockDuration: number;
  lockPositions: Position[];
}

export interface PiecePlacementAnimationConfig {
  lockDuration: number; // Duration of lock animation in ms
  lockPulseDuration: number; // Duration of each pulse in the lock animation
  lockPulseCount: number; // Number of pulses during lock animation
  dropAnimationDuration: number; // Duration of drop animation
  rotationAnimationDuration: number; // Duration of rotation animation
}

// Default animation configuration
export const DEFAULT_PIECE_PLACEMENT_CONFIG: PiecePlacementAnimationConfig = {
  lockDuration: 300,
  lockPulseDuration: 100,
  lockPulseCount: 2,
  dropAnimationDuration: 150,
  rotationAnimationDuration: 200,
};

/**
 * Create piece lock animation state
 */
export const createPieceLockAnimationState = (
  piece: Tetromino,
  config: PiecePlacementAnimationConfig = DEFAULT_PIECE_PLACEMENT_CONFIG
): PieceLockAnimationState => {
  // Calculate positions of all cells in the piece
  const lockPositions: Position[] = [];

  for (let py = 0; py < piece.shape.length; py++) {
    for (let px = 0; px < piece.shape[py].length; px++) {
      if (piece.shape[py][px] !== 0) {
        lockPositions.push({
          x: piece.position.x + px,
          y: piece.position.y + py,
        });
      }
    }
  }

  return {
    isLocking: true,
    lockingPiece: { ...piece },
    lockStartTime: Date.now(),
    lockDuration: config.lockDuration,
    lockPositions,
  };
};

/**
 * Get piece lock animation variants for Framer Motion
 */
export const getPieceLockVariants = (
  config: PiecePlacementAnimationConfig = DEFAULT_PIECE_PLACEMENT_CONFIG
) => ({
  normal: {
    scale: 1,
    opacity: 1,
    boxShadow: "0 0 0px rgba(255, 255, 255, 0)",
  },
  locking: {
    scale: [1, 1.1, 1.05, 1],
    opacity: [1, 0.9, 1, 1],
    boxShadow: [
      "0 0 0px rgba(255, 255, 255, 0)",
      "0 0 15px rgba(255, 255, 255, 0.8)",
      "0 0 8px rgba(255, 255, 255, 0.4)",
      "0 0 0px rgba(255, 255, 255, 0)",
    ],
    transition: {
      duration: config.lockDuration / 1000,
      ease: "easeOut",
      times: [0, 0.3, 0.7, 1],
    },
  },
  locked: {
    scale: 1,
    opacity: 1,
    boxShadow: "0 0 0px rgba(255, 255, 255, 0)",
    transition: {
      duration: 0.1,
      ease: "easeOut",
    },
  },
});

/**
 * Get piece drop animation variants
 */
export const getPieceDropVariants = (
  dropDistance: number,
  config: PiecePlacementAnimationConfig = DEFAULT_PIECE_PLACEMENT_CONFIG
) => ({
  initial: {
    y: -dropDistance * 32, // Assume 32px per cell
    opacity: 0.8,
  },
  dropping: {
    y: 0,
    opacity: 1,
    transition: {
      duration: config.dropAnimationDuration / 1000,
      ease: "easeIn",
    },
  },
  landed: {
    y: 0,
    opacity: 1,
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.15,
      ease: "easeOut",
    },
  },
});

/**
 * Get piece rotation animation variants
 */
export const getPieceRotationVariants = (
  rotationDirection: "clockwise" | "counterclockwise",
  config: PiecePlacementAnimationConfig = DEFAULT_PIECE_PLACEMENT_CONFIG
) => {
  const rotationDegrees = rotationDirection === "clockwise" ? 90 : -90;

  return {
    initial: {
      rotate: 0,
      scale: 1,
    },
    rotating: {
      rotate: [0, rotationDegrees * 0.7, rotationDegrees],
      scale: [1, 1.1, 1],
      transition: {
        duration: config.rotationAnimationDuration / 1000,
        ease: "easeOut",
        times: [0, 0.6, 1],
      },
    },
    rotated: {
      rotate: rotationDegrees,
      scale: 1,
      transition: {
        duration: 0.05,
        ease: "easeOut",
      },
    },
  };
};

/**
 * Check if piece lock animation is complete
 */
export const isPieceLockAnimationComplete = (lockState: PieceLockAnimationState): boolean => {
  const elapsed = Date.now() - lockState.lockStartTime;
  return elapsed >= lockState.lockDuration;
};

/**
 * Update piece lock animation state
 */
export const updatePieceLockAnimationState = (
  lockState: PieceLockAnimationState
): PieceLockAnimationState => {
  if (isPieceLockAnimationComplete(lockState)) {
    return {
      ...lockState,
      isLocking: false,
    };
  }

  return lockState;
};

/**
 * Get piece placement impact effect variants
 */
export const getPieceImpactVariants = () => ({
  initial: {
    scale: 0,
    opacity: 0,
  },
  impact: {
    scale: [0, 1.3, 0],
    opacity: [0, 0.6, 0],
    transition: {
      duration: 0.4,
      ease: "easeOut",
      times: [0, 0.3, 1],
    },
  },
});

/**
 * Get piece placement ripple effect positions
 */
export const getRippleEffectPositions = (piece: Tetromino, cellSize: number = 32): Position[] => {
  const positions: Position[] = [];

  for (let py = 0; py < piece.shape.length; py++) {
    for (let px = 0; px < piece.shape[py].length; px++) {
      if (piece.shape[py][px] !== 0) {
        positions.push({
          x: (piece.position.x + px) * cellSize,
          y: (piece.position.y + py) * cellSize,
        });
      }
    }
  }

  return positions;
};

/**
 * Calculate piece drop distance for animation
 */
export const calculatePieceDropDistance = (startY: number, endY: number): number => {
  return Math.max(0, startY - endY);
};

/**
 * Get stagger animation delays for multiple piece cells
 */
export const getStaggeredAnimationDelays = (
  positions: Position[],
  maxDelay: number = 100
): Map<string, number> => {
  const delays = new Map<string, number>();
  const cellCount = positions.length;

  positions.forEach((pos, index) => {
    const key = `${pos.x}-${pos.y}`;
    const delay = (index / cellCount) * maxDelay;
    delays.set(key, delay);
  });

  return delays;
};

export default {
  DEFAULT_PIECE_PLACEMENT_CONFIG,
  createPieceLockAnimationState,
  getPieceLockVariants,
  getPieceDropVariants,
  getPieceRotationVariants,
  isPieceLockAnimationComplete,
  updatePieceLockAnimationState,
  getPieceImpactVariants,
  getRippleEffectPositions,
  calculatePieceDropDistance,
  getStaggeredAnimationDelays,
};
