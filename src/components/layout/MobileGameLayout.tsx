import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useTranslation } from "react-i18next";
import { Board } from "@/components/game/Board";
import { HoldPiece } from "@/components/game/HoldPiece";
import { NextPiece } from "@/components/game/NextPiece";
import { ScoreBoard } from "@/components/game/ScoreBoard";
import { useGameStore } from "@/store/gameStore";

interface MobileGameLayoutProps {
  className?: string;
}

/**
 * Mobile-optimized game layout component
 * Features:
 * - Touch-friendly component sizing (minimum 44px touch targets)
 * - Optimized board size for mobile screens
 * - Mobile header with essential information
 * - Bottom-positioned piece previews for easy thumb access
 * - Full-screen overlays for game states
 */
export const MobileGameLayout: React.FC<MobileGameLayoutProps> = ({ className = "" }) => {
  const { t } = useTranslation();
  const isGameOver = useGameStore((state) => state.isGameOver);
  const isPaused = useGameStore((state) => state.isPaused);

  return (
    <motion.div
      className={`flex flex-col h-screen bg-gray-900 text-white ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Mobile header with essential game information */}
      <header
        className="bg-gray-800 p-3 shadow-lg border-b border-gray-700"
        role="banner"
        aria-label={t("game.layout.mobileHeader")}
      >
        <ScoreBoard
          className="w-full"
          size="compact"
          orientation="horizontal"
          showLabels={false}
          animate={true}
        />
      </header>

      {/* Main game board area - takes up most of the screen */}
      <main
        className="flex-1 flex items-center justify-center p-4 relative min-h-0"
        role="main"
        aria-label={t("game.layout.mainGame")}
      >
        {/* Board container with proper aspect ratio */}
        <div className="relative w-full max-w-sm aspect-[1/2]">
          <Board
            className="w-full h-full shadow-xl border border-gray-700 rounded-lg"
            aria-label={t("game.layout.gameBoard")}
          />

          {/* Mobile pause overlay */}
          <AnimatePresence>
            {isPaused && (
              <motion.div
                className="absolute inset-0 bg-black bg-opacity-85 flex items-center justify-center rounded-lg z-50"
                role="dialog"
                aria-label={t("game.states.paused")}
                aria-modal="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  className="text-center text-white p-6 bg-gray-800 rounded-lg shadow-2xl mx-4 max-w-xs"
                  initial={{ scale: 0.8, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.8, y: 20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <motion.div
                    className="mb-4 text-4xl"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.4, type: "spring", stiffness: 200 }}
                  >
                    ⏸️
                  </motion.div>
                  <motion.h2
                    className="text-2xl font-bold mb-3"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    {t("game.states.paused")}
                  </motion.h2>
                  <motion.p
                    className="text-gray-300 text-sm leading-relaxed"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    {t("game.instructions.tapToResume")}
                  </motion.p>
                  {/* Touch target for resume - invisible but accessible */}
                  <button
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    aria-label={t("game.actions.resume")}
                    onClick={() => {
                      // Resume action will be handled by touch gestures or keyboard
                    }}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile game over overlay */}
          <AnimatePresence>
            {isGameOver && (
              <motion.div
                className="absolute inset-0 bg-black bg-opacity-85 flex items-center justify-center rounded-lg z-50"
                role="dialog"
                aria-label={t("game.states.gameOver")}
                aria-modal="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  className="text-center text-white p-6 bg-red-900 rounded-lg shadow-2xl mx-4 max-w-xs"
                  initial={{ scale: 0.8, y: 50 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.8, y: 50 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <motion.div
                    className="mb-4 text-4xl"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
                  >
                    💀
                  </motion.div>
                  <motion.h2
                    className="text-2xl font-bold mb-3 text-red-100"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    {t("game.states.gameOver")}
                  </motion.h2>
                  <motion.p
                    className="text-red-200 text-sm leading-relaxed mb-4"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    {t("game.instructions.tapToRestart")}
                  </motion.p>
                  {/* Touch target for restart - invisible but accessible */}
                  <button
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    aria-label={t("game.actions.restart")}
                    onClick={() => {
                      // Restart action will be handled by keyboard controls
                    }}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile piece previews - positioned at bottom for thumb-friendly access */}
      <aside
        className="bg-gray-800 p-3 border-t border-gray-700"
        role="complementary"
        aria-label={t("game.layout.pieceInfo")}
      >
        <div className="flex justify-center gap-4 max-w-sm mx-auto">
          {/* Next piece preview - optimized for mobile viewing */}
          <div className="flex-1 min-w-0">
            <NextPiece className="w-full bg-gray-700 rounded-lg p-3 shadow-md" />
          </div>

          {/* Hold piece preview - optimized for mobile viewing */}
          <div className="flex-1 min-w-0">
            <HoldPiece className="w-full bg-gray-700 rounded-lg p-3 shadow-md" />
          </div>
        </div>
      </aside>

      {/* Touch zones for gestures - invisible but functional */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isPaused && t("game.states.paused")}
        {isGameOver && t("game.states.gameOver")}
      </div>
    </motion.div>
  );
};
