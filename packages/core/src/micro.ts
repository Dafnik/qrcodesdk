import type {QRCodeMatrixGenerator} from './matrix/types';
import {generateMicroQRCodeMatrix} from './micro/generate';
import type {QRCodeMicroVersionNumber} from './micro/tables';
import {throwInvalid} from './options';
import type {QRCodeSymbol} from './types';

export type {QRCodeSymbol, QRCodeSymbolMatrixOptions} from './types';

/** Micro QR code versions, from the 11 × 11 M1 to the 17 × 17 M4. */
export type QRCodeMicroVersion = 'M1' | 'M2' | 'M3' | 'M4';

/** Micro QR code mask patterns. */
export type QRCodeMicroMask = 0 | 1 | 2 | 3;

export type QRCodeMicroOptions = {
  /** Defaults to the smallest version that holds the payload at the error-correction level. */
  readonly version?: QRCodeMicroVersion;
  /** Defaults to the mask with the best edge score. */
  readonly mask?: QRCodeMicroMask;
  /**
   * Generates a standard QR code when no Micro QR code can hold the payload at the
   * error-correction level. Defaults to `false`, which throws instead.
   */
  readonly fallback?: boolean;
};

const VERSIONS: readonly QRCodeMicroVersion[] = ['M1', 'M2', 'M3', 'M4'];

/**
 * Selects a Micro QR code as the symbol, for `symbol` in the matrix options. Micro QR codes hold up
 * to 35 digits, 21 alphanumeric characters, 15 bytes, or 9 Kanji characters, and need a quiet zone
 * of only 2 modules.
 * M1 only detects errors, so it is used only when requested with `version: 'M1'`.
 */
export function microQR(options?: QRCodeMicroOptions): QRCodeSymbol {
  const {version, mask, fallback = false} = options ?? {};
  const versionNumber = (VERSIONS.indexOf(version!) + 1) as QRCodeMicroVersionNumber | 0;
  if (version !== undefined && !versionNumber) {
    throwInvalid('microQR.version', 'M1, M2, M3, or M4', version);
  }
  if (mask !== undefined && !(Number.isInteger(mask) && mask >= 0 && mask <= 3)) {
    throwInvalid('microQR.mask', 'an integer from 0 to 3', mask);
  }
  if (typeof fallback !== 'boolean') throwInvalid('microQR.fallback', 'a boolean', fallback);

  return ((payload, matrixOptions) =>
    generateMicroQRCodeMatrix(
      payload,
      matrixOptions,
      versionNumber || undefined,
      mask,
      fallback,
    )) satisfies QRCodeMatrixGenerator as unknown as QRCodeSymbol;
}
