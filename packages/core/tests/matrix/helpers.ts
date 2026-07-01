import {create} from 'qrcode';
import {expect} from 'vitest';

import {augmentBCH} from '../../src/matrix/augment-bch';
import type {
  QRCodeErrorCorrectionLevel,
  QRCodeMask,
  QRCodeMatrix,
  QRCodeMode,
} from '../../src/types';

export const ECC_LEVELS: QRCodeErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H'];
export const MASKS: QRCodeMask[] = [0, 1, 2, 3, 4, 5, 6, 7];

export function bitsToBytes(bits: string, maxLength: number): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    bytes.push(Number.parseInt(bits.slice(i, i + 8).padEnd(8, '0'), 2));
  }
  while (bytes.length + 1 < maxLength) bytes.push(0xec, 0x11);
  if (bytes.length < maxLength) bytes.push(0xec);
  return bytes.slice(0, maxLength);
}

export function referenceMatrix(
  data: string,
  options: {
    mode?: QRCodeMode;
    version?: number;
    errorCorrectionLevel?: QRCodeErrorCorrectionLevel;
    mask?: QRCodeMask;
  } = {},
): QRCodeMatrix {
  const encodedData =
    options.mode === 'numeric'
      ? [{mode: 'numeric' as const, data}]
      : options.mode === 'alphanumeric'
        ? [{mode: 'alphanumeric' as const, data}]
        : options.mode === 'octet'
          ? [{mode: 'byte' as const, data: new TextEncoder().encode(data)}]
          : data;

  const qr = create(encodedData, {
    errorCorrectionLevel: options.errorCorrectionLevel ?? 'L',
    maskPattern: options.mask,
    version: options.version,
  });

  return Array.from({length: qr.modules.size}, (_, row) =>
    Array.from({length: qr.modules.size}, (_, column) => Number(qr.modules.get(row, column))),
  ) as QRCodeMatrix;
}

export function expectSquareBinaryMatrix(matrix: QRCodeMatrix, size: number): void {
  expect(matrix).toHaveLength(size);
  for (const row of matrix) {
    expect(row).toHaveLength(size);
    expect(row.every((value) => value === 0 || value === 1)).toBe(true);
  }
}

export function formatBitsFor(eccLevel: number, mask: QRCodeMask): number[] {
  const code = augmentBCH((eccLevel << 3) | mask, 5, 0x537, 10) ^ 0x5412;
  return Array.from({length: 15}, (_, i) => (code >> i) & 1);
}

export function formatBitsMatch(matrix: QRCodeMatrix, eccLevel: number, mask: QRCodeMask): boolean {
  const n = matrix.length;
  const rows = [0, 1, 2, 3, 4, 5, 7, 8, n - 7, n - 6, n - 5, n - 4, n - 3, n - 2, n - 1];
  const columns = [n - 1, n - 2, n - 3, n - 4, n - 5, n - 6, n - 7, n - 8, 7, 5, 4, 3, 2, 1, 0];
  const bits = formatBitsFor(eccLevel, mask);

  return bits.every((bit, i) => matrix[rows[i]][8] === bit && matrix[8][columns[i]] === bit);
}
