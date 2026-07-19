import {describe, expect, test} from 'vitest';

import {calculateTimeRatio, median, summarizeSamples} from '../src/statistics';

describe('benchmark statistics', () => {
  test('calculates odd and even medians without mutating samples', () => {
    const samples = [9, 1, 5, 3, 7];

    expect(median(samples)).toBe(5);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(samples).toEqual([9, 1, 5, 3, 7]);
  });

  test('summarizes elapsed time and throughput', () => {
    expect(summarizeSamples([10, 40, 20, 50, 30], 300)).toEqual({
      medianMs: 30,
      minMs: 10,
      maxMs: 50,
      qrCodesPerSecond: 10_000,
    });
  });

  test('calculates time relative to the QRCodeSDK median', () => {
    expect(calculateTimeRatio(25, 10)).toBe(2.5);
    expect(calculateTimeRatio(10, 10)).toBe(1);
  });

  test('rejects invalid samples and baselines', () => {
    expect(() => median([])).toThrow('empty sample');
    expect(() => summarizeSamples([], 1)).toThrow('empty sample');
    expect(() => summarizeSamples([1], 0)).toThrow('must be positive');
    expect(() => calculateTimeRatio(1, 0)).toThrow('must be positive');
  });
});
