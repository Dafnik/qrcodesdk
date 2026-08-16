import {QR_CODE_TEST_FIXTURES, TOTAL_QR_CODE_COMBINATIONS} from '@repo/core-testing';
import {describe, expect, test} from 'vitest';

import {
  AUTOMATIC_QR_CODE_TEST_FIXTURES,
  BENCHMARK_SAMPLE_COUNT,
  STATIC_MULTIPLIERS,
  WARMUP_EXHAUSTIVE_PASSES,
  WARMUP_STATIC_PASSES,
  createAutomaticBenchmarkWarmupWorkloads,
  createAutomaticBenchmarkWorkloads,
  createBenchmarkWarmupWorkloads,
  createBenchmarkWorkloads,
  createStaticWorkloads,
} from '../src/workloads';

describe('benchmark workloads', () => {
  test('removes version and mask from every automatic static fixture', () => {
    expect(AUTOMATIC_QR_CODE_TEST_FIXTURES).toHaveLength(QR_CODE_TEST_FIXTURES.length);
    for (const fixture of AUTOMATIC_QR_CODE_TEST_FIXTURES) {
      expect(fixture).not.toHaveProperty('version');
      expect(fixture).not.toHaveProperty('mask');
    }
  });

  test('uses five timed samples', () => {
    expect(BENCHMARK_SAMPLE_COUNT).toBe(5);
  });

  test('expands every static multiplier to the expected QR count', () => {
    const workloads = createStaticWorkloads(QR_CODE_TEST_FIXTURES);

    expect(workloads).toHaveLength(STATIC_MULTIPLIERS.length);
  });

  test('adds all QR code combinations as one exhaustive pass', () => {
    const workloads = createBenchmarkWorkloads();
    const exhaustive = workloads.at(-1);

    expect(exhaustive).toMatchObject({
      id: 'all-combinations',
      repetitions: 1,
      qrCodesPerSample: TOTAL_QR_CODE_COMBINATIONS,
    });
    expect(exhaustive?.fixtures).toHaveLength(3840);
  });

  test('runs automatic static fixtures at every multiplier without exhaustive combinations', () => {
    const workloads = createAutomaticBenchmarkWorkloads();

    expect(workloads).toHaveLength(STATIC_MULTIPLIERS.length);
    expect(workloads.some(({id}) => id === 'all-combinations')).toBe(false);
  });

  test('warms static fixtures and every QR code combination', () => {
    const [staticWarmup, exhaustiveWarmup] = createBenchmarkWarmupWorkloads();

    expect(staticWarmup).toMatchObject({
      id: 'warmup-static',
      repetitions: WARMUP_STATIC_PASSES,
      qrCodesPerSample: QR_CODE_TEST_FIXTURES.length * WARMUP_STATIC_PASSES,
    });
    expect(exhaustiveWarmup).toMatchObject({
      id: 'warmup-all-combinations',
      repetitions: WARMUP_EXHAUSTIVE_PASSES,
      qrCodesPerSample: TOTAL_QR_CODE_COMBINATIONS * WARMUP_EXHAUSTIVE_PASSES,
    });
    expect(exhaustiveWarmup?.fixtures).toHaveLength(TOTAL_QR_CODE_COMBINATIONS);
  });

  test('warms only static fixtures for automatic matrix generation', () => {
    const workloads = createAutomaticBenchmarkWarmupWorkloads();

    expect(workloads).toHaveLength(1);
    expect(workloads[0]).toMatchObject({
      id: 'warmup-automatic-static',
      repetitions: WARMUP_STATIC_PASSES,
      qrCodesPerSample: QR_CODE_TEST_FIXTURES.length * WARMUP_STATIC_PASSES,
    });
  });
});
