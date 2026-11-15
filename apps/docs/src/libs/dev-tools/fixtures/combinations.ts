import {
  type QRCodeTestFixture,
  ZXING_MICRO_QR_CODE_DECODE_FAILURES,
  fixtureMicroMatrixOptions,
  fixtureRMQRMatrixOptions,
  getAllMicroQRCodeCombinations,
  getAllQRCodeAutoMaskCombinations,
  getAllQRCodeCombinations,
  getAllQRCodeECICombinations,
  getAllQRCodeKanjiCombinations,
  getAllRMQRCodeCombinations,
} from '@repo/core-testing';

import type {
  QRCodeErrorCorrectionLevel,
  QRCodeMask,
  QRCodeMatrixOptions,
  QRCodeMode,
  QRCodeVisualStyle,
} from '@qrcodesdk/core';

import type {KnownDecodeIssues} from '../rendering/decode';
import {type DevFixture, PLAIN_STYLE} from './fixture-catalog';

export type CombinationSet = 'standard' | 'eci' | 'auto-mask' | 'kanji' | 'micro' | 'rmqr';

export const COMBINATION_SETS: readonly {
  readonly id: CombinationSet;
  readonly label: string;
  readonly source: string;
}[] = [
  {id: 'standard', label: 'Standard', source: 'getAllQRCodeCombinations'},
  {id: 'eci', label: 'ECI', source: 'getAllQRCodeECICombinations'},
  {id: 'auto-mask', label: 'Auto mask', source: 'getAllQRCodeAutoMaskCombinations'},
  {id: 'kanji', label: 'Kanji', source: 'getAllQRCodeKanjiCombinations'},
  {id: 'micro', label: 'Micro QR', source: 'getAllMicroQRCodeCombinations'},
  {id: 'rmqr', label: 'rMQR', source: 'getAllRMQRCodeCombinations'},
];

export const ERROR_CORRECTION_LEVELS: readonly QRCodeErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H'];
export const MASKS: readonly QRCodeMask[] = [0, 1, 2, 3, 4, 5, 6, 7];
export const MODES: readonly QRCodeMode[] = ['numeric', 'alphanumeric', 'octet', 'kanji'];

export type CombinationFilter = {
  readonly enabled: boolean;
  readonly sets: readonly CombinationSet[];
  /** Standard QR versions. Ignored by the Micro QR and rMQR sets. */
  readonly versionFrom: number;
  readonly versionTo: number;
  readonly errorCorrectionLevels: readonly QRCodeErrorCorrectionLevel[];
  /** Ignored by the auto-mask and rMQR sets. Micro QR codes use the masks 0 to 3. */
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

/** The style the Micro QR and rMQR roundtrip tests use, with the default quiet zone of 2 modules. */
const SMALL_SYMBOL_STYLE: QRCodeVisualStyle = {moduleSize: 4};

const ZXING_MICRO_DECODE_ISSUES: KnownDecodeIssues = {
  zxing: 'ZXing cannot decode this Micro QR code. segno generates the same modules.',
};

/** A generated combination with the values the filter matches. */
type Combination = {
  readonly name: string;
  readonly payload: string;
  readonly matrix: QRCodeMatrixOptions;
  readonly style: QRCodeVisualStyle;
  readonly matrixDescription?: string;
  readonly knownDecodeIssues?: KnownDecodeIssues;
  /** The standard QR version, which Micro QR and rMQR combinations leave out. */
  readonly version?: number;
  readonly errorCorrectionLevel?: QRCodeErrorCorrectionLevel;
  readonly mask?: number;
  readonly mode?: QRCodeMode;
};

function* standardCombinations(fixtures: Iterable<QRCodeTestFixture>): Generator<Combination> {
  for (const {
    name,
    payload,
    version = 1,
    errorCorrectionLevel,
    mask,
    mode,
    eci,
    kanji,
  } of fixtures) {
    yield {
      name,
      payload,
      matrix: {version, errorCorrectionLevel, mask, mode, eci, kanji},
      style: PLAIN_STYLE,
      version,
      errorCorrectionLevel,
      mask,
      mode,
    };
  }
}

function* microCombinations(): Generator<Combination> {
  for (const fixture of getAllMicroQRCodeCombinations()) {
    const {version, errorCorrectionLevel, mask, mode} = fixture;
    yield {
      name: fixture.name,
      payload: fixture.payload,
      matrix: fixtureMicroMatrixOptions(fixture),
      style: SMALL_SYMBOL_STYLE,
      // M1 only detects errors, so it ignores the level.
      matrixDescription: [
        version,
        version === 'M1' ? 'error detection' : `ECC ${errorCorrectionLevel}`,
        `mask ${String(mask)}`,
        mode,
      ].join(' · '),
      knownDecodeIssues: ZXING_MICRO_QR_CODE_DECODE_FAILURES.has(fixture.name)
        ? ZXING_MICRO_DECODE_ISSUES
        : undefined,
      errorCorrectionLevel,
      mask,
      mode,
    };
  }
}

function* rmqrCombinations(): Generator<Combination> {
  for (const fixture of getAllRMQRCodeCombinations()) {
    const {symbol, errorCorrectionLevel, mode} = fixture;
    yield {
      name: fixture.name,
      payload: fixture.payload,
      matrix: fixtureRMQRMatrixOptions(fixture),
      style: SMALL_SYMBOL_STYLE,
      matrixDescription: [symbol, `ECC ${errorCorrectionLevel}`, mode].join(' · '),
      errorCorrectionLevel,
      mode,
    };
  }
}

const GENERATORS: Record<CombinationSet, () => Iterable<Combination>> = {
  standard: () => standardCombinations(getAllQRCodeCombinations()),
  eci: () => standardCombinations(getAllQRCodeECICombinations()),
  'auto-mask': () => standardCombinations(getAllQRCodeAutoMaskCombinations()),
  kanji: () => standardCombinations(getAllQRCodeKanjiCombinations()),
  micro: microCombinations,
  rmqr: rmqrCombinations,
};

/** Yields the combinations that match `filter`, regardless of `filter.enabled`. */
export function* combinationFixtures(filter: CombinationFilter): Generator<DevFixture> {
  const errorCorrectionLevels = new Set(filter.errorCorrectionLevels);
  const masks = new Set<number>(filter.masks);
  const modes = new Set(filter.modes);

  for (const set of filter.sets) {
    for (const combination of GENERATORS[set]()) {
      const {name, payload, version, errorCorrectionLevel, mask} = combination;
      if (version !== undefined && (version < filter.versionFrom || version > filter.versionTo)) {
        continue;
      }
      if (errorCorrectionLevel && !errorCorrectionLevels.has(errorCorrectionLevel)) continue;
      if (combination.mode && !modes.has(combination.mode)) continue;
      if (set !== 'auto-mask' && mask !== undefined && !masks.has(mask)) continue;

      yield {
        id: `all-combinations/${set}/${name}`,
        category: 'all-combinations',
        name: set === 'standard' ? name : `${set}_${name}`,
        payload,
        matrix: combination.matrix,
        style: combination.style,
        matrixDescription: combination.matrixDescription,
        knownDecodeIssues: combination.knownDecodeIssues,
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
