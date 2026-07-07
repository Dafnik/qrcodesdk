import type {
  QRCodeErrorCorrectionLevelValue,
  QRCodeMask,
  QRCodeMatrix,
  QRCodeModule,
} from '../types';
import {augmentBCH} from './augment-bch';

/**
 * Puts the format information into the matrix.
 *
 * @param {QRCodeMatrix} matrix - The matrix to be filled with format information.
 * @param {QRCodeErrorCorrectionLevelValue} ecclevel - The error correction level.
 * @param {QRCodeMask} mask - The mask pattern.
 * @returns {QRCodeMatrix} The matrix with format information filled in.
 */
export function fillFormatInformationInMatrix(
  matrix: QRCodeMatrix,
  ecclevel: QRCodeErrorCorrectionLevelValue,
  mask: QRCodeMask,
): QRCodeMatrix {
  const n: number = matrix.length,
    code: number = augmentBCH((ecclevel << 3) | mask, 5, 0x537, 10) ^ 0x5412;

  for (let i = 0; i < 15; i++) {
    const r = [0, 1, 2, 3, 4, 5, 7, 8, n - 7, n - 6, n - 5, n - 4, n - 3, n - 2, n - 1][i]!;
    const c = [n - 1, n - 2, n - 3, n - 4, n - 5, n - 6, n - 7, n - 8, 7, 5, 4, 3, 2, 1, 0][i]!;
    matrix[r]![8] = matrix[8]![c] = ((code >> i) & 1) as QRCodeModule;
    // we don't have to mark those bits reserved; always done in createBaseMatrix above.
  }
  return matrix;
}
