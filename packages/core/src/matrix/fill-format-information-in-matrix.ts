import type {
  QRCodeErrorCorrectionLevelValue,
  QRCodeMask,
  QRCodeModule,
  QRCodeMutableMatrix,
} from '../types';
import {augmentBCH} from './augment-bch';

/**
 * Puts the format information into the matrix.
 *
 * @param {QRCodeMutableMatrix} matrix - The matrix to be filled with format information.
 * @param {QRCodeErrorCorrectionLevelValue} ecclevel - The error correction level.
 * @param {QRCodeMask} mask - The mask pattern.
 * @returns {QRCodeMutableMatrix} The matrix with format information filled in.
 */
export function fillFormatInformationInMatrix(
  matrix: QRCodeMutableMatrix,
  ecclevel: QRCodeErrorCorrectionLevelValue,
  mask: QRCodeMask,
): QRCodeMutableMatrix {
  const n: number = matrix.length,
    code: number = augmentBCH((ecclevel << 3) | mask, 5, 0x537, 10) ^ 0x5412;

  for (let i = 0; i < 15; i++) {
    // we don't have to mark those bits reserved; always done in createBaseMatrix above.
    matrix[i < 6 ? i : i < 8 ? i + 1 : n - 15 + i]![8] = matrix[8]![
      i < 8 ? n - 1 - i : i === 8 ? 7 : 14 - i
    ] = ((code >> i) & 1) as QRCodeModule;
  }
  return matrix;
}
