import type { TetrominoTypeName } from "@/types/game";

// Test-only state for deterministic testing
let testBag: TetrominoTypeName[] | null = null;

/**
 * Fisher-Yates shuffle algorithm for unbiased randomization
 * @param array Array to shuffle (will be modified in place)
 * @returns The shuffled array
 */
function fisherYatesShuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Creates a new piece bag containing all 7 tetromino types in random order
 * Uses the 7-bag system to ensure fair piece distribution
 * @returns Array of 7 randomized tetromino types
 */
export function createPieceBag(): TetrominoTypeName[] {
  // If we're in test mode, return the test bag
  if (testBag !== null) {
    return [...testBag];
  }

  // Create array with all 7 tetromino types
  const pieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];

  // Shuffle using Fisher-Yates algorithm for unbiased randomization
  return fisherYatesShuffle([...pieces]);
}

/**
 * Gets the next piece from the bag and returns the remaining bag
 * If the bag is empty, creates a new randomized bag
 * @param currentBag Current piece bag
 * @returns Tuple of [nextPiece, remainingBag]
 */
export function getNextPiece(
  currentBag: TetrominoTypeName[]
): [TetrominoTypeName, TetrominoTypeName[]] {
  // If bag is empty, create a new one
  if (currentBag.length === 0) {
    const newBag = createPieceBag();
    const nextPiece = newBag[0];
    const remainingBag = newBag.slice(1);
    return [nextPiece, remainingBag];
  }

  // Get first piece from current bag
  const nextPiece = currentBag[0];
  const remainingBag = currentBag.slice(1);

  return [nextPiece, remainingBag];
}

/**
 * Sets a fixed bag for testing purposes
 * Pass null to reset to normal random behavior
 * @param bag Test bag to use, or null to reset
 */
export function setBagForTesting(bag: TetrominoTypeName[] | null): void {
  testBag = bag ? [...bag] : null;
}

/**
 * Gets the current test bag contents (for testing only)
 * @returns Copy of the current test bag, or null if not in test mode
 */
export function getBagContents(): TetrominoTypeName[] | null {
  return testBag ? [...testBag] : null;
}

/**
 * Validates that a piece bag contains exactly one of each tetromino type
 * @param bag Bag to validate
 * @returns True if bag is valid, false otherwise
 */
export function isValidPieceBag(bag: TetrominoTypeName[]): boolean {
  if (bag.length !== 7) {
    return false;
  }

  const expectedPieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];
  const sortedBag = [...bag].sort();
  const sortedExpected = [...expectedPieces].sort();

  return sortedBag.every((piece, index) => piece === sortedExpected[index]);
}

/**
 * Creates multiple bags and returns statistics about piece distribution
 * Useful for testing and validation
 * @param numBags Number of bags to generate
 * @returns Statistics object with piece counts and distribution info
 */
export function analyzeBagDistribution(numBags: number): {
  pieceCounts: Record<TetrominoTypeName, number>;
  totalPieces: number;
  expectedCount: number;
  isDistributionFair: boolean;
} {
  const pieceCounts: Record<TetrominoTypeName, number> = {
    I: 0,
    O: 0,
    T: 0,
    S: 0,
    Z: 0,
    J: 0,
    L: 0,
  };

  // Generate bags and count pieces
  for (let i = 0; i < numBags; i++) {
    const bag = createPieceBag();
    for (const piece of bag) {
      pieceCounts[piece]++;
    }
  }

  const totalPieces = numBags * 7;
  const expectedCount = numBags;

  // Check if distribution is fair (each piece appears exactly once per bag)
  const isDistributionFair = Object.values(pieceCounts).every((count) => count === expectedCount);

  return {
    pieceCounts,
    totalPieces,
    expectedCount,
    isDistributionFair,
  };
}

/**
 * Simulates getting pieces from bags over a long game session
 * @param numPieces Number of pieces to generate
 * @returns Array of pieces in the order they would appear
 */
export function simulateGameSession(numPieces: number): TetrominoTypeName[] {
  const pieces: TetrominoTypeName[] = [];
  let currentBag: TetrominoTypeName[] = [];

  for (let i = 0; i < numPieces; i++) {
    const [piece, remainingBag] = getNextPiece(currentBag);
    pieces.push(piece);
    currentBag = remainingBag;
  }

  return pieces;
}
