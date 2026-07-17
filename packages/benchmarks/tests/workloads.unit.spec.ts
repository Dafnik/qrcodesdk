import {QR_CODE_TEST_FIXTURES, TOTAL_QR_CODE_COMBINATIONS} from '@repo/core-testing';
import {describe, expect, test} from 'vitest';

import {
  STATIC_MULTIPLIERS,
  createBenchmarkWorkloads,
  createStaticWorkloads,
} from '../src/workloads';

describe('benchmark workloads', () => {
  test('expands every static multiplier to the expected QR count', () => {
    const workloads = createStaticWorkloads(QR_CODE_TEST_FIXTURES);

    expect(workloads).toHaveLength(STATIC_MULTIPLIERS.length);
    expect(workloads.map(({qrCodesPerSample}) => qrCodesPerSample)).toEqual([
      16, 80, 160, 1_600, 8_000,
    ]);
  });

  test('adds all QR code combinations as one exhaustive pass', () => {
    const workloads = createBenchmarkWorkloads();
    const exhaustive = workloads.at(-1);

    expect(exhaustive).toMatchObject({
      id: 'all-combinations',
      repetitions: 1,
      qrCodesPerSample: TOTAL_QR_CODE_COMBINATIONS,
    });
    expect(exhaustive?.fixtures).toHaveLength(3_840);
  });
});
