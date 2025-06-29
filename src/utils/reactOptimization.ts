import { memo } from "react";

/**
 * Performance optimization utilities for React components
 */

/**
 * Shallow comparison for objects - prevents unnecessary re-renders
 */
export function shallowEqual<T extends Record<string, unknown>>(a: T, b: T): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (const key of keysA) {
    if (a[key] !== b[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Create a memoized component with shallow comparison
 */
export function createMemoizedComponent<T extends Record<string, unknown>>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  return memo(Component, shallowEqual);
}

/**
 * Array shallow comparison - useful for board states
 */
export function shallowEqualArray<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Deep comparison for 2D arrays (board states)
 */
export function deepEqual2DArray<T>(a: T[][], b: T[][]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (!shallowEqualArray(a[i], b[i])) {
      return false;
    }
  }

  return true;
}

/**
 * Debounce function for performance-critical operations
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function for limiting frequent updates
 */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Performance measurement utility
 */
export class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();

  /**
   * Start measuring performance for a given operation
   */
  start(operationName: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (!this.measurements.has(operationName)) {
        this.measurements.set(operationName, []);
      }

      const measurements = this.measurements.get(operationName)!;
      measurements.push(duration);

      // Keep only last 100 measurements for memory efficiency
      if (measurements.length > 100) {
        measurements.shift();
      }
    };
  }

  /**
   * Get average performance for an operation
   */
  getAverage(operationName: string): number {
    const measurements = this.measurements.get(operationName);
    if (!measurements || measurements.length === 0) {
      return 0;
    }

    const sum = measurements.reduce((a, b) => a + b, 0);
    return sum / measurements.length;
  }

  /**
   * Get performance statistics
   */
  getStats(operationName: string): {
    average: number;
    min: number;
    max: number;
    count: number;
  } {
    const measurements = this.measurements.get(operationName) || [];

    if (measurements.length === 0) {
      return { average: 0, min: 0, max: 0, count: 0 };
    }

    const sum = measurements.reduce((a, b) => a + b, 0);
    const average = sum / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);

    return {
      average,
      min,
      max,
      count: measurements.length,
    };
  }

  /**
   * Clear all measurements
   */
  clear(): void {
    this.measurements.clear();
  }

  /**
   * Get all performance data
   */
  getAllStats(): Record<string, ReturnType<typeof this.getStats>> {
    const result: Record<string, ReturnType<typeof this.getStats>> = {};

    for (const [operationName] of this.measurements) {
      result[operationName] = this.getStats(operationName);
    }

    return result;
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook for measuring component render time
 */
export function useMeasureRender(componentName: string): void {
  const endMeasurement = performanceMonitor.start(`${componentName}-render`);

  // End measurement when component finishes rendering
  endMeasurement();
}
