import { motion } from "framer-motion";
import type React from "react";
import { useTranslation } from "react-i18next";
import { useGameStore } from "@/store/gameStore";
import { TetrominoGrid } from "./TetrominoGrid";

export interface HoldPieceProps {
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
    scale: 0.5,
    rotate: -180,
  },
  center: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
      duration: 0.5,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.5,
    rotate: 180,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

const unavailableVariants = {
  available: {
    opacity: 1,
    scale: 1,
    filter: "grayscale(0%)",
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  unavailable: {
    opacity: 0.4,
    scale: 0.95,
    filter: "grayscale(100%)",
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

export const HoldPiece: React.FC<HoldPieceProps> = ({
  className = "",
  size = "medium",
  showLabel = true,
  animate = true,
}) => {
  const { t } = useTranslation();
  const { heldPiece, canHold } = useGameStore();

  const containerClasses = `
    flex flex-col items-center gap-2
    p-3 rounded-lg
    border-2 transition-colors duration-300
    ${canHold ? "bg-gray-800 border-gray-600" : "bg-gray-900 border-gray-700"}
    ${!canHold ? "opacity-60" : ""}
    ${className}
  `.trim();

  const labelClasses = `
    text-sm font-medium transition-colors duration-300
    uppercase tracking-wide
    ${canHold ? "text-gray-300" : "text-gray-500"}
    ${size === "small" ? "text-xs" : ""}
    ${size === "large" ? "text-base" : ""}
  `.trim();

  const gridWrapperClasses = `
    flex items-center justify-center
    min-h-16 min-w-16 relative
    ${size === "small" ? "min-h-12 min-w-12" : ""}
    ${size === "large" ? "min-h-20 min-w-20" : ""}
  `.trim();

  const statusIndicatorClasses = `
    absolute -top-1 -right-1
    w-3 h-3 rounded-full
    transition-colors duration-300
    ${canHold ? "bg-green-500" : "bg-red-500"}
    ${size === "small" ? "w-2 h-2" : ""}
    ${size === "large" ? "w-4 h-4" : ""}
  `.trim();

  const emptyStateClasses = `
    text-gray-500 text-sm italic
    ${size === "small" ? "text-xs" : ""}
    ${size === "large" ? "text-base" : ""}
  `.trim();

  const renderPieceGrid = () => {
    if (!heldPiece) {
      return <div className={emptyStateClasses}>{t("game.pieces.empty", "Empty")}</div>;
    }

    const gridContent = (
      <TetrominoGrid pieceType={heldPiece} size={size} data-testid="hold-piece-grid" />
    );

    if (animate) {
      return (
        <motion.div
          key={heldPiece} // Triggers animation when piece changes
          variants={pieceChangeVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          <motion.div
            variants={unavailableVariants}
            animate={canHold ? "available" : "unavailable"}
          >
            {gridContent}
          </motion.div>
        </motion.div>
      );
    }

    return (
      <motion.div variants={unavailableVariants} animate={canHold ? "available" : "unavailable"}>
        {gridContent}
      </motion.div>
    );
  };

  const content = (
    <div className={containerClasses}>
      {showLabel && (
        <div className="flex items-center gap-2">
          <h3 className={labelClasses}>{t("game.pieces.hold")}</h3>
          <div
            className={statusIndicatorClasses}
            title={
              canHold
                ? t("game.feedback.canHold", "Hold available")
                : t("game.feedback.cannotHold", "Hold not available")
            }
            aria-label={
              canHold
                ? t("game.feedback.canHold", "Hold available")
                : t("game.feedback.cannotHold", "Hold not available")
            }
          />
        </div>
      )}

      <div className={gridWrapperClasses}>{renderPieceGrid()}</div>

      {!canHold && heldPiece && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-400 text-center"
        >
          {t("game.feedback.holdUsed", "Already used this turn")}
        </motion.div>
      )}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        data-testid="hold-piece-container"
        aria-label={`${t("game.pieces.hold")}${heldPiece ? ` - ${heldPiece} piece` : " - empty"}${canHold ? " (available)" : " (not available)"}`}
        role="region"
      >
        {content}
      </motion.div>
    );
  }

  return (
    <div
      data-testid="hold-piece-container"
      aria-label={`${t("game.pieces.hold")}${heldPiece ? ` - ${heldPiece} piece` : " - empty"}${canHold ? " (available)" : " (not available)"}`}
      role="region"
    >
      {content}
    </div>
  );
};

export default HoldPiece;
