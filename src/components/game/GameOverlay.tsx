import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useGameStore } from "@/store/gameStore";
import { useHighScoreStore } from "@/store/highScoreStore";
import { formatLevel, formatLines, formatScore } from "@/utils/scoreUtils";

export interface GameOverlayProps {
  className?: string;
}

interface OverlayButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  autoFocus?: boolean;
}

const OverlayButton: React.FC<OverlayButtonProps> = ({
  onClick,
  children,
  variant = "primary",
  className = "",
  autoFocus = false,
}) => {
  const baseClasses = `
    px-6 py-3 rounded-lg font-semibold text-lg
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-4 focus:ring-opacity-50
    hover:scale-105 active:scale-95
    transform
  `.trim();

  const variantClasses = {
    primary: `
      bg-blue-600 hover:bg-blue-700 text-white
      focus:ring-blue-500
      shadow-lg hover:shadow-xl
    `.trim(),
    secondary: `
      bg-gray-600 hover:bg-gray-700 text-white
      focus:ring-gray-500
      shadow-md hover:shadow-lg
    `.trim(),
  };

  return (
    <motion.button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      autoFocus={autoFocus}
    >
      {children}
    </motion.button>
  );
};

interface PauseOverlayProps {
  onResume: () => void;
  onNewGame: () => void;
}

const PauseOverlay: React.FC<PauseOverlayProps> = ({ onResume, onNewGame }) => {
  const { t } = useTranslation();
  const resumeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus management for pause overlay
    const timer = setTimeout(() => {
      resumeButtonRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "p" || event.key === "P") {
        event.preventDefault();
        onResume();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [onResume]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex flex-col items-center justify-center space-y-8"
    >
      <motion.h2
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="text-4xl md:text-5xl font-bold text-white text-center"
      >
        {t("game.states.paused")}
      </motion.h2>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="text-center text-gray-300 space-y-2"
      >
        <p className="text-lg">{t("game.instructions.pauseResume")}</p>
        <p className="text-sm md:hidden">{t("game.instructions.tapToResume")}</p>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <OverlayButton ref={resumeButtonRef} onClick={onResume} variant="primary" autoFocus>
          {t("game.actions.continue")}
        </OverlayButton>
        <OverlayButton onClick={onNewGame} variant="secondary">
          {t("game.actions.newGame")}
        </OverlayButton>
      </motion.div>
    </motion.div>
  );
};

interface GameOverOverlayProps {
  onNewGame: () => void;
  score: number;
  lines: number;
  level: number;
  isNewHighScore: boolean;
}

const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  onNewGame,
  score,
  lines,
  level,
  isNewHighScore,
}) => {
  const { t } = useTranslation();
  const newGameButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus management for game over overlay
    const timer = setTimeout(() => {
      newGameButtonRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        onNewGame();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [onNewGame]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center space-y-8 max-w-md mx-auto"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
        className="text-center"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-red-400 mb-2">
          {t("game.states.gameOver")}
        </h2>
        {isNewHighScore && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="text-yellow-400 text-xl font-semibold animate-pulse"
          >
            {t("game.feedback.newHighScore")}
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="bg-gray-800 rounded-lg p-6 w-full border border-gray-600"
      >
        <h3 className="text-xl font-semibold text-white mb-4 text-center">
          {t("game.score.finalScore", "Final Score")}
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">{t("game.score.title")}:</span>
            <span className="text-white font-bold text-lg">{formatScore(score)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">{t("game.score.lines")}:</span>
            <span className="text-white font-bold text-lg">{formatLines(lines)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">{t("game.score.level")}:</span>
            <span className="text-white font-bold text-lg">{formatLevel(level)}</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="text-center text-gray-300 space-y-2"
      >
        <p className="text-lg">{t("game.instructions.restart")}</p>
        <p className="text-sm md:hidden">{t("game.instructions.tapToRestart")}</p>
      </motion.div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <OverlayButton ref={newGameButtonRef} onClick={onNewGame} variant="primary" autoFocus>
          {t("game.actions.newGame")}
        </OverlayButton>
      </motion.div>
    </motion.div>
  );
};

export const GameOverlay: React.FC<GameOverlayProps> = ({ className = "" }) => {
  const { isPaused, isGameOver, score, lines, level, togglePause, resetGame } = useGameStore();
  const { isNewHighScore } = useHighScoreStore();

  const handleResume = () => {
    togglePause();
  };

  const handleNewGame = () => {
    resetGame();
  };

  const shouldShow = isPaused || isGameOver;

  // Click outside handler for mobile
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      if (isPaused) {
        handleResume();
      }
    }
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`
            fixed inset-0 z-50
            bg-black bg-opacity-75 backdrop-blur-sm
            flex items-center justify-center
            p-4 sm:p-8
            ${className}
          `.trim()}
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby={isPaused ? "pause-title" : "game-over-title"}
        >
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            {isPaused && <PauseOverlay onResume={handleResume} onNewGame={handleNewGame} />}
            {isGameOver && (
              <GameOverOverlay
                onNewGame={handleNewGame}
                score={score}
                lines={lines}
                level={level}
                isNewHighScore={isNewHighScore(score)}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameOverlay;
