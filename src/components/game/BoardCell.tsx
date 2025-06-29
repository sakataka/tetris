import { motion } from "framer-motion";
import type React from "react";
import type { CellValue } from "@/types/game";
import { GAME_CONSTANTS } from "@/utils/gameConstants";

export interface BoardCellProps {
  value: CellValue;
  isGhost?: boolean;
  isCurrentPiece?: boolean;
  isClearing?: boolean;
  row: number;
  col: number;
  animationKey?: string | number; // For triggering animations on state changes
  className?: string;
}

export interface CellState {
  isEmpty: boolean;
  isFilled: boolean;
  isGhost: boolean;
  isClearing: boolean;
  isCurrentPiece: boolean;
}

const getCellState = (
  value: CellValue,
  isGhost: boolean,
  isCurrentPiece: boolean,
  isClearing: boolean
): CellState => ({
  isEmpty: value === 0 && !isGhost && !isCurrentPiece,
  isFilled: value !== 0 && !isGhost,
  isGhost,
  isClearing,
  isCurrentPiece,
});

const getCellColors = (value: CellValue, cellState: CellState) => {
  const { isEmpty, isGhost, isCurrentPiece } = cellState;

  if (isEmpty) {
    return {
      backgroundColor: GAME_CONSTANTS.PIECE_COLORS[0], // Transparent/empty
      borderColor: "#374151", // Gray-700
    };
  }

  const baseColor = GAME_CONSTANTS.PIECE_COLORS[value] || "#6b7280"; // Gray-500 fallback

  if (isGhost) {
    return {
      backgroundColor: "transparent",
      borderColor: baseColor,
    };
  }

  if (isCurrentPiece) {
    return {
      backgroundColor: baseColor,
      borderColor: "#ffffff",
      boxShadow: `0 0 8px ${baseColor}`, // Glow effect for current piece
    };
  }

  return {
    backgroundColor: baseColor,
    borderColor: "#4b5563", // Gray-600
  };
};

const getAnimationVariants = () => ({
  // Initial state for new pieces
  initial: {
    scale: 0.8,
    opacity: 0,
  },
  // Normal visible state
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
      duration: 0.2,
    },
  },
  // Line clearing animation
  clearing: {
    scale: [1, 1.2, 0],
    opacity: [1, 1, 0],
    backgroundColor: ["var(--bg-color)", "#ffffff", "var(--bg-color)"],
    transition: {
      duration: GAME_CONSTANTS.TIMING.LINE_CLEAR_DURATION / 1000,
      ease: "easeInOut",
      times: [0, 0.5, 1],
    },
  },
  // Piece lock animation
  locked: {
    scale: [1, 1.1, 1],
    transition: {
      duration: GAME_CONSTANTS.TIMING.PIECE_LOCK_DELAY / 1000,
      ease: "easeOut",
    },
  },
  // Ghost piece animation
  ghost: {
    opacity: GAME_CONSTANTS.GHOST_PIECE.OPACITY,
    scale: 0.95,
    transition: {
      duration: 0.1,
      ease: "easeOut",
    },
  },
});

export const BoardCell: React.FC<BoardCellProps> = ({
  value,
  isGhost = false,
  isCurrentPiece = false,
  isClearing = false,
  row,
  col,
  animationKey,
  className = "",
}) => {
  const cellState = getCellState(value, isGhost, isCurrentPiece, isClearing);
  const colors = getCellColors(value, cellState);
  const variants = getAnimationVariants();

  // Determine animation state
  const getAnimationState = () => {
    if (isClearing) return "clearing";
    if (isGhost) return "ghost";
    if (isCurrentPiece) return "visible";
    if (cellState.isFilled) return "locked";
    return "visible";
  };

  const animationState = getAnimationState();

  // Base CSS classes for GPU optimization
  const baseClasses = `
    relative
    aspect-square
    border
    will-change-transform
    transform-gpu
    ${cellState.isGhost ? "border-dashed border-2" : "border-solid border"}
    ${className}
  `.trim();

  return (
    <motion.div
      key={animationKey || `${row}-${col}-${value}`}
      className={baseClasses}
      style={
        {
          "--bg-color": colors.backgroundColor,
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          boxShadow: colors.boxShadow,
        } as React.CSSProperties
      }
      variants={variants}
      initial="initial"
      animate={animationState}
      role="gridcell"
      aria-label={`Cell ${row + 1}, ${col + 1}${
        cellState.isFilled ? " filled" : cellState.isEmpty ? " empty" : ""
      }${cellState.isGhost ? " ghost" : ""}${
        cellState.isCurrentPiece ? " current piece" : ""
      }${cellState.isClearing ? " clearing" : ""}`}
      data-testid={`board-cell-${row}-${col}`}
      data-value={value}
      data-state={JSON.stringify(cellState)}
    >
      {/* Additional visual effects for special states */}
      {cellState.isCurrentPiece && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{
            duration: 1,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          style={{
            background: `radial-gradient(circle, ${colors.backgroundColor}40 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Line clearing flash effect */}
      {cellState.isClearing && (
        <motion.div
          className="absolute inset-0 bg-white pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{
            duration: GAME_CONSTANTS.TIMING.LINE_CLEAR_DURATION / 1000 / 2,
            repeat: 2,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Ghost piece pattern overlay */}
      {cellState.isGhost && (
        <div
          className="absolute inset-1 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              ${colors.borderColor}20,
              ${colors.borderColor}20 2px,
              transparent 2px,
              transparent 6px
            )`,
          }}
        />
      )}
    </motion.div>
  );
};

export default BoardCell;
