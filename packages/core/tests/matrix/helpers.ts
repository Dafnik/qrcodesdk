import {expect} from 'vitest';

import {augmentBCH} from '../../src/matrix/augment-bch';
import {getGF256GeneratorPolynomial} from '../../src/matrix/error-correction';
import type {
  QRCodeMask,
  QRCodeMatrix,
  QRCodeMutableMatrix,
  QRCodePolynomial,
} from '../../src/types';

export const QR_CODE_MASKS = [0, 1, 2, 3, 4, 5, 6, 7] as const satisfies readonly QRCodeMask[];

// Reference mask predicates in terms of row and column (JIS X 0510:2004 Table 20).
// applyMaskToMatrix implements these directly; tests compare against this table.
export const MASK_FUNCTIONS: readonly ((row: number, column: number) => boolean)[] = [
  (row, column) => (row + column) % 2 === 0,
  (row) => row % 2 === 0,
  (_row, column) => column % 3 === 0,
  (row, column) => (row + column) % 3 === 0,
  (row, column) => (((row / 2) | 0) + ((column / 3) | 0)) % 2 === 0,
  (row, column) => ((row * column) % 2) + ((row * column) % 3) === 0,
  (row, column) => (((row * column) % 2) + ((row * column) % 3)) % 2 === 0,
  (row, column) => (((row + column) % 2) + ((row * column) % 3)) % 2 === 0,
];

export function bitsToBytes(bits: string, maxLength: number): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    bytes.push(Number.parseInt(bits.slice(i, i + 8).padEnd(8, '0'), 2));
  }
  while (bytes.length + 1 < maxLength) bytes.push(0xec, 0x11);
  if (bytes.length < maxLength) bytes.push(0xec);
  return bytes.slice(0, maxLength);
}

export function expectSquareBinaryMatrix(matrix: QRCodeMatrix, size: number): void {
  expect(matrix).toHaveLength(size);
  for (let index = 0; index < matrix.length; index++) {
    const row = matrix[index]!;
    expect(row).toHaveLength(size);
    expect(row.every((value) => value === 0 || value === 1)).toBe(true);
  }
}

export function formatBitsFor(eccLevel: number, mask: QRCodeMask): number[] {
  const code = augmentBCH((eccLevel << 3) | mask, 5, 0x537, 10) ^ 0x5412;
  return Array.from({length: 15}, (_, i) => (code >> i) & 1);
}

export function formatBitsMatch(
  matrix: QRCodeMutableMatrix,
  eccLevel: number,
  mask: QRCodeMask,
): boolean {
  const n = matrix.length;
  const rows = [0, 1, 2, 3, 4, 5, 7, 8, n - 7, n - 6, n - 5, n - 4, n - 3, n - 2, n - 1];
  const columns = [n - 1, n - 2, n - 3, n - 4, n - 5, n - 6, n - 7, n - 8, 7, 5, 4, 3, 2, 1, 0];
  const bits = formatBitsFor(eccLevel, mask);

  return bits.every((bit, i) => matrix[rows[i]][8] === bit && matrix[8][columns[i]] === bit);
}

// Generator polynomials of every degree used by QR codes, indexed by degree (0–30).
export function getGF256GeneratorPolynomials(): QRCodePolynomial[] {
  return Array.from({length: 31}, (_, degree) => getGF256GeneratorPolynomial(degree));
}

// N1+(k-5) points for each consecutive row of k same-colored modules,
// where k >= 5. no overlapping row counts.
const PENALTY_CONSECUTIVE = 3;

// N3 points for each pattern with >4W:1B:1W:3B:1W:1B or
// 1B:1W:3B:1W:1B:>4W.
const PENALTY_FINDER_LIKE = 40;
const FINDER_LIKE_LEFT_PADDING = 0x05d;
const FINDER_LIKE_RIGHT_PADDING = 0x5d0;
const FINDER_LIKE_WINDOW_MASK = 0x7ff;

/**
 * Reference scorer for one row or column, given as alternating light/dark run lengths.
 * Tests compare evaluateMatrix against it.
 *
 * @param {number[]} groups - An array representing the group of modules.
 * @returns {number} The penalty score for the group.
 */
export function evaluateGroup(groups: number[]): number {
  // assumes [W,B,W,B,W,...,B,W]
  let score = 0;

  for (let i = 0; i < groups.length; i++) {
    if (groups[i]! >= 5) score += PENALTY_CONSECUTIVE + (groups[i]! - 5);
  }

  let finderLikeWindow = 0;
  let numberOfModules = 0;
  let lastMatchedModuleIndex = -1;
  for (let i = 0; i < groups.length; i++) {
    const module = i % 2;
    for (let j = 0; j < groups[i]!; j++) {
      finderLikeWindow = ((finderLikeWindow << 1) & FINDER_LIKE_WINDOW_MASK) | module;
      numberOfModules++;
      const isLeftPaddedMatch = finderLikeWindow === FINDER_LIKE_LEFT_PADDING;
      const isRightPaddedMatch = finderLikeWindow === FINDER_LIKE_RIGHT_PADDING;
      if (numberOfModules >= 11 && (isLeftPaddedMatch || isRightPaddedMatch)) {
        if (!(isRightPaddedMatch && lastMatchedModuleIndex === numberOfModules - 4)) {
          score += PENALTY_FINDER_LIKE;
        }
        lastMatchedModuleIndex = numberOfModules;
      }
    }
  }

  return score;
}
