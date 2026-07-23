import {expect} from 'vitest';

import {augmentBCH} from '../../src/matrix/augment-bch';
import type {QRCodeMask, QRCodeMatrix, QRCodeMutableMatrix} from '../../src/types';

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
