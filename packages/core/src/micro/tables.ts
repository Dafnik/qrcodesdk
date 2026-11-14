/** Micro QR versions M1 to M4 as numbers. */
export type QRCodeMicroVersionNumber = 1 | 2 | 3 | 4;

/** Error-correction level index for Micro QR codes: `0` L, `1` M, `2` Q, and `3` H. */
export type QRCodeMicroLevel = 0 | 1 | 2 | 3;

// Symbol numbers (ISO/IEC 18004:2015 Table 13): M1, M2-L, M2-M, M3-L, M3-M, M4-L, M4-M, M4-Q.
const FIRST_SYMBOL_NUMBER = [0, 1, 3, 5] as const;
const LEVEL_COUNT = [1, 2, 2, 3] as const;
// Error-correction codewords by symbol number (ISO/IEC 18004:2015 Table 9).
const ERROR_CORRECTION_CODEWORDS = [2, 5, 6, 6, 8, 8, 10, 14] as const;
const TOTAL_CODEWORDS = [5, 10, 17, 24] as const;

/**
 * Returns the symbol number of a version and level, or -1 when the version does not support the
 * level. M1 only detects errors and meets no level, so automatic selection skips it, while an
 * explicitly requested M1 accepts level L or M.
 */
export function getMicroSymbolNumber(
  version: QRCodeMicroVersionNumber,
  level: QRCodeMicroLevel,
  explicit: boolean,
): number {
  if (version === 1) return explicit && level < 2 ? 0 : -1;
  return level < LEVEL_COUNT[version - 1]! ? FIRST_SYMBOL_NUMBER[version - 1]! + level : -1;
}

export function getMicroErrorCorrectionCodewords(symbolNumber: number): number {
  return ERROR_CORRECTION_CODEWORDS[symbolNumber]!;
}

export function getMicroDataCodewords(
  version: QRCodeMicroVersionNumber,
  symbolNumber: number,
): number {
  return TOTAL_CODEWORDS[version - 1]! - ERROR_CORRECTION_CODEWORDS[symbolNumber]!;
}

/** M1 and M3 end their data with a 4-bit codeword. */
export function getMicroDataBits(version: QRCodeMicroVersionNumber, symbolNumber: number): number {
  return getMicroDataCodewords(version, symbolNumber) * 8 - (version & 1) * 4;
}

export function getMicroSize(version: QRCodeMicroVersionNumber): number {
  return version * 2 + 9;
}
