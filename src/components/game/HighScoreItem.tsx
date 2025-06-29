import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { HighScoreEntry } from "@/store/highScoreStore";
import {
  formatLevel,
  formatLines,
  formatScore,
  formatScoreDate,
  getScoreCategory,
} from "@/utils/scoreUtils";

export interface HighScoreItemProps {
  entry: HighScoreEntry;
  rank: number;
  isNew?: boolean;
  index: number;
}

/**
 * Individual high score entry component with ranking and score details
 */
export function HighScoreItem({ entry, rank, isNew = false, index }: HighScoreItemProps) {
  const { t, i18n } = useTranslation();

  const scoreCategory = getScoreCategory(entry.score);
  const formattedDate = formatScoreDate(entry.date, i18n.language);

  // Format rank display
  const formatRank = (rank: number): string => {
    if (rank === 1) return t("game.highScores.ranking.1st");
    if (rank === 2) return t("game.highScores.ranking.2nd");
    if (rank === 3) return t("game.highScores.ranking.3rd");
    return t("game.highScores.ranking.nth", { rank });
  };

  // Get appropriate styling for rank
  const getRankStyling = (rank: number) => {
    switch (rank) {
      case 1:
        return "text-yellow-400 font-bold text-lg";
      case 2:
        return "text-gray-300 font-semibold";
      case 3:
        return "text-orange-400 font-semibold";
      default:
        return "text-gray-400";
    }
  };

  // Get score category styling
  const getCategoryStyling = (category: string) => {
    switch (category) {
      case "legendary":
        return "text-purple-400 font-bold";
      case "master":
        return "text-red-400 font-semibold";
      case "expert":
        return "text-orange-400";
      case "advanced":
        return "text-blue-400";
      case "intermediate":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.1,
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      className={`
        flex items-center justify-between p-3 rounded-lg border
        ${
          isNew
            ? "bg-yellow-900/20 border-yellow-400 shadow-lg"
            : "bg-gray-800/50 border-gray-700 hover:bg-gray-800/80"
        }
        transition-colors duration-200
      `}
    >
      {/* Rank */}
      <div className="flex items-center space-x-3 min-w-[80px]">
        <div className={`text-center ${getRankStyling(rank)}`}>{formatRank(rank)}</div>
        {rank <= 3 && <div className="text-lg">{rank === 1 ? "🏆" : rank === 2 ? "🥈" : "🥉"}</div>}
      </div>

      {/* Score Details */}
      <div className="flex-1 grid grid-cols-3 gap-4 text-sm">
        {/* Score */}
        <div className="text-center">
          <div className="text-white font-semibold text-lg">{formatScore(entry.score)}</div>
          <div className={`text-xs ${getCategoryStyling(scoreCategory)}`}>
            {t(`game.highScores.categories.${scoreCategory}`)}
          </div>
        </div>

        {/* Lines & Level */}
        <div className="text-center">
          <div className="text-gray-300">
            {formatLines(entry.lines)} {t("game.highScores.lines").toLowerCase()}
          </div>
          <div className="text-gray-400 text-xs">
            {t("game.highScores.level")} {formatLevel(entry.level)}
          </div>
        </div>

        {/* Date */}
        <div className="text-center">
          <div className="text-gray-300 text-xs">{formattedDate}</div>
        </div>
      </div>

      {/* New Score Indicator */}
      {isNew && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.5,
            type: "spring",
            stiffness: 400,
            damping: 15,
          }}
          className="text-yellow-400 text-sm font-bold"
        >
          ✨ {t("game.feedback.newHighScore")}
        </motion.div>
      )}
    </motion.div>
  );
}
