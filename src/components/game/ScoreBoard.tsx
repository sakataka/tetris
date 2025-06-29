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
    initial: {
      scale: 1,
      color: "inherit",
      textShadow: "0 0 0px rgba(255, 255, 255, 0)",
      filter: "brightness(1)",
    },
    changed: {
      scale: [1, 1.3, 1.1, 1],
      color: ["inherit", "#10b981", "#fbbf24", "inherit"], // Green -> Yellow -> White
      textShadow: [
        "0 0 0px rgba(255, 255, 255, 0)",
        "0 0 15px rgba(16, 185, 129, 0.8)",
        "0 0 10px rgba(251, 191, 36, 0.6)",
        "0 0 0px rgba(255, 255, 255, 0)",
      ],
      filter: ["brightness(1)", "brightness(1.5)", "brightness(1.3)", "brightness(1)"],
      transition: {
        duration: 0.5,
        ease: "easeOut",
        times: [0, 0.3, 0.7, 1],
      },
    },
    largeChange: {
      scale: [1, 1.5, 0.9, 1.2, 1],
      color: ["inherit", "#ef4444", "#f97316", "#10b981", "inherit"], // Red -> Orange -> Green -> White
      textShadow: [
        "0 0 0px rgba(255, 255, 255, 0)",
        "0 0 20px rgba(239, 68, 68, 1)",
        "0 0 18px rgba(249, 115, 22, 0.8)",
        "0 0 15px rgba(16, 185, 129, 0.6)",
        "0 0 0px rgba(255, 255, 255, 0)",
      ],
      filter: [
        "brightness(1)",
        "brightness(2)",
        "brightness(1.8)",
        "brightness(1.4)",
        "brightness(1)",
      ],
      y: [0, -8, 4, -2, 0],
      transition: {
        duration: 0.8,
        ease: "easeOut",
        times: [0, 0.2, 0.4, 0.7, 1],
      },
    },
  };

  // Determine animation type based on score difference
  const getAnimationType = () => {
    if (value === previousValue) return "initial";

    const difference = Math.abs(value - previousValue);

    // Large change for significant score increases (1000+ points)
    if (difference >= 1000) return "largeChange";

    // Regular change for smaller increases
    return "changed";
  };

  return (
    <motion.span
      key={`${value}-${previousValue}`}
      className={className}
      variants={scoreChangeVariants}
      initial="initial"
      animate={getAnimationType()}
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
      boxShadow: "0 0 0px rgba(251, 191, 36, 0)",
      filter: "brightness(1) saturate(1)",
    },
    levelUp: {
      scale: [1, 1.5, 0.9, 1.2, 1],
      rotate: [0, 10, -5, 3, 0],
      boxShadow: [
        "0 0 0px rgba(251, 191, 36, 0)",
        "0 0 30px rgba(251, 191, 36, 1)",
        "0 0 20px rgba(251, 191, 36, 0.7)",
        "0 0 15px rgba(251, 191, 36, 0.5)",
        "0 0 0px rgba(251, 191, 36, 0)",
      ],
      filter: [
        "brightness(1) saturate(1)",
        "brightness(2) saturate(1.5)",
        "brightness(1.7) saturate(1.3)",
        "brightness(1.4) saturate(1.1)",
        "brightness(1) saturate(1)",
      ],
      y: [0, -15, 8, -4, 0],
      transition: {
        duration: LEVEL_ANIMATION_DURATION / 1000,
        ease: "easeOut",
        times: [0, 0.2, 0.4, 0.7, 1],
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

      {/* Enhanced level up celebration animation */}
      <AnimatePresence>
        {animate && (
          <motion.div
            key={`level-celebration-${level}`}
            initial={{ opacity: 0, scale: 0.3, y: 30, rotate: -10 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.3, 1.2, 1, 0.8],
              y: [30, -10, -5, -30],
              rotate: [-10, 5, -3, 10],
              filter: [
                "brightness(1) blur(5px)",
                "brightness(2) blur(0px)",
                "brightness(1.5) blur(0px)",
                "brightness(1) blur(2px)",
              ],
            }}
            exit={{ opacity: 0, scale: 0, y: -50, rotate: 20 }}
            transition={{
              duration: 2,
              ease: "easeOut",
              times: [0, 0.3, 0.7, 1],
            }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <motion.div
              className="relative"
              animate={{
                textShadow: [
                  "0 0 10px rgba(251, 191, 36, 0.8)",
                  "0 0 20px rgba(251, 191, 36, 1)",
                  "0 0 15px rgba(251, 191, 36, 0.9)",
                  "0 0 5px rgba(251, 191, 36, 0.6)",
                ],
              }}
              transition={{
                duration: 2,
                ease: "easeInOut",
                times: [0, 0.3, 0.7, 1],
              }}
            >
              <div className="text-yellow-400 text-3xl font-black tracking-wider">
                {t("game.feedback.levelUp", "LEVEL UP!")}
              </div>
              {/* Sparkle effects */}
              <motion.div
                className="absolute -top-2 -right-2 text-yellow-300 text-xl"
                animate={{
                  rotate: [0, 360],
                  scale: [0.5, 1.2, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: 1,
                  ease: "easeInOut",
                }}
              >
                ✨
              </motion.div>
              <motion.div
                className="absolute -bottom-1 -left-2 text-yellow-300 text-lg"
                animate={{
                  rotate: [0, -360],
                  scale: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.8,
                  repeat: 1,
                  ease: "easeInOut",
                  delay: 0.2,
                }}
              >
                ⭐
              </motion.div>
            </motion.div>
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
