import {
  type QRCodeEncodingMode,
  type QRCodeErrorCorrectionLevel,
  type QRCodeMask,
  type QRCodeVersion,
} from '@qrcodesdk/core';

import {fixtureCapacity} from './capacity';
import {createFixturePayload, fixtureSeed} from './fixture-payloads';
import type {QRCodeTestFixture} from './fixtures';

const ERROR_CORRECTION_LEVELS = [
  'L',
  'M',
  'Q',
  'H',
] as const satisfies readonly QRCodeErrorCorrectionLevel[];

const MASKS = [0, 1, 2, 3, 4, 5, 6, 7] as const satisfies readonly QRCodeMask[];
const MODES = ['numeric', 'alphanumeric', 'octet'] as const satisfies readonly QRCodeEncodingMode[];

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

export type QRCodeAutoMaskCombination = Required<Omit<QRCodeTestFixture, 'mask'>>;

export const TOTAL_QR_CODE_COMBINATIONS =
  40 * ERROR_CORRECTION_LEVELS.length * MASKS.length * MODES.length;
export const TOTAL_QR_CODE_AUTO_MASK_COMBINATIONS =
  40 * ERROR_CORRECTION_LEVELS.length * MODES.length;

export function* getAllQRCodeCombinations(): Generator<Required<QRCodeTestFixture>> {
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

export function* getAllQRCodeECICombinations(): Generator<Required<QRCodeTestFixture>> {
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
