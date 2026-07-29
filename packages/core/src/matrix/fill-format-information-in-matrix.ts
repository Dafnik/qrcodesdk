import type {
  QRCodeErrorCorrectionLevelValue,
  QRCodeMask,
  QRCodeModule,
  QRCodeMutableMatrix,
} from '../types';
import {augmentBCH} from './augment-bch';
import {getQRCodeFormatInformationCoordinates} from './format-information';

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

  const coordinates = getQRCodeFormatInformationCoordinates(n);
  for (let i = 0; i < coordinates.length; i++) {
    const [[firstRow, firstColumn], [secondRow, secondColumn]] = coordinates[i]!;
    matrix[firstRow]![firstColumn] = matrix[secondRow]![secondColumn] = ((code >> i) &
      1) as QRCodeModule;
    // we don't have to mark those bits reserved; always done in createBaseMatrix above.
  }
  return matrix;
}
