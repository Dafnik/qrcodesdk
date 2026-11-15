import {describe, expect, test} from 'vitest';

import type {SpeedStatistics} from '../src/report-types.ts';
import {compare, summarize} from '../src/speed/statistics.ts';

const stats = (median: number, rme: number): SpeedStatistics => ({
  samples: 20,
  batch: 1,
  mean: median,
  median,
  p75: median,
  p99: median,
  min: median,
  max: median,
  hz: 1e9 / median,
  rme,
});

describe('summarize', () => {
  test('computes quantiles, throughput, and margin of error', () => {
    const result = summarize([40, 10, 30, 20, 50], 4);
    expect(result).toMatchObject({samples: 5, batch: 4, min: 10, max: 50, median: 30, mean: 30});
    expect(result.p75).toBe(40);
    expect(result.hz).toBeCloseTo(1e9 / 30, 1);
    // Standard error 7.07 at 95% confidence is ±13.86 around a mean of 30.
    expect(result.rme).toBeCloseTo(46.2, 1);
  });

  test('rejects an empty sample set', () => {
    expect(() => summarize([], 1)).toThrow('zero samples');
  });
});

describe('compare', () => {
  test('ignores changes within 5%', () => {
    expect(compare(stats(104, 0.5), stats(100, 0.5)).change).toBe('same');
  });

  test('ignores changes within the combined margin of error', () => {
    expect(compare(stats(110, 6), stats(100, 6)).change).toBe('same');
  });

  test('reports clear regressions and improvements', () => {
    expect(compare(stats(120, 1), stats(100, 1))).toMatchObject({change: 'slower'});
    expect(compare(stats(80, 1), stats(100, 1))).toMatchObject({change: 'faster'});
    expect(compare(stats(120, 1), stats(100, 1)).ratio).toBeCloseTo(0.2);
  });
});
