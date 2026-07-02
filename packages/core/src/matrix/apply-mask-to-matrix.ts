import type {QRCodeMask, QRCodeMatrix, QRCodeModule, QRCodeReservedMatrix} from '../types';
import {MASK_FUNCTIONS} from './const';

/**
 * Applies a QR mask to the data portion of a matrix.
 */
export function applyMaskToMatrix(
  matrix: QRCodeMatrix,
  reserved: QRCodeReservedMatrix,
  mask: QRCodeMask,
): QRCodeMatrix {
  const maskFunction = MASK_FUNCTIONS[mask];
  const n = matrix.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (!reserved[i][j]) {
        matrix[i][j] = (matrix[i][j] ^ (maskFunction(i, j) ? 1 : 0)) as QRCodeModule;
      }
    }
  }
  return matrix;
}
