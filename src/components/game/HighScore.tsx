import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useHighScoreStore } from "@/store/highScoreStore";
import { HighScoreList } from "./HighScoreList";

export interface HighScoreProps {
  showTitle?: boolean;
  maxEntries?: number;
  compact?: boolean;
  newScoreId?: string; // Date of new score for highlighting
  className?: string;
}

/**
 * Main high score component that displays the complete high score system
 */
export function HighScore({
  showTitle = true,
  maxEntries = 10,
  compact = false,
  newScoreId,
  className = "",
}: HighScoreProps) {
  const { t } = useTranslation();
  const { highScores } = useHighScoreStore();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      className={`bg-gray-900/90 rounded-lg shadow-xl ${className}`}
    >
      {/* Header */}
      {showTitle && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="border-b border-gray-700 p-4"
        >
          <div className="flex items-center justify-center space-x-3">
            <span className="text-2xl">🏆</span>
            <h2 className="text-xl font-bold text-white">{t("game.highScores.title")}</h2>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <div className={compact ? "p-3" : "p-6"}>
        <HighScoreList
          scores={highScores}
          newScoreId={newScoreId}
          maxEntries={maxEntries}
          showHeader={!compact}
          compact={compact}
        />
      </div>
    </motion.div>
  );
}

/**
 * Compact version of high score display for smaller spaces
 */
export function HighScoreCompact({
  maxEntries = 5,
  newScoreId,
  className = "",
}: Pick<HighScoreProps, "maxEntries" | "newScoreId" | "className">) {
  return (
    <HighScore
      showTitle={false}
      maxEntries={maxEntries}
      compact={true}
      newScoreId={newScoreId}
      className={className}
    />
  );
}

/**
 * High score modal/overlay version with enhanced styling
 */
export function HighScoreModal({
  onClose,
  newScoreId,
  className = "",
}: {
  onClose?: () => void;
  newScoreId?: string;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`max-w-2xl w-full max-h-[90vh] overflow-y-auto ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <HighScore
          showTitle={true}
          maxEntries={10}
          newScoreId={newScoreId}
          className="border border-gray-600"
        />

        {/* Close Button */}
        {onClose && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={onClose}
            className="mt-4 w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
          >
            {t("common.close", "Close")}
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}
