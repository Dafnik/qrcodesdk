import type {QRCodeMask, QRCodeMatrix, QRCodeModule, QRCodeReservedMatrix} from '../types';
import {MASK_FUNCTIONS} from './mask';

/**
 * Applies a QR mask to the data portion of a matrix.
 */
export function applyMaskToMatrix(
  matrix: QRCodeMatrix,
  reserved: QRCodeReservedMatrix,
  mask: QRCodeMask,
): QRCodeMatrix {
  const n = matrix.length;

  if (mask < 3) {
    const rowStep = mask === 1 ? 2 : 1;
    const columnStep = mask === 2 ? 3 : mask === 0 ? 2 : 1;
    for (let i = 0; i < n; i += rowStep) {
      const matrixRow = matrix[i]!;
      const reservedRow = reserved[i]!;
      const columnStart = mask === 0 ? i & 1 : 0;
      for (let j = columnStart; j < n; j += columnStep) {
        if (!reservedRow[j]) matrixRow[j] = (matrixRow[j]! ^ 1) as QRCodeModule;
      }
    }
    return matrix;
  }

  const maskFunction = MASK_FUNCTIONS[mask]!;
  for (let i = 0; i < n; i++) {
    const matrixRow = matrix[i]!;
    const reservedRow = reserved[i]!;
    for (let j = 0; j < n; j++) {
      if (!reservedRow[j] && maskFunction(i, j)) {
        matrixRow[j] = (matrixRow[j]! ^ 1) as QRCodeModule;
      }
    }
  }
  return matrix;
}
