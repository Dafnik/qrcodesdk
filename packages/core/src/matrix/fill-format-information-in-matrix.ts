import type {QRCodeErrorCorrectionLevelValue, QRCodeMask} from '../types';
import {augmentBCH} from './augment-bch';

/**
 * Puts the format information into the matrix.
 */
export function fillFormatInformationInMatrix(
  modules: Uint8Array,
  n: number,
  ecclevel: QRCodeErrorCorrectionLevelValue,
  mask: QRCodeMask,
): Uint8Array {
  const code: number = augmentBCH((ecclevel << 3) | mask, 5, 0x537, 10) ^ 0x5412;

  for (let i = 0; i < 15; i++) {
    const bit = (code >> i) & 1;
    // Column 8, top to bottom, and row 8, right to left.
    modules[(i < 6 ? i : i < 8 ? i + 1 : n - 15 + i) * n + 8] = bit;
    modules[8 * n + (i < 8 ? n - 1 - i : i === 8 ? 7 : 14 - i)] = bit;
  }
  return modules;
}
