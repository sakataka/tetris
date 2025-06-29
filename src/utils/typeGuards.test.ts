/**
 * Tests for type guard and validation functions
 * Following TDD approach - tests written before implementation
 */

import { describe, expect, test } from "bun:test";
import {
  isValidCellValue,
  isValidRotationState,
  isValidTetrominoType,
  normalizeRotationState,
} from "./typeGuards";

describe("isValidCellValue", () => {
  test("should return true for valid cell values 0-7", () => {
    expect(isValidCellValue(0)).toBe(true);
    expect(isValidCellValue(1)).toBe(true);
    expect(isValidCellValue(2)).toBe(true);
    expect(isValidCellValue(3)).toBe(true);
    expect(isValidCellValue(4)).toBe(true);
    expect(isValidCellValue(5)).toBe(true);
    expect(isValidCellValue(6)).toBe(true);
    expect(isValidCellValue(7)).toBe(true);
  });

  test("should return false for invalid cell values", () => {
    expect(isValidCellValue(-1)).toBe(false);
    expect(isValidCellValue(8)).toBe(false);
    expect(isValidCellValue(10)).toBe(false);
    expect(isValidCellValue(1.5)).toBe(false);
  });

  test("should return false for non-number values", () => {
    expect(isValidCellValue("0" as unknown)).toBe(false);
    expect(isValidCellValue(null as unknown)).toBe(false);
    expect(isValidCellValue(undefined as unknown)).toBe(false);
    expect(isValidCellValue({} as unknown)).toBe(false);
    expect(isValidCellValue([] as unknown)).toBe(false);
    expect(isValidCellValue(true as unknown)).toBe(false);
  });
});

describe("isValidRotationState", () => {
  test("should return true for valid rotation states 0-3", () => {
    expect(isValidRotationState(0)).toBe(true);
    expect(isValidRotationState(1)).toBe(true);
    expect(isValidRotationState(2)).toBe(true);
    expect(isValidRotationState(3)).toBe(true);
  });

  test("should return false for invalid rotation states", () => {
    expect(isValidRotationState(-1)).toBe(false);
    expect(isValidRotationState(4)).toBe(false);
    expect(isValidRotationState(10)).toBe(false);
    expect(isValidRotationState(1.5)).toBe(false);
  });

  test("should return false for non-number values", () => {
    expect(isValidRotationState("0" as unknown)).toBe(false);
    expect(isValidRotationState(null as unknown)).toBe(false);
    expect(isValidRotationState(undefined as unknown)).toBe(false);
    expect(isValidRotationState({} as unknown)).toBe(false);
    expect(isValidRotationState([] as unknown)).toBe(false);
    expect(isValidRotationState(true as unknown)).toBe(false);
  });
});

describe("normalizeRotationState", () => {
  test("should normalize positive rotation values to 0-3 range", () => {
    expect(normalizeRotationState(0)).toBe(0);
    expect(normalizeRotationState(1)).toBe(1);
    expect(normalizeRotationState(2)).toBe(2);
    expect(normalizeRotationState(3)).toBe(3);
    expect(normalizeRotationState(4)).toBe(0);
    expect(normalizeRotationState(5)).toBe(1);
    expect(normalizeRotationState(6)).toBe(2);
    expect(normalizeRotationState(7)).toBe(3);
    expect(normalizeRotationState(8)).toBe(0);
  });

  test("should normalize negative rotation values to 0-3 range", () => {
    expect(normalizeRotationState(-1)).toBe(3);
    expect(normalizeRotationState(-2)).toBe(2);
    expect(normalizeRotationState(-3)).toBe(1);
    expect(normalizeRotationState(-4)).toBe(0);
    expect(normalizeRotationState(-5)).toBe(3);
    expect(normalizeRotationState(-6)).toBe(2);
    expect(normalizeRotationState(-7)).toBe(1);
    expect(normalizeRotationState(-8)).toBe(0);
  });

  test("should handle large rotation values correctly", () => {
    expect(normalizeRotationState(100)).toBe(0);
    expect(normalizeRotationState(101)).toBe(1);
    expect(normalizeRotationState(102)).toBe(2);
    expect(normalizeRotationState(103)).toBe(3);
    expect(normalizeRotationState(-100)).toBe(0);
    expect(normalizeRotationState(-101)).toBe(3);
    expect(normalizeRotationState(-102)).toBe(2);
    expect(normalizeRotationState(-103)).toBe(1);
  });

  test("should handle decimal values by flooring them first", () => {
    expect(normalizeRotationState(1.9)).toBe(1);
    expect(normalizeRotationState(2.1)).toBe(2);
    expect(normalizeRotationState(4.7)).toBe(0);
    expect(normalizeRotationState(-1.2)).toBe(3);
    expect(normalizeRotationState(-2.8)).toBe(2);
  });
});

describe("isValidTetrominoType", () => {
  test("should return true for valid tetromino types", () => {
    expect(isValidTetrominoType("I")).toBe(true);
    expect(isValidTetrominoType("O")).toBe(true);
    expect(isValidTetrominoType("T")).toBe(true);
    expect(isValidTetrominoType("S")).toBe(true);
    expect(isValidTetrominoType("Z")).toBe(true);
    expect(isValidTetrominoType("J")).toBe(true);
    expect(isValidTetrominoType("L")).toBe(true);
  });

  test("should return false for invalid tetromino types", () => {
    expect(isValidTetrominoType("A")).toBe(false);
    expect(isValidTetrominoType("X")).toBe(false);
    expect(isValidTetrominoType("i")).toBe(false); // lowercase
    expect(isValidTetrominoType("o")).toBe(false); // lowercase
    expect(isValidTetrominoType("1")).toBe(false);
    expect(isValidTetrominoType("")).toBe(false);
    expect(isValidTetrominoType("II")).toBe(false); // too long
  });

  test("should return false for non-string values", () => {
    expect(isValidTetrominoType(1 as unknown)).toBe(false);
    expect(isValidTetrominoType(null as unknown)).toBe(false);
    expect(isValidTetrominoType(undefined as unknown)).toBe(false);
    expect(isValidTetrominoType({} as unknown)).toBe(false);
    expect(isValidTetrominoType([] as unknown)).toBe(false);
    expect(isValidTetrominoType(true as unknown)).toBe(false);
  });
});
