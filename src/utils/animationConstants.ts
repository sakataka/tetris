/**
 * Animation constants for consistent transitions throughout the application
 *
 * These constants ensure unified timing and easing across all components,
 * providing a cohesive user experience and maintaining performance.
 */

// Common animation durations (in seconds)
export const ANIMATION_DURATIONS = {
  // Page transitions
  PAGE_ENTER: 0.5,
  PAGE_EXIT: 0.3,

  // Modal and overlay animations
  MODAL_ENTER: 0.2,
  MODAL_EXIT: 0.15,
  OVERLAY_BACKDROP: 0.2,

  // Interactive element animations
  HOVER: 0.2,
  TAP: 0.1,
  BUTTON_PRESS: 0.1,

  // UI feedback animations
  NOTIFICATION: 0.3,
  TOOLTIP: 0.15,
  DROPDOWN: 0.2,

  // Game-specific animations
  PIECE_PLACEMENT: 0.15,
  LINE_CLEAR: 0.3,
  SCORE_UPDATE: 0.4,
  LEVEL_UP: 0.6,

  // Loading states
  SKELETON: 1.5,
  SPINNER: 1.0,
  PULSE: 2.0,
} as const;

// Common easing functions
export const ANIMATION_EASINGS = {
  // Page transitions
  PAGE: "easeOut",

  // Interactive elements
  INTERACTIVE: "easeInOut",

  // UI feedback
  BOUNCE: "easeOut",
  SMOOTH: "easeInOut",

  // Game animations
  PIECE_DROP: "easeIn",
  SCORE_POP: "easeOut",

  // Spring physics settings
  SPRING_GENTLE: { type: "spring", stiffness: 200, damping: 20 },
  SPRING_BOUNCY: { type: "spring", stiffness: 300, damping: 15 },
  SPRING_TIGHT: { type: "spring", stiffness: 400, damping: 25 },
} as const;

// Common animation variants for Framer Motion
export const ANIMATION_VARIANTS = {
  // Page transitions
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },

  // Modal animations
  modalBackdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  modalContent: {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
  },

  // Dropdown animations
  dropdown: {
    initial: { opacity: 0, scale: 0.95, y: -10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -10 },
  },

  // Stagger children animations
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  },

  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },

  // Loading animations
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: ANIMATION_DURATIONS.PULSE,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },

  // Game-specific animations
  scoreIncrease: {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.2, 1],
      color: ["#ffffff", "#fbbf24", "#ffffff"], // white -> amber -> white
    },
  },

  levelUp: {
    initial: { scale: 1, rotate: 0 },
    animate: {
      scale: [1, 1.3, 1],
      rotate: [0, 5, -5, 0],
      color: ["#ffffff", "#10b981", "#ffffff"], // white -> green -> white
    },
  },
} as const;

// Hover animations for interactive elements
export const HOVER_ANIMATIONS = {
  // Buttons
  button: {
    whileHover: {
      scale: 1.05,
      transition: { duration: ANIMATION_DURATIONS.HOVER },
    },
    whileTap: {
      scale: 0.95,
      transition: { duration: ANIMATION_DURATIONS.TAP },
    },
  },

  // Cards and sections
  card: {
    whileHover: {
      scale: 1.02,
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
      transition: { duration: ANIMATION_DURATIONS.HOVER },
    },
  },

  // Icons
  icon: {
    whileHover: {
      scale: 1.1,
      rotate: 5,
      transition: { duration: ANIMATION_DURATIONS.HOVER },
    },
  },

  // Toggle switches
  toggle: {
    whileHover: {
      scale: 1.05,
      transition: { duration: ANIMATION_DURATIONS.HOVER },
    },
    whileTap: {
      scale: 0.95,
      transition: { duration: ANIMATION_DURATIONS.TAP },
    },
  },
} as const;

// Animation configurations for different states
export const STATE_ANIMATIONS = {
  // Loading states
  loading: {
    opacity: 0.6,
    scale: 0.98,
    transition: { duration: ANIMATION_DURATIONS.NOTIFICATION },
  },

  // Success states
  success: {
    scale: [1, 1.1, 1],
    transition: {
      duration: ANIMATION_DURATIONS.NOTIFICATION,
      ease: ANIMATION_EASINGS.BOUNCE,
    },
  },

  // Error states
  error: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: ANIMATION_DURATIONS.NOTIFICATION,
      ease: ANIMATION_EASINGS.INTERACTIVE,
    },
  },

  // Disabled states
  disabled: {
    opacity: 0.4,
    scale: 0.95,
    transition: { duration: ANIMATION_DURATIONS.HOVER },
  },
} as const;

// Mobile-specific animation adjustments
export const MOBILE_ANIMATIONS = {
  // Reduce animation duration for mobile performance
  durationMultiplier: 0.8,

  // Simpler hover effects for touch devices
  touchFeedback: {
    scale: 0.95,
    transition: { duration: ANIMATION_DURATIONS.TAP },
  },

  // Page transitions optimized for mobile
  mobilePageTransition: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
} as const;

// Accessibility preferences
export const ACCESSIBILITY_ANIMATIONS = {
  // Reduced motion for users who prefer it
  reducedMotion: {
    transition: { duration: 0 },
  },

  // High contrast mode adjustments
  highContrast: {
    // Remove subtle shadows and effects
    boxShadow: "none",
    filter: "none",
  },
} as const;

// Performance optimization settings
export const PERFORMANCE_SETTINGS = {
  // Use GPU-accelerated properties
  gpuOptimized: {
    willChange: "transform, opacity",
    backfaceVisibility: "hidden" as const,
    perspective: 1000,
  },

  // Batch animations for better performance
  batchUpdates: true,

  // Throttle animations on low-end devices
  throttleOnLowEnd: true,
} as const;
