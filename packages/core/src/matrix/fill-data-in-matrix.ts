import type {
  QRCodeCodewords,
  QRCodeMatrix,
  QRCodeModule,
  QRCodeMutableMatrix,
  QRCodeReservedMatrix,
} from '../types';

/**
 * Fills the data portion (i.e., unmarked in reserved) of the matrix with given
 * code words. The size of code words should be no more than available bits,
 * and remaining bits are padded to 0 (cf. JIS X 0510:2004 sec 8.7.3).
 *
 * @param {QRCodeMutableMatrix} matrix - The matrix to be filled with data.
 * @param {QRCodeReservedMatrix} reserved - The reserved portion of the matrix.
 * @param {QRCodeCodewords} buffer - The code words to be filled into the matrix.
 * @returns {QRCodeMatrix} The matrix with data filled in.
 */
export function fillDataInMatrix(
  matrix: QRCodeMutableMatrix,
  reserved: QRCodeReservedMatrix,
  buffer: QRCodeCodewords,
): QRCodeMatrix {
  const n = matrix.length;
  let k = 0,
    dir = -1;
  for (let i = n - 1; i >= 0; i -= 2) {
    if (i == 6) i--; // skip the entire timing pattern column
    let jj = dir < 0 ? n - 1 : 0;
    for (let j = 0; j < n; j++) {
      for (let ii = i; ii > i - 2; --ii) {
        if (!reserved[jj]![ii]) {
          // may overflow, but (undefined >> x)
          // is 0, so it will auto-pad to zero.
          matrix[jj]![ii] = (((buffer[k >> 3] ?? 0) >> (~k & 7)) & 1) as QRCodeModule;
          ++k;
        }
      }
      jj += dir;
    }
    dir = -dir;
  }
  return matrix as QRCodeMatrix;
}
