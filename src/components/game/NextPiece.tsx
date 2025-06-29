import { motion } from "framer-motion";
import type React from "react";
import { useTranslation } from "react-i18next";
import { useGameStore } from "@/store/gameStore";
import { TetrominoGrid } from "./TetrominoGrid";

export interface NextPieceProps {
  className?: string;
  size?: "small" | "medium" | "large";
  showLabel?: boolean;
  animate?: boolean;
}

const containerVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
      duration: 0.3,
    },
  },
};

const pieceChangeVariants = {
  enter: {
    opacity: 0,
    y: -20,
    scale: 0.8,
  },
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
      duration: 0.4,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.8,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

export const NextPiece: React.FC<NextPieceProps> = ({
  className = "",
  size = "medium",
  showLabel = true,
  animate = true,
}) => {
  const { t } = useTranslation();
  const { nextPiece } = useGameStore();

  const containerClasses = `
    flex flex-col items-center gap-2
    p-3 rounded-lg
    bg-gray-800 border border-gray-600
    ${className}
  `.trim();

  const labelClasses = `
    text-sm font-medium text-gray-300
    uppercase tracking-wide
    ${size === "small" ? "text-xs" : ""}
    ${size === "large" ? "text-base" : ""}
  `.trim();

  const gridWrapperClasses = `
    flex items-center justify-center
    min-h-16 min-w-16
    ${size === "small" ? "min-h-12 min-w-12" : ""}
    ${size === "large" ? "min-h-20 min-w-20" : ""}
  `.trim();

  const content = (
    <div className={containerClasses}>
      {showLabel && <h3 className={labelClasses}>{t("game.pieces.next")}</h3>}

      <div className={gridWrapperClasses}>
        {animate ? (
          <motion.div
            key={nextPiece} // This triggers animation when piece changes
            variants={pieceChangeVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <TetrominoGrid pieceType={nextPiece} size={size} data-testid="next-piece-grid" />
          </motion.div>
        ) : (
          <TetrominoGrid pieceType={nextPiece} size={size} data-testid="next-piece-grid" />
        )}
      </div>
    </div>
  );

  if (animate) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        data-testid="next-piece-container"
        aria-label={t("game.pieces.next") + (nextPiece ? ` - ${nextPiece} piece` : "")}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <div
      data-testid="next-piece-container"
      aria-label={t("game.pieces.next") + (nextPiece ? ` - ${nextPiece} piece` : "")}
    >
      {content}
    </div>
  );
};

export default NextPiece;
