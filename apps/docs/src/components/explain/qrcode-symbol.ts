import type {
  QRCodeErrorCorrectionLevel,
  QRCodeMask,
  QRCodeMatrix,
  QRCodeVersion,
} from '@qrcodesdk/core';
import {QR_CODE_MODULE_ROLES} from '@qrcodesdk/core/matrix';
import type {QRCodeMicroMask, QRCodeMicroVersion} from '@qrcodesdk/core/micro';

import {
  ECC_LEVELS_MAP,
  type QRCodeErrorCorrectionLevelValue,
  type QRCodeMicroLevel,
  type QRCodeMicroVersionNumber,
  applyMaskToMatrix,
  augmentBCH,
  getMicroDataBits,
  getMicroSymbolNumber,
} from './qrcode-core-source.ts';

/** Format information of a standard QR code, read from the matrix. */
export interface QRCodeStandardSymbolFormat {
  readonly family: 'standard';
  readonly size: number;
  readonly version: QRCodeVersion;
  readonly errorCorrectionLevel: QRCodeErrorCorrectionLevel;
  readonly levelValue: QRCodeErrorCorrectionLevelValue;
  readonly mask: QRCodeMask;
  /** The standard mask pattern applied to the data modules. */
  readonly standardMask: QRCodeMask;
}

/** Format information of a Micro QR code, read from the matrix. */
export interface QRCodeMicroSymbolFormat {
  readonly family: 'micro';
  readonly size: number;
  readonly version: QRCodeMicroVersion;
  readonly versionNumber: QRCodeMicroVersionNumber;
  /** `undefined` for M1, which only detects errors. */
  readonly errorCorrectionLevel: Exclude<QRCodeErrorCorrectionLevel, 'H'> | undefined;
  readonly symbolNumber: number;
  readonly mask: QRCodeMicroMask;
  /** The standard mask pattern applied to the data modules. */
  readonly standardMask: QRCodeMask;
  /** Data bits, which exclude the zero low nibble of a final 4-bit data codeword in M1 and M3. */
  readonly dataBits: number;
}

export type QRCodeSymbolFormat = QRCodeStandardSymbolFormat | QRCodeMicroSymbolFormat;

const LEVELS = ['L', 'M', 'Q', 'H'] as const satisfies readonly QRCodeErrorCorrectionLevel[];
const LEVELS_BY_VALUE = Object.fromEntries(
  LEVELS.map((level) => [ECC_LEVELS_MAP[level], level]),
) as Record<QRCodeErrorCorrectionLevelValue, QRCodeErrorCorrectionLevel>;
export const MICRO_VERSIONS = [
  'M1',
  'M2',
  'M3',
  'M4',
] as const satisfies readonly QRCodeMicroVersion[];
// Micro QR masks 0-3 are the standard QR masks 1, 4, 6, and 7 (ISO/IEC 18004:2015 Table 10).
export const MICRO_STANDARD_MASKS = [1, 4, 6, 7] as const satisfies readonly QRCodeMask[];
// Format information is XOR-masked so it is never all zero (ISO/IEC 18004:2015 7.9).
const STANDARD_FORMAT_MASK = 0x5412;
const MICRO_FORMAT_MASK = 0x4445;
const FORMAT_GENERATOR = 0x537;
const SMALLEST_STANDARD_SIZE = 21;

/** Whether a matrix is a Micro QR code. Micro QR codes are square and 11 to 17 modules wide. */
export function isMicroMatrix({width, height}: Pick<QRCodeMatrix, 'width' | 'height'>): boolean {
  return width === height && width < SMALLEST_STANDARD_SIZE;
}

/**
 * Reads the version, error-correction level, and mask from the format information that the encoder
 * wrote, and checks its BCH code. No symbol is regenerated.
 */
export function readSymbolFormat(matrix: QRCodeMatrix): QRCodeSymbolFormat {
  const {width: n, height, modules} = matrix;
  // The explanation covers square symbols only; rMQR codes are not explained.
  if (n !== height) throw new Error('QRCode explain: Rectangular Micro QR codes are not supported');
  if (isMicroMatrix(matrix)) {
    // Bit 14 to bit 7 along row 8 from column 1, and bit 6 to bit 0 up column 8 from row 7.
    let code = 0;
    for (let i = 1; i <= 8; i++) {
      code |= modules[8 * n + i]! << (15 - i);
      if (i < 8) code |= modules[i * n + 8]! << (i - 1);
    }
    const data = checkFormat(code, MICRO_FORMAT_MASK);
    const versionNumber = ((n - 9) / 2) as QRCodeMicroVersionNumber;
    const symbolNumber = data >> 2;
    const mask = (data & 3) as QRCodeMicroMask;
    return {
      family: 'micro',
      size: n,
      version: MICRO_VERSIONS[versionNumber - 1]!,
      versionNumber,
      errorCorrectionLevel: microLevel(versionNumber, symbolNumber),
      symbolNumber,
      mask,
      standardMask: MICRO_STANDARD_MASKS[mask],
      dataBits: getMicroDataBits(versionNumber, symbolNumber),
    };
  }

  // The copy along column 8: bits 0-5 in rows 0-5, bits 6-7 in rows 7-8, bits 8-14 at the bottom.
  let code = 0;
  for (let i = 0; i < 15; i++) {
    code |= modules[(i < 6 ? i : i < 8 ? i + 1 : n - 15 + i) * n + 8]! << i;
  }
  const data = checkFormat(code, STANDARD_FORMAT_MASK);
  const levelValue = (data >> 3) as QRCodeErrorCorrectionLevelValue;
  const mask = (data & 7) as QRCodeMask;
  return {
    family: 'standard',
    size: n,
    version: ((n - 17) / 4) as QRCodeVersion,
    errorCorrectionLevel: LEVELS_BY_VALUE[levelValue],
    levelValue,
    mask,
    standardMask: mask,
  };
}

function checkFormat(code: number, xorMask: number): number {
  const data = (code ^ xorMask) >> 10;
  if ((augmentBCH(data, 5, FORMAT_GENERATOR, 10) ^ xorMask) !== code) {
    throw new Error('QRCode explain: The format information is not a valid BCH code word');
  }
  return data;
}

function microLevel(
  version: QRCodeMicroVersionNumber,
  symbolNumber: number,
): QRCodeMicroSymbolFormat['errorCorrectionLevel'] {
  if (version === 1) return undefined;
  for (let level = 0; level < 3; level++) {
    if (getMicroSymbolNumber(version, level as QRCodeMicroLevel, false) === symbolNumber) {
      return LEVELS[level] as Exclude<QRCodeErrorCorrectionLevel, 'H'>;
    }
  }
  throw new Error('QRCode explain: Unknown Micro QR symbol number');
}

/**
 * Returns the matrix indexes of the data region in placement order: two-module columns from the
 * right, zig-zagging up and down. Standard QR codes skip the vertical timing pattern in column 6;
 * Micro QR codes stop before the timing pattern in column 0. Every module with the data role
 * belongs to the placement path; all other roles are reserved function patterns.
 */
export function createPlacements({width: size, roles}: QRCodeMatrix, micro: boolean): number[] {
  const placements: number[] = [];
  const dataRole = QR_CODE_MODULE_ROLES.data;
  let upward = true;
  for (let right = size - 1; micro ? right > 0 : right >= 0; right -= 2) {
    if (!micro && right === 6) right--;
    const left = right - 1;
    for (let step = 0; step < size; step++) {
      const rowStart = (upward ? size - 1 - step : step) * size;
      if (roles[rowStart + right] === dataRole) placements.push(rowStart + right);
      if (roles[rowStart + left] === dataRole) placements.push(rowStart + left);
    }
    upward = !upward;
  }
  return placements;
}

/** Copies the matrix and removes the selected mask from its data modules. */
export function unmaskModules(
  matrix: QRCodeMatrix,
  format: QRCodeSymbolFormat,
  roles: Uint8Array = matrixRoles(matrix),
): Uint8Array {
  return applyMaskToMatrix(toBytes(matrix.modules), roles, matrix.width, format.standardMask);
}

export function matrixRoles(matrix: QRCodeMatrix): Uint8Array {
  return toBytes(matrix.roles);
}

/** Copies module values. A plain loop is much faster than `Uint8Array.from()` on frozen arrays. */
function toBytes(values: readonly number[]): Uint8Array {
  const length = values.length;
  const bytes = new Uint8Array(length);
  for (let index = 0; index < length; index++) bytes[index] = values[index]!;
  return bytes;
}

/**
 * Returns a function that maps a placement bit to its bit index in the codeword sequence. In M1 and
 * M3 the final data codeword has 4 bits; its zero low nibble counts for error correction but is
 * never placed.
 */
export function createCodewordBitMapper(
  format: QRCodeSymbolFormat,
): (placementBit: number) => number {
  if (format.family === 'standard') return (placementBit) => placementBit;
  const {dataBits} = format;
  const omitted = omittedBitCount(format);
  return (placementBit) => (placementBit < dataBits ? placementBit : placementBit + omitted);
}

/** Zero bits of the final 4-bit data codeword that error correction counts but placement skips. */
export function omittedBitCount(format: QRCodeMicroSymbolFormat): number {
  return ((format.dataBits + 7) & ~7) - format.dataBits;
}
