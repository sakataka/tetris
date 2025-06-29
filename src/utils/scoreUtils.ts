/**
 * Score formatting and calculation utilities for UI display
 * All functions are pure - they don't modify input parameters
 */

export interface HighScoreEntry {
  score: number;
  lines: number;
  level: number;
  date: string;
}

export type ScoreCategory =
  | "beginner"
  | "novice"
  | "intermediate"
  | "advanced"
  | "expert"
  | "master"
  | "legendary";

/**
 * Formats a score with thousands separators
 * @param score - Score to format
 * @returns Formatted score string with commas
 */
export function formatScore(score: number): string {
  return score.toLocaleString("en-US");
}

/**
 * Formats a number with locale-specific thousands separators
 * @param number - Number to format
 * @param locale - Locale string (default: "en-US")
 * @returns Formatted number string
 */
export function formatNumber(number: number, locale: string = "en-US"): string {
  return number.toLocaleString(locale);
}

/**
 * Formats a level with zero padding for consistent display
 * @param level - Level number
 * @returns Formatted level string with padding
 */
export function formatLevel(level: number): string {
  // Ensure level is at least 0
  const validLevel = Math.max(0, level);

  // Pad to 2 digits for levels < 100
  if (validLevel < 100) {
    return validLevel.toString().padStart(2, "0");
  }

  return validLevel.toString();
}

/**
 * Formats lines cleared count
 * @param lines - Number of lines cleared
 * @returns Formatted lines string
 */
export function formatLines(lines: number): string {
  return formatNumber(lines);
}

/**
 * Calculates the rank of a score among existing high scores
 * @param score - Score to rank
 * @param existingScores - Array of existing high score entries
 * @returns Rank (1-based) of the score
 */
export function calculateScoreRank(score: number, existingScores: HighScoreEntry[]): number {
  if (existingScores.length === 0) {
    return 1;
  }

  const higherScores = existingScores.filter((entry) => entry.score > score);
  return higherScores.length + 1;
}

/**
 * Calculates intermediate animation value for score transitions
 * @param startScore - Starting score
 * @param endScore - Ending score
 * @param progress - Animation progress (0-1)
 * @returns Intermediate score value
 */
export function getScoreAnimationValue(
  startScore: number,
  endScore: number,
  progress: number
): number {
  // Clamp progress between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));

  // Linear interpolation
  return Math.round(startScore + (endScore - startScore) * clampedProgress);
}

/**
 * Formats duration in milliseconds to MM:SS format
 * @param durationMs - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Formats a decimal value as a percentage
 * @param value - Decimal value (0.5 = 50%)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  const percentage = value * 100;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Checks if a score is a new high score
 * @param score - Score to check
 * @param existingScores - Array of existing high score entries
 * @returns True if score is higher than all existing scores
 */
export function isNewHighScore(score: number, existingScores: HighScoreEntry[]): boolean {
  if (existingScores.length === 0) {
    return true;
  }

  const highestScore = Math.max(...existingScores.map((entry) => entry.score));
  return score > highestScore;
}

/**
 * Categorizes a score into skill levels
 * @param score - Score to categorize
 * @returns Score category
 */
export function getScoreCategory(score: number): ScoreCategory {
  if (score < 0) return "beginner";
  if (score < 5000) return "beginner";
  if (score < 15000) return "novice";
  if (score < 35000) return "intermediate";
  if (score < 75000) return "advanced";
  if (score < 150000) return "expert";
  if (score < 400000) return "master";
  return "legendary";
}

// Animation timing utilities
export const SCORE_ANIMATION_DURATION = 500; // milliseconds
export const LEVEL_ANIMATION_DURATION = 800; // milliseconds
export const LINES_ANIMATION_DURATION = 300; // milliseconds

/**
 * Gets animation timing for score changes based on magnitude
 * @param scoreDifference - Absolute difference in score
 * @returns Animation duration in milliseconds
 */
export function getScoreAnimationDuration(scoreDifference: number): number {
  const baseDuration = SCORE_ANIMATION_DURATION;

  // Longer animation for larger score changes
  if (scoreDifference > 1000) return baseDuration * 1.5;
  if (scoreDifference > 100) return baseDuration * 1.2;

  return baseDuration;
}

/**
 * Utility function to format scores for display in different contexts
 * @param score - Score to format
 * @param context - Display context
 * @returns Formatted score appropriate for context
 */
export function formatScoreForContext(
  score: number,
  context: "compact" | "full" | "leaderboard"
): string {
  switch (context) {
    case "compact":
      // For small displays, use K/M notation for large numbers
      if (score >= 1000000) {
        return `${(score / 1000000).toFixed(1)}M`;
      }
      if (score >= 1000) {
        return `${(score / 1000).toFixed(1)}K`;
      }
      return score.toString();

    case "leaderboard":
      // Right-aligned with consistent width
      return formatScore(score).padStart(12);

    default:
      return formatScore(score);
  }
}

/**
 * Sorts high score entries in descending order by score
 * @param scores - Array of high score entries to sort
 * @returns New array sorted by score (highest first)
 */
export function sortHighScores(scores: HighScoreEntry[]): HighScoreEntry[] {
  // Create shallow copy to avoid mutating original array
  return [...scores].sort((a, b) => {
    // Sort by score in descending order (highest first)
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    // For tie scores, maintain stable sort order (preserve original order)
    return 0;
  });
}

/**
 * Formats a date string for display in high score lists
 * @param dateString - ISO date string or date-like string
 * @param locale - Locale for formatting (default: "en-US")
 * @param options - Date formatting options
 * @returns Formatted date string
 */
export function formatScoreDate(
  dateString: string,
  locale: string = "en-US",
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
): string {
  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (Number.isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return date.toLocaleDateString(locale, options);
  } catch (_error) {
    return "Invalid Date";
  }
}

/**
 * Truncates high score list to top 10 entries, sorting by score first
 * @param scores - Array of high score entries
 * @returns Array containing top 10 highest scores
 */
export function truncateHighScoreList(scores: HighScoreEntry[]): HighScoreEntry[] {
  // First sort the scores to ensure we get the top scores
  const sortedScores = sortHighScores(scores);

  // Return only the top 10 entries
  return sortedScores.slice(0, 10);
}
