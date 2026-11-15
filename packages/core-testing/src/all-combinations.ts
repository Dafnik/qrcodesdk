import {
  type QRCodeEncodingMode,
  type QRCodeErrorCorrectionLevel,
  type QRCodeMask,
  type QRCodeVersion,
} from '@qrcodesdk/core';
import {kanji} from '@qrcodesdk/core/kanji';
import type {QRCodeMicroMask} from '@qrcodesdk/core/micro';

import {
  RMQR_VERSIONS,
  fixtureCapacity,
  fixtureMicroCapacity,
  fixtureRMQRCapacity,
} from './capacity';
import {createFixturePayload, fixtureSeed} from './fixture-payloads';
import type {QRCodeTestFixture} from './fixtures';
import type {QRCodeMicroTestFixture} from './micro-fixtures';
import type {QRCodeRMQRTestFixture} from './rmqr-fixtures';

const ERROR_CORRECTION_LEVELS = [
  'L',
  'M',
  'Q',
  'H',
] as const satisfies readonly QRCodeErrorCorrectionLevel[];

const MASKS = [0, 1, 2, 3, 4, 5, 6, 7] as const satisfies readonly QRCodeMask[];
const MODES = ['numeric', 'alphanumeric', 'octet'] as const satisfies readonly QRCodeEncodingMode[];
const ALL_MODES = [
  'numeric',
  'alphanumeric',
  'octet',
  'kanji',
] as const satisfies readonly QRCodeEncodingMode[];

/** Micro QR symbols: M1 only detects errors, so its level is a placeholder. */
const MICRO_SYMBOLS = [
  ['M1', 'L'],
  ['M2', 'L'],
  ['M2', 'M'],
  ['M3', 'L'],
  ['M3', 'M'],
  ['M4', 'L'],
  ['M4', 'M'],
  ['M4', 'Q'],
] as const satisfies readonly (readonly [
  QRCodeMicroTestFixture['version'],
  QRCodeMicroTestFixture['errorCorrectionLevel'],
])[];
const MICRO_MASKS = [0, 1, 2, 3] as const satisfies readonly QRCodeMicroMask[];
const RMQR_ERROR_CORRECTION_LEVELS = [
  'M',
  'H',
] as const satisfies readonly QRCodeErrorCorrectionLevel[];

/**
 * Creates a seeded payload that fills the symbol's data capacity exactly, so no pad codewords
 * (and their repeating `0xEC 0x11` pattern) end up in the matrix.
 */
function combinationPayload(
  name: string,
  version: QRCodeVersion,
  errorCorrectionLevel: QRCodeErrorCorrectionLevel,
  mode: QRCodeEncodingMode,
  eci: boolean,
): string {
  return createFixturePayload(
    mode,
    fixtureCapacity(version, errorCorrectionLevel, mode, eci),
    fixtureSeed(name),
    {utf8: eci},
  );
}

/** A fixture with every matrix option set, except the Kanji table outside Kanji mode. */
export type QRCodeCombination = Required<Omit<QRCodeTestFixture, 'kanji'>> &
  Pick<QRCodeTestFixture, 'kanji'>;
export type QRCodeAutoMaskCombination = Omit<QRCodeCombination, 'mask'>;
/** A Micro QR fixture with every option set, except the Kanji table outside Kanji mode. */
export type QRCodeMicroCombination = Required<Omit<QRCodeMicroTestFixture, 'kanji'>> &
  Pick<QRCodeMicroTestFixture, 'kanji'>;
/** An rMQR fixture with an exact version, so `version` and `symbol` match. */
export type QRCodeRMQRCombination = Required<Omit<QRCodeRMQRTestFixture, 'kanji'>> &
  Pick<QRCodeRMQRTestFixture, 'kanji'>;

export const TOTAL_QR_CODE_COMBINATIONS =
  40 * ERROR_CORRECTION_LEVELS.length * MASKS.length * MODES.length;
export const TOTAL_QR_CODE_AUTO_MASK_COMBINATIONS =
  40 * ERROR_CORRECTION_LEVELS.length * MODES.length;
export const TOTAL_QR_CODE_KANJI_COMBINATIONS = 40 * ERROR_CORRECTION_LEVELS.length * MASKS.length;
/** M1 holds numeric data, M2 also alphanumeric data, and M3 and M4 every mode. */
export const TOTAL_MICRO_QR_CODE_COMBINATIONS = MICRO_MASKS.length * (1 + 2 * 2 + 5 * 4);
export const TOTAL_RMQR_CODE_COMBINATIONS =
  RMQR_VERSIONS.length * RMQR_ERROR_CORRECTION_LEVELS.length * ALL_MODES.length;

export function* getAllQRCodeCombinations(): Generator<QRCodeCombination> {
  for (let version = 1; version <= 40; version += 1) {
    for (const errorCorrectionLevel of ERROR_CORRECTION_LEVELS) {
      for (const mask of MASKS) {
        for (const mode of MODES) {
          const name = [
            `version-${String(version).padStart(2, '0')}`,
            `ecc-${errorCorrectionLevel}`,
            `mask-${mask}`,
            `mode-${mode}`,
          ].join('_');
          yield {
            name,
            payload: combinationPayload(
              name,
              version as QRCodeVersion,
              errorCorrectionLevel,
              mode,
              false,
            ),
            mode,
            version: version as QRCodeVersion,
            mask,
            errorCorrectionLevel,
            eci: false,
          };
        }
      }
    }
  }
}

export function* getAllQRCodeECICombinations(): Generator<QRCodeCombination> {
  for (let version = 1; version <= 40; version += 1) {
    for (const errorCorrectionLevel of ERROR_CORRECTION_LEVELS) {
      for (const mask of MASKS) {
        const mode = 'octet';
        const name = [
          `version-${String(version).padStart(2, '0')}`,
          `ecc-${errorCorrectionLevel}`,
          `mask-${mask}`,
          `mode-${mode}`,
        ].join('_');
        yield {
          name,
          payload: combinationPayload(
            name,
            version as QRCodeVersion,
            errorCorrectionLevel,
            mode,
            true,
          ),
          mode,
          version: version as QRCodeVersion,
          mask,
          errorCorrectionLevel,
          eci: true,
        };
      }
    }
  }
}

/** Yields one exactly full Kanji mode fixture per version, ECC level, and mask. */
export function* getAllQRCodeKanjiCombinations(): Generator<QRCodeCombination> {
  for (let version = 1; version <= 40; version += 1) {
    for (const errorCorrectionLevel of ERROR_CORRECTION_LEVELS) {
      for (const mask of MASKS) {
        const mode = 'kanji';
        const name = [
          `version-${String(version).padStart(2, '0')}`,
          `ecc-${errorCorrectionLevel}`,
          `mask-${mask}`,
          `mode-${mode}`,
        ].join('_');
        yield {
          name,
          payload: combinationPayload(
            name,
            version as QRCodeVersion,
            errorCorrectionLevel,
            mode,
            false,
          ),
          mode,
          kanji,
          version: version as QRCodeVersion,
          mask,
          errorCorrectionLevel,
          eci: false,
        };
      }
    }
  }
}

export function* getAllQRCodeAutoMaskCombinations(): Generator<QRCodeAutoMaskCombination> {
  for (let version = 1; version <= 40; version += 1) {
    for (const errorCorrectionLevel of ERROR_CORRECTION_LEVELS) {
      for (const mode of MODES) {
        const name = [
          `version-${String(version).padStart(2, '0')}`,
          `ecc-${errorCorrectionLevel}`,
          'mask-auto',
          `mode-${mode}`,
        ].join('_');
        yield {
          name,
          payload: combinationPayload(
            name,
            version as QRCodeVersion,
            errorCorrectionLevel,
            mode,
            false,
          ),
          mode,
          version: version as QRCodeVersion,
          errorCorrectionLevel,
          eci: false,
        };
      }
    }
  }
}

/**
 * Micro QR combinations that ZXing (zxing-wasm 3.1.6) cannot decode at any module size. segno 1.6.6
 * generates the same modules for each of them, and ZXing cannot decode its symbols either.
 */
export const ZXING_MICRO_QR_CODE_DECODE_FAILURES: ReadonlySet<string> = new Set([
  'version-M3_ecc-M_mask-3_mode-numeric',
  'version-M4_ecc-L_mask-1_mode-alphanumeric',
  'version-M4_ecc-M_mask-3_mode-alphanumeric',
]);

/**
 * Yields one exactly full Micro QR fixture per symbol, mask, and mode that the symbol supports:
 * numeric in M1, numeric and alphanumeric in M2, and every mode in M3 and M4.
 */
export function* getAllMicroQRCodeCombinations(): Generator<QRCodeMicroCombination> {
  for (const [version, errorCorrectionLevel] of MICRO_SYMBOLS) {
    for (const mask of MICRO_MASKS) {
      for (const mode of ALL_MODES) {
        const capacity = fixtureMicroCapacity(version, errorCorrectionLevel, mode);
        if (capacity === 0) continue;
        const name = [
          `version-${version}`,
          `ecc-${errorCorrectionLevel}`,
          `mask-${mask}`,
          `mode-${mode}`,
        ].join('_');
        yield {
          name,
          payload: createFixturePayload(mode, capacity, fixtureSeed(name)),
          mode,
          ...(mode === 'kanji' ? {kanji} : {}),
          version,
          mask,
          errorCorrectionLevel,
        };
      }
    }
  }
}

/** Yields one exactly full rMQR fixture per version, ECC level, and mode. rMQR has one mask. */
export function* getAllRMQRCodeCombinations(): Generator<QRCodeRMQRCombination> {
  for (const version of RMQR_VERSIONS) {
    for (const errorCorrectionLevel of RMQR_ERROR_CORRECTION_LEVELS) {
      for (const mode of ALL_MODES) {
        const name = [`version-${version}`, `ecc-${errorCorrectionLevel}`, `mode-${mode}`].join(
          '_',
        );
        yield {
          name,
          payload: createFixturePayload(
            mode,
            fixtureRMQRCapacity(version, errorCorrectionLevel, mode),
            fixtureSeed(name),
          ),
          mode,
          ...(mode === 'kanji' ? {kanji} : {}),
          version,
          symbol: version,
          errorCorrectionLevel,
        };
      }
    }
  }
}
