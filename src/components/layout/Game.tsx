import { motion } from "framer-motion";
import type React from "react";
import { useTranslation } from "react-i18next";
import { Board } from "@/components/game/Board";
import { HighScore } from "@/components/game/HighScore";
import { HoldPiece } from "@/components/game/HoldPiece";
import { NextPiece } from "@/components/game/NextPiece";
import { ScoreBoard } from "@/components/game/ScoreBoard";
import { useGameStore } from "@/store/gameStore";
import { useSettingsStore } from "@/store/settingsStore";
import { MobileGameLayout } from "./MobileGameLayout";

interface GameProps {
  className?: string;
}

/**
 * Main game layout component with responsive design
 * Desktop: sidebar layout with game board and stats
 * Mobile: vertical stack layout optimized for touch
 */
export const Game: React.FC<GameProps> = ({ className = "" }) => {
  const { t } = useTranslation();
  const isGameOver = useGameStore((state) => state.isGameOver);
  const isPaused = useGameStore((state) => state.isPaused);
  const showGhostPiece = useSettingsStore((state) => state.showGhostPiece);

  return (
    <motion.div
      className={`min-h-screen bg-gray-900 text-white ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Desktop Layout - Hidden on mobile */}
      <div className="hidden md:block">
        <div className="flex h-screen max-w-7xl mx-auto p-4 gap-6">
          {/* Main game area */}
          <main
            className="flex-1 flex items-center justify-center relative"
            role="main"
            aria-label={t("game.layout.mainGame")}
          >
            <div className="relative">
              <Board
                className="shadow-2xl border-2 border-gray-700 rounded-lg"
                aria-label={t("game.layout.gameBoard")}
              />

              {/* Game overlays */}
              {isPaused && (
                <div
                  className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-lg"
                  role="dialog"
                  aria-label={t("game.states.paused")}
                  aria-modal="true"
                >
                  <div className="text-center text-white p-6 bg-gray-800 rounded-lg shadow-xl">
                    <h2 className="text-3xl font-bold mb-4">{t("game.states.paused")}</h2>
                    <p className="text-lg text-gray-300">{t("game.instructions.pauseResume")}</p>
                  </div>
                </div>
              )}

              {isGameOver && (
                <div
                  className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-lg"
                  role="dialog"
                  aria-label={t("game.states.gameOver")}
                  aria-modal="true"
                >
                  <div className="text-center text-white p-6 bg-red-900 rounded-lg shadow-xl">
                    <h2 className="text-3xl font-bold mb-4">{t("game.states.gameOver")}</h2>
                    <p className="text-lg text-gray-300">{t("game.instructions.restart")}</p>
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* Sidebar with game information */}
          <motion.aside
            className="w-80 flex flex-col gap-6"
            role="complementary"
            aria-label={t("game.layout.gameInfo")}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
              delay: 0.2,
            }}
          >
            {/* Score and stats section */}
            <motion.section
              className="bg-gray-800 rounded-lg p-4"
              aria-labelledby="stats-heading"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.4,
                ease: "easeOut",
                delay: 0.3,
              }}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
                transition: { duration: 0.2 },
              }}
            >
              <h2 id="stats-heading" className="sr-only">
                {t("game.score.title")}
              </h2>
              <ScoreBoard className="w-full" size="normal" orientation="vertical" animate={true} />
            </motion.section>

            {/* Piece preview section */}
            <motion.section
              className="bg-gray-800 rounded-lg p-4"
              aria-labelledby="pieces-heading"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.4,
                ease: "easeOut",
                delay: 0.4,
              }}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
                transition: { duration: 0.2 },
              }}
            >
              <h2 id="pieces-heading" className="sr-only">
                {t("game.pieces.preview")}
              </h2>

              <div className="grid grid-cols-1 gap-4">
                <NextPiece className="w-full" />
                <HoldPiece className="w-full" />
              </div>
            </motion.section>

            {/* High scores section */}
            <motion.section
              className="bg-gray-800 rounded-lg p-4 flex-1 overflow-auto"
              aria-labelledby="high-scores-heading"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.4,
                ease: "easeOut",
                delay: 0.5,
              }}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
                transition: { duration: 0.2 },
              }}
            >
              <h2 id="high-scores-heading" className="sr-only">
                {t("game.highScores.title")}
              </h2>
              <HighScore className="w-full" />
            </motion.section>
          </motion.aside>
        </div>
      </div>

      {/* Mobile Layout - Visible only on mobile */}
      <div className="md:hidden">
        <MobileGameLayout />
      </div>
    </motion.div>
  );
};
