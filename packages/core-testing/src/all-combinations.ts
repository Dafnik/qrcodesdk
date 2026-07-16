import type {
  QRCodeErrorCorrectionLevel,
  QRCodeMask,
  QRCodeMode,
  QRCodeVersion,
} from '@qrcodesdk/core';

const ERROR_CORRECTION_LEVELS = [
  'L',
  'M',
  'Q',
  'H',
] as const satisfies readonly QRCodeErrorCorrectionLevel[];

const MASKS = [0, 1, 2, 3, 4, 5, 6, 7] as const satisfies readonly QRCodeMask[];

const MODES = ['numeric', 'alphanumeric', 'octet'] as const satisfies readonly QRCodeMode[];

const DATA_BY_MODE = {
  numeric: '1',
  alphanumeric: 'A',
  octet: 'A',
} as const satisfies Record<QRCodeMode, string>;

export type QRCodeCombination = {
  name: string;
  data: string;
  mode: QRCodeMode;
  version: QRCodeVersion;
  mask: QRCodeMask;
  errorCorrectionLevel: QRCodeErrorCorrectionLevel;
};

export const TOTAL_QR_CODE_COMBINATIONS =
  40 * ERROR_CORRECTION_LEVELS.length * MASKS.length * MODES.length;

export function* getAllQRCodeCombinations(): Generator<QRCodeCombination> {
  for (let version = 1; version <= 40; version += 1) {
    for (const errorCorrectionLevel of ERROR_CORRECTION_LEVELS) {
      for (const mask of MASKS) {
        for (const mode of MODES) {
          yield {
            name: [
              `version-${String(version).padStart(2, '0')}`,
              `ecc-${errorCorrectionLevel}`,
              `mask-${mask}`,
              `mode-${mode}`,
            ].join('_'),
            data: DATA_BY_MODE[mode],
            mode,
            version: version as QRCodeVersion,
            mask,
            errorCorrectionLevel,
          };
        }
      }
    }
  }
}
