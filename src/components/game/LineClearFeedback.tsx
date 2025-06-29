import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGameStore } from "@/store/gameStore";
import { getLineClearFeedback } from "@/utils/lineClearAnimations";

export interface LineClearFeedbackProps {
  className?: string;
  position?: "overlay" | "sidebar" | "inline";
}

interface FeedbackDisplayProps {
  message: string;
  lineClearCount: number;
  onComplete: () => void;
  position: "overlay" | "sidebar" | "inline";
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({
  message,
  lineClearCount,
  onComplete,
  position,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000); // Show feedback for 2 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  const getBackgroundGradient = (count: number) => {
    switch (count) {
      case 1:
        return "from-blue-500 to-blue-600";
      case 2:
        return "from-green-500 to-green-600";
      case 3:
        return "from-yellow-500 to-yellow-600";
      case 4:
        return "from-purple-500 via-pink-500 to-red-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getTextSizeClasses = (count: number) => {
    switch (count) {
      case 1:
        return "text-lg";
      case 2:
        return "text-xl";
      case 3:
        return "text-2xl";
      case 4:
        return "text-3xl md:text-4xl";
      default:
        return "text-lg";
    }
  };

  const getAnimationVariants = () => {
    const isOverlay = position === "overlay";
    const isTetris = lineClearCount === 4;

    return {
      initial: {
        opacity: 0,
        scale: 0.5,
        y: isOverlay ? 50 : 20,
        rotateZ: 0,
      },
      animate: {
        opacity: 1,
        scale: isTetris ? [0.5, 1.2, 1] : [0.5, 1.1, 1],
        y: 0,
        rotateZ: isTetris ? [0, 10, -10, 0] : 0,
        transition: {
          duration: isTetris ? 0.8 : 0.5,
          ease: "easeOut",
          times: isTetris ? [0, 0.4, 0.7, 1] : [0, 0.6, 1],
        },
      },
      exit: {
        opacity: 0,
        scale: 0.8,
        y: isOverlay ? -30 : -10,
        transition: {
          duration: 0.3,
          ease: "easeIn",
        },
      },
    };
  };

  const containerClasses = {
    overlay: `
      fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
      z-40 pointer-events-none
      flex items-center justify-center
    `,
    sidebar: `
      flex items-center justify-center
      my-2 mx-auto
    `,
    inline: `
      flex items-center justify-center
      my-1
    `,
  };

  const textClasses = `
    font-bold tracking-wide
    bg-gradient-to-r ${getBackgroundGradient(lineClearCount)}
    bg-clip-text text-transparent
    ${getTextSizeClasses(lineClearCount)}
    text-center
    drop-shadow-lg
  `.trim();

  return (
    <motion.div
      className={containerClasses[position]}
      variants={getAnimationVariants()}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div
        className={`
          bg-black bg-opacity-75 backdrop-blur-sm
          rounded-lg px-4 py-2
          border border-white border-opacity-20
          shadow-2xl
          ${position === "overlay" ? "min-w-[200px]" : ""}
        `.trim()}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <div className={textClasses}>{t(message)}</div>

        {/* Special effects for Tetris (4 lines) */}
        {lineClearCount === 4 && (
          <>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-lg opacity-20"
              animate={{
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute -inset-2 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 rounded-lg opacity-10 blur"
              animate={{
                opacity: [0.05, 0.15, 0.05],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          </>
        )}

        {/* Particle effects for multi-line clears */}
        {lineClearCount >= 2 && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: lineClearCount * 2 }, (_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full opacity-70"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [-20, 20],
                  x: [(-1) ** i * 10, (-1) ** (i + 1) * 10],
                  opacity: [0.7, 0],
                  scale: [1, 0],
                }}
                transition={{
                  duration: 1 + Math.random() * 0.5,
                  delay: Math.random() * 0.5,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export const LineClearFeedback: React.FC<LineClearFeedbackProps> = ({
  className = "",
  position = "overlay",
}) => {
  const { lineClearAnimation } = useGameStore();
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<{
    message: string;
    count: number;
  } | null>(null);

  // Monitor line clear animation state
  useEffect(() => {
    if (
      lineClearAnimation &&
      lineClearAnimation.animationPhase === "flash" &&
      lineClearAnimation.feedbackMessage &&
      !showFeedback
    ) {
      setFeedbackData({
        message: lineClearAnimation.feedbackMessage,
        count: lineClearAnimation.lineClearCount,
      });
      setShowFeedback(true);
    }
  }, [lineClearAnimation, showFeedback]);

  const handleFeedbackComplete = () => {
    setShowFeedback(false);
    setFeedbackData(null);
  };

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {showFeedback && feedbackData && (
          <FeedbackDisplay
            key={`feedback-${feedbackData.count}-${Date.now()}`}
            message={feedbackData.message}
            lineClearCount={feedbackData.count}
            onComplete={handleFeedbackComplete}
            position={position}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LineClearFeedback;
