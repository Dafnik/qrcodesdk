// Type-only and without a file extension, so the docs can import this module as well.
import type {SpeedStatistics} from '../report-types';

function quantile(sorted: readonly number[], q: number): number {
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (position - lower);
}

/** Summarizes per-operation samples in nanoseconds. */
export function summarize(samples: readonly number[], batch: number): SpeedStatistics {
  if (samples.length === 0) throw new Error('Cannot summarize zero samples');
  const sorted = [...samples].sort((a, b) => a - b);
  const mean = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
  const variance =
    sorted.length > 1
      ? sorted.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (sorted.length - 1)
      : 0;
  const median = quantile(sorted, 0.5);
  const round = (value: number) => Math.round(value * 100) / 100;
  return {
    samples: sorted.length,
    batch,
    mean: round(mean),
    median: round(median),
    p75: round(quantile(sorted, 0.75)),
    p99: round(quantile(sorted, 0.99)),
    min: round(sorted[0]!),
    max: round(sorted.at(-1)!),
    hz: round(1e9 / median),
    rme: round(mean > 0 ? ((1.96 * Math.sqrt(variance / sorted.length)) / mean) * 100 : 0),
  };
}

export type Change = 'faster' | 'slower' | 'same';

/** Smallest median change that counts as faster or slower, regardless of noise. */
export const MIN_CHANGE = 0.05;

/**
 * Classifies the median change from `before` to `after`. A change counts only when it exceeds
 * both 5% and the combined margins of error.
 */
export function compare(
  after: SpeedStatistics,
  before: SpeedStatistics,
): {ratio: number; change: Change} {
  const ratio = after.median / before.median - 1;
  const noise = Math.max(MIN_CHANGE, (after.rme + before.rme) / 100);
  return {ratio, change: ratio > noise ? 'slower' : ratio < -noise ? 'faster' : 'same'};
}
