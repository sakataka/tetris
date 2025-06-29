import { describe, expect, test } from "bun:test";
import {
  calculateScoreRank,
  formatDuration,
  formatLevel,
  formatLines,
  formatNumber,
  formatPercentage,
  formatScore,
  formatScoreDate,
  getScoreAnimationValue,
  getScoreCategory,
  isNewHighScore,
  sortHighScores,
  truncateHighScoreList,
} from "./scoreUtils";

describe("formatScore", () => {
  test("formats score with commas for thousands", () => {
    expect(formatScore(1000)).toBe("1,000");
    expect(formatScore(12345)).toBe("12,345");
    expect(formatScore(1234567)).toBe("1,234,567");
  });

  test("handles zero and small numbers", () => {
    expect(formatScore(0)).toBe("0");
    expect(formatScore(42)).toBe("42");
    expect(formatScore(999)).toBe("999");
  });

  test("handles negative numbers", () => {
    expect(formatScore(-1000)).toBe("-1,000");
    expect(formatScore(-42)).toBe("-42");
  });

  test("handles very large numbers", () => {
    expect(formatScore(999999999)).toBe("999,999,999");
    expect(formatScore(1000000000)).toBe("1,000,000,000");
  });
});

describe("formatNumber", () => {
  test("formats numbers with commas", () => {
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  test("supports custom locale", () => {
    expect(formatNumber(1234567, "en-US")).toBe("1,234,567");
    expect(formatNumber(1234567, "de-DE")).toBe("1.234.567");
  });

  test("handles edge cases", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(NaN)).toBe("NaN");
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe("∞");
  });
});

describe("formatLevel", () => {
  test("formats level with proper padding", () => {
    expect(formatLevel(1)).toBe("01");
    expect(formatLevel(9)).toBe("09");
    expect(formatLevel(10)).toBe("10");
    expect(formatLevel(99)).toBe("99");
  });

  test("handles levels above 99", () => {
    expect(formatLevel(100)).toBe("100");
    expect(formatLevel(999)).toBe("999");
  });

  test("handles invalid levels", () => {
    expect(formatLevel(0)).toBe("00");
    expect(formatLevel(-1)).toBe("00");
  });
});

describe("formatLines", () => {
  test("formats lines cleared with proper display", () => {
    expect(formatLines(0)).toBe("0");
    expect(formatLines(42)).toBe("42");
    expect(formatLines(1000)).toBe("1,000");
  });

  test("handles large line counts", () => {
    expect(formatLines(9999)).toBe("9,999");
    expect(formatLines(100000)).toBe("100,000");
  });
});

describe("calculateScoreRank", () => {
  const sampleScores = [
    { score: 100000, lines: 100, level: 10, date: "2024-01-01" },
    { score: 80000, lines: 80, level: 8, date: "2024-01-02" },
    { score: 60000, lines: 60, level: 6, date: "2024-01-03" },
    { score: 40000, lines: 40, level: 4, date: "2024-01-04" },
    { score: 20000, lines: 20, level: 2, date: "2024-01-05" },
  ];

  test("calculates correct rank for existing scores", () => {
    expect(calculateScoreRank(100000, sampleScores)).toBe(1);
    expect(calculateScoreRank(80000, sampleScores)).toBe(2);
    expect(calculateScoreRank(20000, sampleScores)).toBe(5);
  });

  test("calculates correct rank for new high score", () => {
    expect(calculateScoreRank(150000, sampleScores)).toBe(1);
    expect(calculateScoreRank(90000, sampleScores)).toBe(2);
    expect(calculateScoreRank(70000, sampleScores)).toBe(3);
  });

  test("calculates correct rank for new low score", () => {
    expect(calculateScoreRank(10000, sampleScores)).toBe(6);
    expect(calculateScoreRank(0, sampleScores)).toBe(6);
  });

  test("handles empty score list", () => {
    expect(calculateScoreRank(50000, [])).toBe(1);
  });

  test("handles tie scores (returns highest rank)", () => {
    const tieScores = [
      { score: 100000, lines: 100, level: 10, date: "2024-01-01" },
      { score: 100000, lines: 100, level: 10, date: "2024-01-02" },
    ];
    expect(calculateScoreRank(100000, tieScores)).toBe(1);
  });
});

describe("getScoreAnimationValue", () => {
  test("calculates intermediate animation values", () => {
    expect(getScoreAnimationValue(0, 1000, 0)).toBe(0);
    expect(getScoreAnimationValue(0, 1000, 1)).toBe(1000);
    expect(getScoreAnimationValue(0, 1000, 0.5)).toBe(500);
    expect(getScoreAnimationValue(0, 1000, 0.25)).toBe(250);
  });

  test("handles negative score changes", () => {
    expect(getScoreAnimationValue(1000, 0, 0.5)).toBe(500);
    expect(getScoreAnimationValue(1000, 500, 0.5)).toBe(750);
  });

  test("handles edge cases", () => {
    expect(getScoreAnimationValue(100, 100, 0.5)).toBe(100);
    expect(getScoreAnimationValue(0, 0, 0.5)).toBe(0);
  });

  test("clamps progress between 0 and 1", () => {
    expect(getScoreAnimationValue(0, 1000, -0.1)).toBe(0);
    expect(getScoreAnimationValue(0, 1000, 1.1)).toBe(1000);
  });
});

describe("formatDuration", () => {
  test("formats duration in seconds", () => {
    expect(formatDuration(30000)).toBe("0:30");
    expect(formatDuration(90000)).toBe("1:30");
    expect(formatDuration(3661000)).toBe("61:01");
  });

  test("formats hours when duration is very long", () => {
    expect(formatDuration(3600000)).toBe("60:00"); // 1 hour shows as 60:00
    expect(formatDuration(7200000)).toBe("120:00"); // 2 hours shows as 120:00
  });

  test("handles zero and small durations", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(1000)).toBe("0:01");
    expect(formatDuration(9000)).toBe("0:09");
  });
});

describe("formatPercentage", () => {
  test("formats percentage with specified decimal places", () => {
    expect(formatPercentage(0.5)).toBe("50.0%");
    expect(formatPercentage(0.1234, 2)).toBe("12.34%");
    expect(formatPercentage(0.999, 1)).toBe("99.9%");
  });

  test("handles edge cases", () => {
    expect(formatPercentage(0)).toBe("0.0%");
    expect(formatPercentage(1)).toBe("100.0%");
    expect(formatPercentage(1.5)).toBe("150.0%");
  });

  test("handles invalid values", () => {
    expect(formatPercentage(NaN)).toBe("NaN%");
    expect(formatPercentage(Number.POSITIVE_INFINITY)).toBe("Infinity%");
  });
});

describe("isNewHighScore", () => {
  const existingScores = [
    { score: 100000, lines: 100, level: 10, date: "2024-01-01" },
    { score: 80000, lines: 80, level: 8, date: "2024-01-02" },
    { score: 60000, lines: 60, level: 6, date: "2024-01-03" },
  ];

  test("identifies new high scores", () => {
    expect(isNewHighScore(150000, existingScores)).toBe(true);
    expect(isNewHighScore(100001, existingScores)).toBe(true);
  });

  test("identifies non-high scores", () => {
    expect(isNewHighScore(100000, existingScores)).toBe(false);
    expect(isNewHighScore(50000, existingScores)).toBe(false);
    expect(isNewHighScore(0, existingScores)).toBe(false);
  });

  test("handles empty score list", () => {
    expect(isNewHighScore(1000, [])).toBe(true);
    expect(isNewHighScore(0, [])).toBe(true);
  });
});

describe("getScoreCategory", () => {
  test("categorizes scores correctly", () => {
    expect(getScoreCategory(0)).toBe("beginner");
    expect(getScoreCategory(5000)).toBe("novice");
    expect(getScoreCategory(15000)).toBe("intermediate");
    expect(getScoreCategory(35000)).toBe("advanced");
    expect(getScoreCategory(75000)).toBe("expert");
    expect(getScoreCategory(150000)).toBe("master");
    expect(getScoreCategory(500000)).toBe("legendary");
  });

  test("handles edge cases", () => {
    expect(getScoreCategory(-100)).toBe("beginner");
    expect(getScoreCategory(Number.MAX_SAFE_INTEGER)).toBe("legendary");
  });
});

describe("sortHighScores", () => {
  const unsortedScores = [
    { score: 60000, lines: 60, level: 6, date: "2024-01-03" },
    { score: 100000, lines: 100, level: 10, date: "2024-01-01" },
    { score: 40000, lines: 40, level: 4, date: "2024-01-04" },
    { score: 80000, lines: 80, level: 8, date: "2024-01-02" },
    { score: 20000, lines: 20, level: 2, date: "2024-01-05" },
  ];

  test("sorts scores in descending order by score", () => {
    const sorted = sortHighScores(unsortedScores);
    expect(sorted[0].score).toBe(100000);
    expect(sorted[1].score).toBe(80000);
    expect(sorted[2].score).toBe(60000);
    expect(sorted[3].score).toBe(40000);
    expect(sorted[4].score).toBe(20000);
  });

  test("handles tie scores by preserving original order", () => {
    const tieScores = [
      { score: 100000, lines: 100, level: 10, date: "2024-01-01" },
      { score: 50000, lines: 50, level: 5, date: "2024-01-02" },
      { score: 100000, lines: 120, level: 12, date: "2024-01-03" },
    ];
    const sorted = sortHighScores(tieScores);
    expect(sorted[0].date).toBe("2024-01-01");
    expect(sorted[1].date).toBe("2024-01-03");
    expect(sorted[2].date).toBe("2024-01-02");
  });

  test("handles empty array", () => {
    const sorted = sortHighScores([]);
    expect(sorted).toEqual([]);
  });

  test("handles single entry", () => {
    const singleEntry = [{ score: 50000, lines: 50, level: 5, date: "2024-01-01" }];
    const sorted = sortHighScores(singleEntry);
    expect(sorted).toEqual(singleEntry);
  });

  test("does not mutate original array", () => {
    const original = [...unsortedScores];
    sortHighScores(unsortedScores);
    expect(unsortedScores).toEqual(original);
  });
});

describe("formatScoreDate", () => {
  test("formats ISO date string to readable format", () => {
    expect(formatScoreDate("2024-01-15")).toBe("Jan 15, 2024");
    expect(formatScoreDate("2024-12-25")).toBe("Dec 25, 2024");
    expect(formatScoreDate("2024-06-01")).toBe("Jun 1, 2024");
  });

  test("formats full ISO datetime string", () => {
    expect(formatScoreDate("2024-01-15T10:30:00Z")).toBe("Jan 15, 2024");
    expect(formatScoreDate("2024-12-25T23:59:59.999Z")).toBe("Dec 25, 2024");
  });

  test("handles different locale formats", () => {
    expect(formatScoreDate("2024-01-15", "ja-JP")).toBe("2024年1月15日");
    expect(formatScoreDate("2024-01-15", "de-DE")).toBe("15. Jan. 2024");
  });

  test("handles edge cases", () => {
    // Test current date format
    const today = new Date().toISOString().split("T")[0];
    const formatted = formatScoreDate(today);
    expect(formatted).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4}$/);
  });

  test("handles invalid date strings gracefully", () => {
    expect(formatScoreDate("invalid-date")).toBe("Invalid Date");
    expect(formatScoreDate("")).toBe("Invalid Date");
    expect(formatScoreDate("2024-13-40")).toBe("Invalid Date");
  });

  test("formats with custom date options", () => {
    const options = { year: "numeric", month: "short", day: "numeric" } as const;
    expect(formatScoreDate("2024-01-15", "en-US", options)).toBe("Jan 15, 2024");
  });
});

describe("truncateHighScoreList", () => {
  const longScoreList = [
    { score: 100000, lines: 100, level: 10, date: "2024-01-01" },
    { score: 90000, lines: 90, level: 9, date: "2024-01-02" },
    { score: 80000, lines: 80, level: 8, date: "2024-01-03" },
    { score: 70000, lines: 70, level: 7, date: "2024-01-04" },
    { score: 60000, lines: 60, level: 6, date: "2024-01-05" },
    { score: 50000, lines: 50, level: 5, date: "2024-01-06" },
    { score: 40000, lines: 40, level: 4, date: "2024-01-07" },
    { score: 30000, lines: 30, level: 3, date: "2024-01-08" },
    { score: 20000, lines: 20, level: 2, date: "2024-01-09" },
    { score: 10000, lines: 10, level: 1, date: "2024-01-10" },
    { score: 9000, lines: 9, level: 1, date: "2024-01-11" },
    { score: 8000, lines: 8, level: 1, date: "2024-01-12" },
    { score: 7000, lines: 7, level: 1, date: "2024-01-13" },
  ];

  test("truncates list to maximum 10 entries", () => {
    const truncated = truncateHighScoreList(longScoreList);
    expect(truncated).toHaveLength(10);
  });

  test("keeps top 10 highest scores", () => {
    const truncated = truncateHighScoreList(longScoreList);
    expect(truncated[0].score).toBe(100000);
    expect(truncated[9].score).toBe(10000);

    // Ensure lower scores are removed
    expect(truncated.some((entry) => entry.score === 9000)).toBe(false);
    expect(truncated.some((entry) => entry.score === 8000)).toBe(false);
  });

  test("handles list shorter than 10 entries", () => {
    const shortList = longScoreList.slice(0, 5);
    const truncated = truncateHighScoreList(shortList);
    expect(truncated).toHaveLength(5);
    expect(truncated).toEqual(shortList);
  });

  test("handles empty list", () => {
    const truncated = truncateHighScoreList([]);
    expect(truncated).toEqual([]);
  });

  test("handles exactly 10 entries", () => {
    const exactList = longScoreList.slice(0, 10);
    const truncated = truncateHighScoreList(exactList);
    expect(truncated).toHaveLength(10);
    expect(truncated).toEqual(exactList);
  });

  test("does not mutate original array", () => {
    const original = [...longScoreList];
    truncateHighScoreList(longScoreList);
    expect(longScoreList).toEqual(original);
  });

  test("handles unsorted input by sorting first", () => {
    const unsortedList = [
      { score: 50000, lines: 50, level: 5, date: "2024-01-01" },
      { score: 100000, lines: 100, level: 10, date: "2024-01-02" },
      { score: 75000, lines: 75, level: 7, date: "2024-01-03" },
    ];
    const truncated = truncateHighScoreList(unsortedList);
    expect(truncated[0].score).toBe(100000);
    expect(truncated[1].score).toBe(75000);
    expect(truncated[2].score).toBe(50000);
  });
});
