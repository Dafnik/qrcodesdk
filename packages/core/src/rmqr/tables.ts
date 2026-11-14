import {MODE_ALPHANUMERIC, MODE_NUMERIC, MODE_OCTET} from '../matrix/mode';
import type {QRCodeSupportedModeIndicator} from '../matrix/types';

/**
 * rMQR tables from ISO/IEC 23941:2022, indexed by the version indicator 0 (R7x43) to 31
 * (R17x139). The values were cross-checked against zint and ZXing-C++, whose rMQR encoders and
 * decoders cite the same tables.
 */

/** Version indicator from 0 (R7x43) to 31 (R17x139). */
export type QRCodeRMQRVersionIndex = number;

/** Error-correction level index for rMQR codes: `0` M and `1` H. */
export type QRCodeRMQRLevel = 0 | 1;

export const RMQR_VERSION_COUNT = 32;

// Table 1: symbol sizes.
const HEIGHTS = [
  7, 7, 7, 7, 7, 9, 9, 9, 9, 9, 11, 11, 11, 11, 11, 11, 13, 13, 13, 13, 13, 13, 15, 15, 15, 15, 15,
  17, 17, 17, 17, 17,
] as const;
const WIDTHS = [
  43, 59, 77, 99, 139, 43, 59, 77, 99, 139, 27, 43, 59, 77, 99, 139, 27, 43, 59, 77, 99, 139, 43,
  59, 77, 99, 139, 43, 59, 77, 99, 139,
] as const;
// Table 1: total codewords.
const TOTAL_CODEWORDS = [
  13, 21, 32, 44, 68, 21, 33, 49, 66, 99, 15, 31, 47, 67, 89, 132, 21, 41, 60, 85, 113, 166, 51, 74,
  103, 136, 199, 61, 88, 122, 160, 232,
] as const;
// Table 6: data codewords at levels M and H.
const DATA_CODEWORDS = [
  [
    6, 12, 20, 28, 44, 12, 21, 31, 42, 63, 7, 19, 31, 43, 57, 84, 12, 27, 38, 53, 73, 106, 33, 48,
    67, 88, 127, 39, 56, 78, 100, 152,
  ],
  [
    3, 7, 10, 14, 24, 7, 11, 17, 22, 33, 5, 11, 15, 23, 29, 42, 7, 13, 20, 29, 35, 54, 15, 26, 31,
    48, 69, 21, 28, 38, 56, 76,
  ],
] as const;
// Table 8: error-correction blocks at levels M and H. Blocks of one version and level hold the same
// number of error-correction codewords, and their data codewords differ by at most one.
const BLOCKS = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 3, 1, 1, 2, 2, 3, 1, 2, 2, 3, 4],
  [1, 1, 1, 1, 2, 1, 1, 2, 2, 3, 1, 1, 2, 2, 2, 3, 1, 1, 2, 2, 3, 4, 2, 2, 3, 4, 5, 2, 2, 3, 4, 6],
] as const;
// Table 3: character count indicator bits for numeric, alphanumeric, byte, and Kanji modes.
const CHARACTER_COUNT_BITS = [
  [4, 5, 6, 7, 7, 5, 6, 7, 7, 8, 4, 6, 7, 7, 8, 8, 5, 6, 7, 7, 8, 8, 7, 7, 8, 8, 9, 7, 8, 8, 8, 9],
  [3, 5, 5, 6, 6, 5, 5, 6, 6, 7, 4, 5, 6, 6, 7, 7, 5, 6, 6, 7, 7, 8, 6, 7, 7, 7, 8, 6, 7, 7, 8, 8],
  [3, 4, 5, 5, 6, 4, 5, 5, 6, 6, 3, 5, 5, 6, 6, 7, 4, 5, 6, 6, 7, 7, 6, 6, 7, 7, 7, 6, 6, 7, 7, 8],
  [2, 3, 4, 5, 5, 3, 4, 5, 5, 6, 2, 4, 5, 5, 6, 6, 3, 5, 5, 6, 6, 7, 5, 5, 6, 6, 7, 5, 6, 6, 6, 7],
] as const;
// Table D.1: center columns of the alignment patterns by symbol width.
const ALIGNMENT_COLUMNS: Readonly<Record<number, readonly number[]>> = {
  27: [],
  43: [21],
  59: [19, 39],
  77: [25, 51],
  99: [23, 49, 75],
  139: [27, 55, 83, 111],
};

export function getRMQRHeight(version: QRCodeRMQRVersionIndex): number {
  return HEIGHTS[version]!;
}

export function getRMQRWidth(version: QRCodeRMQRVersionIndex): number {
  return WIDTHS[version]!;
}

/** The version name, such as `R7x43`. */
export function getRMQRVersionName(version: QRCodeRMQRVersionIndex): string {
  return `R${String(HEIGHTS[version])}x${String(WIDTHS[version])}`;
}

export function getRMQRTotalCodewords(version: QRCodeRMQRVersionIndex): number {
  return TOTAL_CODEWORDS[version]!;
}

export function getRMQRDataCodewords(
  version: QRCodeRMQRVersionIndex,
  level: QRCodeRMQRLevel,
): number {
  return DATA_CODEWORDS[level][version]!;
}

export function getRMQRBlockCount(version: QRCodeRMQRVersionIndex, level: QRCodeRMQRLevel): number {
  return BLOCKS[level][version]!;
}

export function getRMQRCharacterCountBits(
  version: QRCodeRMQRVersionIndex,
  mode: QRCodeSupportedModeIndicator,
): number {
  const index =
    mode === MODE_NUMERIC ? 0 : mode === MODE_ALPHANUMERIC ? 1 : mode === MODE_OCTET ? 2 : 3;
  return CHARACTER_COUNT_BITS[index][version]!;
}

export function getRMQRAlignmentColumns(width: number): readonly number[] {
  return ALIGNMENT_COLUMNS[width]!;
}
