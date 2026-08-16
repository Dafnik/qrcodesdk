import {
  type QRCodeTestFixture,
  QR_CODE_TEST_FIXTURES,
  getAllQRCodeCombinations,
} from '@repo/core-testing';

import type {BenchmarkWorkload} from './types';

export type AutomaticQRCodeTestFixture = Omit<QRCodeTestFixture, 'mask' | 'version'> & {
  readonly mask?: never;
  readonly version?: never;
};

export const BENCHMARK_SAMPLE_COUNT = 5;
export const STATIC_MULTIPLIERS = [1, 10, 500];
export const ALL_QR_CODE_COMBINATIONS = [...getAllQRCodeCombinations()];
export const AUTOMATIC_QR_CODE_TEST_FIXTURES: readonly AutomaticQRCodeTestFixture[] =
  QR_CODE_TEST_FIXTURES.map((fixture) => {
    const automaticFixture: Record<string, unknown> = {...fixture};
    delete automaticFixture['mask'];
    delete automaticFixture['version'];
    return automaticFixture as AutomaticQRCodeTestFixture;
  });
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

export function createAutomaticBenchmarkWarmupWorkloads(
  fixtures: readonly AutomaticQRCodeTestFixture[] = AUTOMATIC_QR_CODE_TEST_FIXTURES,
): BenchmarkWorkload[] {
  return [
    {
      id: 'warmup-automatic-static',
      label: 'Automatic static fixtures warm-up',
      fixtures,
      repetitions: WARMUP_STATIC_PASSES,
      qrCodesPerSample: fixtures.length * WARMUP_STATIC_PASSES,
    },
  ];
}

export function createStaticWorkloads(
  fixtures: readonly QRCodeTestFixture[],
  multipliers = STATIC_MULTIPLIERS,
): BenchmarkWorkload[] {
  return multipliers.map((repetitions) => ({
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

export function createAutomaticBenchmarkWorkloads(
  fixtures: readonly AutomaticQRCodeTestFixture[] = AUTOMATIC_QR_CODE_TEST_FIXTURES,
): BenchmarkWorkload[] {
  return createStaticWorkloads(fixtures, [1, 10, 100]);
}
