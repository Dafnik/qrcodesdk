import {
  type QRCodeTestFixture,
  getAllQRCodeAutoMaskCombinations,
  getAllQRCodeCombinations,
  getAllQRCodeECICombinations,
} from '@repo/core-testing';

import type {QRCodeErrorCorrectionLevel, QRCodeMask, QRCodeMode} from '@qrcodesdk/core';

import {type DevFixture, PLAIN_STYLE} from './fixture-catalog';

export type CombinationSet = 'standard' | 'eci' | 'auto-mask';

export const COMBINATION_SETS: readonly {
  readonly id: CombinationSet;
  readonly label: string;
  readonly source: string;
}[] = [
  {id: 'standard', label: 'Standard', source: 'getAllQRCodeCombinations'},
  {id: 'eci', label: 'ECI', source: 'getAllQRCodeECICombinations'},
  {id: 'auto-mask', label: 'Auto mask', source: 'getAllQRCodeAutoMaskCombinations'},
];

export const ERROR_CORRECTION_LEVELS: readonly QRCodeErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H'];
export const MASKS: readonly QRCodeMask[] = [0, 1, 2, 3, 4, 5, 6, 7];
export const MODES: readonly QRCodeMode[] = ['numeric', 'alphanumeric', 'octet'];

export type CombinationFilter = {
  readonly enabled: boolean;
  readonly sets: readonly CombinationSet[];
  readonly versionFrom: number;
  readonly versionTo: number;
  readonly errorCorrectionLevels: readonly QRCodeErrorCorrectionLevel[];
  /** Ignored by the auto-mask set. */
  readonly masks: readonly QRCodeMask[];
  readonly modes: readonly QRCodeMode[];
};

export const DEFAULT_COMBINATION_FILTER: CombinationFilter = {
  enabled: false,
  sets: ['standard'],
  versionFrom: 1,
  versionTo: 40,
  errorCorrectionLevels: [...ERROR_CORRECTION_LEVELS],
  masks: [...MASKS],
  modes: [...MODES],
};

const GENERATORS: Record<CombinationSet, () => Iterable<QRCodeTestFixture>> = {
  standard: getAllQRCodeCombinations,
  eci: getAllQRCodeECICombinations,
  'auto-mask': getAllQRCodeAutoMaskCombinations,
};

/** Yields the combinations that match `filter`, regardless of `filter.enabled`. */
export function* combinationFixtures(filter: CombinationFilter): Generator<DevFixture> {
  const errorCorrectionLevels = new Set(filter.errorCorrectionLevels);
  const masks = new Set(filter.masks);
  const modes = new Set(filter.modes);

  for (const set of filter.sets) {
    for (const combination of GENERATORS[set]()) {
      const {name, payload, version = 1, errorCorrectionLevel, mask, mode, eci} = combination;
      if (version < filter.versionFrom || version > filter.versionTo) continue;
      if (errorCorrectionLevel && !errorCorrectionLevels.has(errorCorrectionLevel)) continue;
      if (mode && !modes.has(mode)) continue;
      if (set !== 'auto-mask' && mask !== undefined && !masks.has(mask)) continue;

      yield {
        id: `all-combinations/${set}/${name}`,
        category: 'all-combinations',
        name: set === 'standard' ? name : `${set}_${name}`,
        payload,
        matrix: {version, errorCorrectionLevel, mask, mode, eci},
        style: PLAIN_STYLE,
        knownDecodeIssue:
          version === 23 && errorCorrectionLevel === 'L'
            ? 'jsQR cannot decode version 23 L codes (jsQR issue 251).'
            : undefined,
      };
    }
  }
}

export function countCombinations(filter: CombinationFilter): number {
  const fixtures = combinationFixtures(filter);
  let count = 0;
  while (!fixtures.next().done) count++;
  return count;
}
