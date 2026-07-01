import type {QRCodeMask, QRCodeMatrix, QRCodeModule, QRCodeReservedMatrix} from '../types';
import {MASK_FUNCTIONS} from './const';

/**
 * XOR-masks the data portion of the matrix. Repeating the call with the same
 * arguments will revert the prior call (convenient in the matrix evaluation).
 *
 * @param {QRCodeMatrix} matrix - The matrix whose data portion needs to be masked.
 * @param {QRCodeReservedMatrix} reserved - The reserved portion of the matrix.
 * @param {QRCodeMask} mask - The mask pattern to be applied.
 * @returns {QRCodeMatrix} The matrix with masked data portion.
 */
export function maskMatrixData(
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
