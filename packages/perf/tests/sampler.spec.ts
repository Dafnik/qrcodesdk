import {expect, test} from 'vitest';

import {sample} from '../src/speed/sampler.ts';

test('batches fast operations until a sample reaches the batch duration', () => {
  let clock = 0;
  // Each operation advances a fake clock by 0.01 ms.
  const result = sample(
    () => (clock += 0.01),
    () => clock,
    {warmupMs: 1, timeMs: 5, minSamples: 3, maxSamples: 50, batchMs: 1},
  );
  expect(result.batch).toBeGreaterThanOrEqual(100);
  expect(result.samples.length).toBeGreaterThanOrEqual(3);
  for (const value of result.samples) expect(value).toBeCloseTo(10_000, 0);
});

test('stops at the maximum sample count', () => {
  let clock = 0;
  const result = sample(
    () => (clock += 2),
    () => clock,
    {warmupMs: 0, timeMs: 1e9, minSamples: 1, maxSamples: 7, batchMs: 1},
  );
  expect(result.batch).toBe(1);
  expect(result.samples).toHaveLength(7);
});
