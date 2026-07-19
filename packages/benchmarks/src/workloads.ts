import {
  type QRCodeTestFixture,
  QR_CODE_TEST_FIXTURES,
  getAllQRCodeCombinations,
} from '@repo/core-testing';

import type {BenchmarkWorkload} from './types';

export const STATIC_MULTIPLIERS = [1, 5, 10, 100, 500] as const;
export const ALL_QR_CODE_COMBINATIONS = [...getAllQRCodeCombinations()];
export const WARMUP_STATIC_PASSES = 5;
export const WARMUP_EXHAUSTIVE_PASSES = 1;

export function createBenchmarkWarmupWorkloads(
  staticFixtures: readonly QRCodeTestFixture[] = QR_CODE_TEST_FIXTURES,
  exhaustiveFixtures: readonly QRCodeTestFixture[] = ALL_QR_CODE_COMBINATIONS,
): BenchmarkWorkload[] {
  return [
    {
      id: 'warmup-static',
      label: 'Static fixtures warm-up',
      fixtures: staticFixtures,
      repetitions: WARMUP_STATIC_PASSES,
      qrCodesPerSample: staticFixtures.length * WARMUP_STATIC_PASSES,
    },
    {
      id: 'warmup-all-combinations',
      label: 'All combinations warm-up',
      fixtures: exhaustiveFixtures,
      repetitions: WARMUP_EXHAUSTIVE_PASSES,
      qrCodesPerSample: exhaustiveFixtures.length * WARMUP_EXHAUSTIVE_PASSES,
    },
  ];
}

export function createStaticWorkloads(fixtures: readonly QRCodeTestFixture[]): BenchmarkWorkload[] {
  return STATIC_MULTIPLIERS.map((repetitions) => ({
    id: `static-${repetitions}`,
    label: `Static fixtures ×${repetitions}`,
    fixtures,
    repetitions,
    qrCodesPerSample: fixtures.length * repetitions,
  }));
}

export function createBenchmarkWorkloads(
  staticFixtures: readonly QRCodeTestFixture[] = QR_CODE_TEST_FIXTURES,
  exhaustiveFixtures: readonly QRCodeTestFixture[] = ALL_QR_CODE_COMBINATIONS,
): BenchmarkWorkload[] {
  return [
    ...createStaticWorkloads(staticFixtures),
    {
      id: 'all-combinations',
      label: 'All combinations ×1',
      fixtures: exhaustiveFixtures,
      repetitions: 1,
      qrCodesPerSample: exhaustiveFixtures.length,
    },
  ];
}
