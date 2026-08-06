import {
  type QRCodeErrorCorrectionLevel,
  type QRCodeMask,
  type QRCodeMode,
  type QRCodeVersion,
  ɵMODES,
} from '@qrcodesdk/core';

import type {QRCodeTestFixture} from './fixtures';

const ERROR_CORRECTION_LEVELS = [
  'L',
  'M',
  'Q',
  'H',
] as const satisfies readonly QRCodeErrorCorrectionLevel[];

const MASKS = [0, 1, 2, 3, 4, 5, 6, 7] as const satisfies readonly QRCodeMask[];

const DATA_BY_MODE = {
  numeric: '1',
  alphanumeric: 'A',
  octet: 'A',
} as const satisfies Record<QRCodeMode, string>;

export type QRCodeAutoMaskCombination = Required<Omit<QRCodeTestFixture, 'mask'>>;

export const TOTAL_QR_CODE_COMBINATIONS =
  40 * ERROR_CORRECTION_LEVELS.length * MASKS.length * ɵMODES.length;
export const TOTAL_QR_CODE_AUTO_MASK_COMBINATIONS =
  40 * ERROR_CORRECTION_LEVELS.length * ɵMODES.length;

export function* getAllQRCodeCombinations(): Generator<Required<QRCodeTestFixture>> {
  for (let version = 1; version <= 40; version += 1) {
    for (const errorCorrectionLevel of ERROR_CORRECTION_LEVELS) {
      for (const mask of MASKS) {
        for (const mode of ɵMODES) {
          yield {
            name: [
              `version-${String(version).padStart(2, '0')}`,
              `ecc-${errorCorrectionLevel}`,
              `mask-${mask}`,
              `mode-${mode}`,
            ].join('_'),
            data: DATA_BY_MODE[mode].repeat(version),
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
        for (const mode of ɵMODES) {
          yield {
            name: [
              `version-${String(version).padStart(2, '0')}`,
              `ecc-${errorCorrectionLevel}`,
              `mask-${mask}`,
              `mode-${mode}`,
            ].join('_'),
            data: DATA_BY_MODE[mode].repeat(version),
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
}

export function* getAllQRCodeAutoMaskCombinations(): Generator<QRCodeAutoMaskCombination> {
  for (let version = 1; version <= 40; version += 1) {
    for (const errorCorrectionLevel of ERROR_CORRECTION_LEVELS) {
      for (const mode of ɵMODES) {
        yield {
          name: [
            `version-${String(version).padStart(2, '0')}`,
            `ecc-${errorCorrectionLevel}`,
            'mask-auto',
            `mode-${mode}`,
          ].join('_'),
          data: DATA_BY_MODE[mode].repeat(version),
          mode,
          version: version as QRCodeVersion,
          errorCorrectionLevel,
          eci: false,
        };
      }
    }
  }
}
