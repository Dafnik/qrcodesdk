import type {
  QRCodeCodewords,
  QRCodeModule,
  QRCodeMutableMatrix,
  QRCodeReservedMatrix,
  QRCodeVersion,
} from '../types';
import {augmentBCH} from './augment-bch';
import {getSizeByVersion} from './get-size-by-version';
import {needsVersionInfo} from './needs-version-info';
import {VERSIONS} from './version-config';

type QRCodeMatrixBuildState = {
  matrix: QRCodeMutableMatrix;
  reserved: QRCodeReservedMatrix;
};

/**
 * Creates the base matrix for a given version of the QR code. It returns two matrices,
 * one of which is the actual matrix and the other represents the "reserved" portion
 * (e.g., finder and timing patterns) of the matrix.
 *
 * Rows are initialized densely to keep subsequent data placement, masking, and
 * rendering on V8's packed-array fast path. `fillDataInMatrix` overwrites every
 * non-reserved module before the matrix is returned publicly.
 *
 * @param {QRCodeVersion} version - The version number of the QR code.
 * @returns {QRCodeMatrixBuildState} The base matrix and the reserved portion matrix.
 */
export function createBaseMatrix(version: QRCodeVersion): QRCodeMatrixBuildState {
  const v = VERSIONS[version] ?? [[-100]],
    sizeOfVersion = getSizeByVersion(version),
    matrix: QRCodeMutableMatrix = [],
    reserved: QRCodeReservedMatrix = [];

  for (let i = 0; i < sizeOfVersion; i++) {
    matrix.push(new Array<QRCodeModule>(sizeOfVersion).fill(0));
    reserved.push(new Array<QRCodeModule>(sizeOfVersion).fill(0));
  }

  const blit = function (y: number, x: number, h: number, w: number, bits: QRCodeCodewords): void {
    for (let i = 0; i < h; i++) {
      const matrixRow = matrix[y + i]!;
      const reservedRow = reserved[y + i]!;
      for (let j = 0; j < w; j++) {
        matrixRow[x + j] = ((bits[i]! >> j) & 1) as QRCodeModule;
        reservedRow[x + j] = 1;
      }
    }
  };

  // finder patterns and a part of timing patterns
  // will also mark the format information area (not yet written) as reserved.
  blit(0, 0, 9, 9, [0x7f, 0x41, 0x5d, 0x5d, 0x5d, 0x41, 0x17f, 0x00, 0x40]);
  blit(sizeOfVersion - 8, 0, 8, 9, [0x100, 0x7f, 0x41, 0x5d, 0x5d, 0x5d, 0x41, 0x7f]);
  blit(0, sizeOfVersion - 8, 9, 8, [0xfe, 0x82, 0xba, 0xba, 0xba, 0x82, 0xfe, 0x00, 0x00]);

  // the rest of timing patterns
  for (let i = 9; i < sizeOfVersion - 8; i++) {
    matrix[6]![i] = matrix[i]![6] = (~i & 1) as QRCodeModule;
    reserved[6]![i] = reserved[i]![6] = 1;
  }

  // alignment patterns
  const alignmentPatterns = v[2]!,
    m = alignmentPatterns.length;

  for (let i = 0; i < m; i++) {
    const minJ = i == 0 || i == m - 1 ? 1 : 0,
      maxJ = i == 0 ? m - 1 : m;
    for (let j = minJ; j < maxJ; j++) {
      blit(alignmentPatterns[i]!, alignmentPatterns[j]!, 5, 5, [0x1f, 0x11, 0x15, 0x11, 0x1f]);
    }
  }

  // version information
  if (needsVersionInfo(version)) {
    const code = augmentBCH(version, 6, 0x1f25, 12);
    let k = 0;
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        matrix[i]![sizeOfVersion - 11 + j] = matrix[sizeOfVersion - 11 + j]![i] = ((code >> k++) &
          1) as QRCodeModule;
        reserved[i]![sizeOfVersion - 11 + j] = reserved[sizeOfVersion - 11 + j]![i] = 1;
      }
    }
  }

  return {matrix, reserved};
}
