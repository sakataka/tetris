import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGameStore } from "@/store/gameStore";
import {
  formatLevel,
  formatLines,
  formatScore,
  getScoreAnimationDuration,
  getScoreAnimationValue,
  LEVEL_ANIMATION_DURATION,
  LINES_ANIMATION_DURATION,
} from "@/utils/scoreUtils";

export interface ScoreBoardProps {
  className?: string;
  size?: "compact" | "normal" | "large";
  showLabels?: boolean;
  animate?: boolean;
  orientation?: "horizontal" | "vertical";
}

interface AnimatedNumberProps {
  value: number;
  formatter: (value: number) => string;
  duration?: number;
  className?: string;
  animate?: boolean;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  formatter,
  duration = 500,
  className = "",
  animate = true,
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);

  useEffect(() => {
    if (!animate || value === previousValue) {
      setDisplayValue(value);
      return;
    }

    setPreviousValue(displayValue);

    const startTime = Date.now();
    const scoreDiff = Math.abs(value - displayValue);
    const animDuration = Math.min(duration, getScoreAnimationDuration(scoreDiff));

    const animateValue = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animDuration, 1);

      const currentValue = getScoreAnimationValue(displayValue, value, progress);
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animateValue);
      }
    };

    requestAnimationFrame(animateValue);
  }, [value, animate, displayValue, previousValue, duration]);

  const scoreChangeVariants = {
    initial: { scale: 1, color: "inherit" },
    changed: {
      scale: [1, 1.2, 1],
      color: ["inherit", "#10b981", "inherit"], // Green flash
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.span
      key={`${value}-${previousValue}`}
      className={className}
      variants={scoreChangeVariants}
      initial="initial"
      animate={value !== previousValue ? "changed" : "initial"}
    >
      {formatter(displayValue)}
    </motion.span>
  );
};

interface ScoreItemProps {
  label: string;
  value: number;
  formatter: (value: number) => string;
  size: "compact" | "normal" | "large";
  animate: boolean;
  duration?: number;
}

const ScoreItem: React.FC<ScoreItemProps> = ({
  label,
  value,
  formatter,
  size,
  animate,
  duration,
}) => {
  const sizeClasses = {
    compact: {
      container: "gap-1",
      label: "text-xs",
      value: "text-sm font-semibold",
    },
    normal: {
      container: "gap-2",
      label: "text-sm",
      value: "text-lg font-bold",
    },
    large: {
      container: "gap-3",
      label: "text-base",
      value: "text-xl font-bold",
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex flex-col items-center ${classes.container}`}>
      <span className={`text-gray-400 uppercase tracking-wide ${classes.label}`}>{label}</span>
      <AnimatedNumber
        value={value}
        formatter={formatter}
        duration={duration}
        className={`text-white tabular-nums ${classes.value}`}
        animate={animate}
      />
    </div>
  );
};

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  className = "",
  size = "normal",
  showLabels = true,
  animate = true,
  orientation = "vertical",
}) => {
  const { t } = useTranslation();
  const { score, level, lines } = useGameStore();

  const containerClasses = `
    ${
      orientation === "horizontal"
        ? "flex flex-row justify-around items-center"
        : "flex flex-col space-y-4"
    }
    p-4 rounded-lg
    bg-gray-800 border border-gray-600
    ${size === "compact" ? "p-3" : ""}
    ${size === "large" ? "p-6" : ""}
    ${className}
  `.trim();

  const levelUpVariants = {
    normal: {
      scale: 1,
      rotate: 0,
    },
    levelUp: {
      scale: [1, 1.3, 1],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: LEVEL_ANIMATION_DURATION / 1000,
        ease: "easeOut",
      },
    },
  };

  const scoreItems = [
    {
      label: showLabels ? t("game.score.title") : "",
      value: score,
      formatter: formatScore,
      duration: 600,
    },
    {
      label: showLabels ? t("game.score.level") : "",
      value: level,
      formatter: formatLevel,
      duration: LEVEL_ANIMATION_DURATION,
    },
    {
      label: showLabels ? t("game.score.lines") : "",
      value: lines,
      formatter: formatLines,
      duration: LINES_ANIMATION_DURATION,
    },
  ];

  return (
    <motion.div
      className={containerClasses}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      role="region"
      aria-label={t("game.score.scoreboard", "Score Information")}
    >
      {scoreItems.map((item, index) => (
        <motion.div
          key={item.label || index}
          variants={item.formatter === formatLevel ? levelUpVariants : undefined}
          animate="normal"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <ScoreItem
            label={item.label}
            value={item.value}
            formatter={item.formatter}
            size={size}
            animate={animate}
            duration={item.duration}
          />
        </motion.div>
      ))}

      {/* Level up celebration animation */}
      <AnimatePresence>
        {animate && (
          <motion.div
            key={level}
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 0 }} // Hidden by default, can be triggered by game events
            exit={{ opacity: 0, scale: 0, y: -20 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="text-yellow-400 text-2xl font-bold animate-pulse">
              {t("game.feedback.levelUp")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Responsive layout adjustment for mobile */}
      <style jsx>{`
        @media (max-width: 640px) {
          .tabular-nums {
            font-variant-numeric: tabular-nums;
            text-align: center;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default ScoreBoard;
