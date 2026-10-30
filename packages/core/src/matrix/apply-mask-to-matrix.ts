import type {QRCodeMask, QRCodeModule, QRCodeMutableMatrix, QRCodeReservedMatrix} from '../types';

/**
 * Applies a QR mask to the data portion of a matrix.
 */
export function applyMaskToMatrix(
  matrix: QRCodeMutableMatrix,
  reserved: QRCodeReservedMatrix,
  mask: QRCodeMask,
): QRCodeMutableMatrix {
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

  // Inline the remaining predicates (JIS X 0510:2004 Table 20). Calling MASK_FUNCTIONS
  // here sees five closures at one call site, which V8 cannot inline.
  for (let i = 0; i < n; i++) {
    const matrixRow = matrix[i]!;
    const reservedRow = reserved[i]!;
    for (let j = 0; j < n; j++) {
      const product = i * j;
      if (
        !reservedRow[j] &&
        (mask === 3
          ? (i + j) % 3 === 0
          : mask === 4
            ? (((i >> 1) + ((j / 3) | 0)) & 1) === 0
            : mask === 5
              ? product % 6 === 0
              : mask === 6
                ? (((product & 1) + (product % 3)) & 1) === 0
                : ((((i + j) & 1) + (product % 3)) & 1) === 0)
      ) {
        matrixRow[j] = (matrixRow[j]! ^ 1) as QRCodeModule;
      }
    }
  }
  return matrix;
}
