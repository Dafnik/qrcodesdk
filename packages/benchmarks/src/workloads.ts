import {
  type QRCodeTestFixture,
  QR_CODE_TEST_FIXTURES,
  getAllQRCodeCombinations,
} from '@repo/core-testing';

import type {BenchmarkWorkload} from './types';

export const STATIC_MULTIPLIERS = [1, 5, 10, 100, 500] as const;
export const ALL_QR_CODE_COMBINATIONS = [...getAllQRCodeCombinations()];

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
