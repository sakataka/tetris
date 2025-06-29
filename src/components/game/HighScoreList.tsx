import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { HighScoreEntry } from "@/store/highScoreStore";
import { sortHighScores } from "@/utils/scoreUtils";
import { HighScoreItem } from "./HighScoreItem";

export interface HighScoreListProps {
  scores: HighScoreEntry[];
  newScoreId?: string; // Date of new score for highlighting
  maxEntries?: number;
  showHeader?: boolean;
  compact?: boolean;
}

/**
 * High score list component with sortable entries and ranking
 */
export function HighScoreList({
  scores,
  newScoreId,
  maxEntries = 10,
  showHeader = true,
  compact = false,
}: HighScoreListProps) {
  const { t } = useTranslation();

  // Sort scores and limit to maxEntries
  const sortedScores = sortHighScores(scores).slice(0, maxEntries);

  // Empty state
  if (sortedScores.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-xl text-gray-300 mb-2">{t("game.highScores.noScores")}</h3>
        <p className="text-gray-400 text-sm">{t("game.highScores.noScoresDescription")}</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {showHeader && !compact && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-4 gap-4 text-xs text-gray-400 uppercase tracking-wider px-3"
        >
          <div>{t("game.highScores.rank")}</div>
          <div className="text-center">{t("game.highScores.score")}</div>
          <div className="text-center">{t("game.highScores.lines")}</div>
          <div className="text-center">{t("game.highScores.date")}</div>
        </motion.div>
      )}

      {/* Score List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
        className={`space-y-2 ${compact ? "space-y-1" : ""}`}
      >
        {sortedScores.map((entry, index) => {
          const rank = index + 1;
          const isNew = newScoreId === entry.date;

          return (
            <HighScoreItem
              key={`${entry.date}-${entry.score}`}
              entry={entry}
              rank={rank}
              isNew={isNew}
              index={index}
            />
          );
        })}
      </motion.div>

      {/* Footer with count */}
      {!compact && sortedScores.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-gray-400 text-xs pt-4"
        >
          {sortedScores.length === 1
            ? t("game.highScores.oneScore", { count: 1 })
            : t("game.highScores.multipleScores", { count: sortedScores.length })}
          {scores.length > maxEntries && (
            <span className="block mt-1">
              {t("game.highScores.showingTop", { max: maxEntries })}
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
}
