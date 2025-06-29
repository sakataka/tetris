import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "@/store/settingsStore";

interface GameSettingsProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

/**
 * Game settings dropdown/modal component
 * Features:
 * - Language switching interface (English/Japanese)
 * - Ghost piece visibility toggle
 * - Settings persistence via store
 * - Proper focus management and accessibility
 * - Responsive positioning
 */
export const GameSettings: React.FC<GameSettingsProps> = ({
  className = "",
  isOpen = false,
  onClose,
  position = "top-right",
}) => {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(isOpen);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Settings store
  const { language, showGhostPiece, setLanguage, toggleGhostPiece } = useSettingsStore();

  // Handle external control of dropdown state
  useEffect(() => {
    setIsDropdownOpen(isOpen);
  }, [isOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Handle escape key to close dropdown
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isDropdownOpen) {
        handleClose();
        // Return focus to settings button
        buttonRef.current?.focus();
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      return () => document.removeEventListener("keydown", handleEscapeKey);
    }
  }, [isDropdownOpen]);

  const handleToggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleClose = () => {
    setIsDropdownOpen(false);
    onClose?.();
  };

  const handleLanguageChange = (newLanguage: "en" | "ja") => {
    setLanguage(newLanguage);
    // Focus remains on the language option for better UX
  };

  const handleGhostPieceToggle = () => {
    toggleGhostPiece();
  };

  // Position classes for dropdown
  const positionClasses = {
    "top-right": "right-0 top-full mt-2",
    "top-left": "left-0 top-full mt-2",
    "bottom-right": "right-0 bottom-full mb-2",
    "bottom-left": "left-0 bottom-full mb-2",
  };

  return (
    <div className={`relative ${className}`}>
      {/* Settings button */}
      <motion.button
        ref={buttonRef}
        type="button"
        onClick={handleToggleDropdown}
        className="flex items-center justify-center p-2 bg-gray-700 rounded-lg shadow-md min-w-[44px] min-h-[44px]"
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
        aria-label={t("settings.title")}
        whileHover={{
          backgroundColor: "rgb(75, 85, 99)", // gray-600
          scale: 1.05,
          transition: { duration: 0.2 },
        }}
        whileTap={{
          scale: 0.95,
          transition: { duration: 0.1 },
        }}
        animate={{
          rotate: isDropdownOpen ? 180 : 0,
          transition: { duration: 0.3, ease: "easeInOut" },
        }}
      >
        {/* Settings icon */}
        <svg
          className="w-5 h-5 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </motion.button>

      {/* Settings dropdown */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            ref={dropdownRef}
            className={`absolute z-50 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl ${positionClasses[position]}`}
            role="menu"
            aria-labelledby="settings-button"
            initial={{
              opacity: 0,
              scale: 0.95,
              y: position.includes("top") ? -10 : 10,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: position.includes("top") ? -10 : 10,
            }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{t("settings.title")}</h3>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1 hover:bg-gray-700 rounded transition-colors duration-200"
                  aria-label={t("settings.close")}
                >
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Settings content */}
            <div className="p-4 space-y-4">
              {/* Language setting */}
              <div role="group" aria-labelledby="language-setting">
                <label
                  id="language-setting"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  {t("settings.language")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    type="button"
                    onClick={() => handleLanguageChange("en")}
                    className={`p-2 text-sm rounded-lg border min-h-[44px] ${
                      language === "en"
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-gray-700 border-gray-600 text-gray-300"
                    }`}
                    aria-pressed={language === "en"}
                    role="button"
                    whileHover={
                      language !== "en"
                        ? {
                            backgroundColor: "rgb(75, 85, 99)", // gray-600
                            scale: 1.02,
                            transition: { duration: 0.2 },
                          }
                        : {}
                    }
                    whileTap={{
                      scale: 0.98,
                      transition: { duration: 0.1 },
                    }}
                  >
                    {t("languages.en")}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => handleLanguageChange("ja")}
                    className={`p-2 text-sm rounded-lg border min-h-[44px] ${
                      language === "ja"
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-gray-700 border-gray-600 text-gray-300"
                    }`}
                    aria-pressed={language === "ja"}
                    role="button"
                    whileHover={
                      language !== "ja"
                        ? {
                            backgroundColor: "rgb(75, 85, 99)", // gray-600
                            scale: 1.02,
                            transition: { duration: 0.2 },
                          }
                        : {}
                    }
                    whileTap={{
                      scale: 0.98,
                      transition: { duration: 0.1 },
                    }}
                  >
                    {t("languages.ja")}
                  </motion.button>
                </div>
              </div>

              {/* Ghost piece setting */}
              <div role="group" aria-labelledby="ghost-piece-setting">
                <div className="flex items-center justify-between">
                  <label
                    id="ghost-piece-setting"
                    className="text-sm font-medium text-gray-300"
                    htmlFor="ghost-piece-toggle"
                  >
                    {t("settings.showGhostPiece")}
                  </label>
                  <motion.button
                    id="ghost-piece-toggle"
                    type="button"
                    onClick={handleGhostPieceToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                      showGhostPiece ? "bg-blue-600" : "bg-gray-600"
                    }`}
                    role="switch"
                    aria-checked={showGhostPiece}
                    aria-describedby="ghost-piece-description"
                    whileHover={{
                      scale: 1.05,
                      transition: { duration: 0.2 },
                    }}
                    whileTap={{
                      scale: 0.95,
                      transition: { duration: 0.1 },
                    }}
                    animate={{
                      backgroundColor: showGhostPiece ? "rgb(37, 99, 235)" : "rgb(75, 85, 99)", // blue-600 : gray-600
                      transition: { duration: 0.3, ease: "easeInOut" },
                    }}
                  >
                    <motion.span
                      className="inline-block h-4 w-4 rounded-full bg-white"
                      animate={{
                        x: showGhostPiece ? 24 : 4, // translate-x-6 : translate-x-1
                        transition: { duration: 0.3, ease: "easeInOut" },
                      }}
                    />
                  </motion.button>
                </div>
                <p id="ghost-piece-description" className="text-xs text-gray-400 mt-1">
                  {showGhostPiece
                    ? t("settings.ghostPiece.enabled")
                    : t("settings.ghostPiece.disabled")}
                </p>
              </div>
            </div>

            {/* Footer with current settings info */}
            <div className="p-3 bg-gray-750 rounded-b-lg border-t border-gray-600">
              <p className="text-xs text-gray-400 text-center">
                {t("settings.currentLanguage")}: {t(`languages.${language}`)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
