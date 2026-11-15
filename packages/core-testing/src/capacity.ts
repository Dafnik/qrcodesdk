import type {QRCodeEncodingMode, QRCodeErrorCorrectionLevel, QRCodeVersion} from '@qrcodesdk/core';
import type {QRCodeMicroVersion} from '@qrcodesdk/core/micro';
import type {QRCodeRMQRVersion} from '@qrcodesdk/core/rmqr';

/**
 * Data codewords per version and ECC level (L, M, Q, H), from ISO/IEC 18004 table 7.
 *
 * Kept independent of `@qrcodesdk/core` so fixtures act as an oracle for its capacity logic.
 */
const DATA_CODEWORDS: readonly (readonly [number, number, number, number])[] = [
  [19, 16, 13, 9],
  [34, 28, 22, 16],
  [55, 44, 34, 26],
  [80, 64, 48, 36],
  [108, 86, 62, 46],
  [136, 108, 76, 60],
  [156, 124, 88, 66],
  [194, 154, 110, 86],
  [232, 182, 132, 100],
  [274, 216, 154, 122],
  [324, 254, 180, 140],
  [370, 290, 206, 158],
  [428, 334, 244, 180],
  [461, 365, 261, 197],
  [523, 415, 295, 223],
  [589, 453, 325, 253],
  [647, 507, 367, 283],
  [721, 563, 397, 313],
  [795, 627, 445, 341],
  [861, 669, 485, 385],
  [932, 714, 512, 406],
  [1006, 782, 568, 442],
  [1094, 860, 614, 464],
  [1174, 914, 664, 514],
  [1276, 1000, 718, 538],
  [1370, 1062, 754, 596],
  [1468, 1128, 808, 628],
  [1531, 1193, 871, 661],
  [1631, 1267, 911, 701],
  [1735, 1373, 985, 745],
  [1843, 1455, 1033, 793],
  [1955, 1541, 1115, 845],
  [2071, 1631, 1171, 901],
  [2191, 1725, 1231, 961],
  [2306, 1812, 1286, 986],
  [2434, 1914, 1354, 1054],
  [2566, 1992, 1426, 1096],
  [2702, 2102, 1502, 1142],
  [2812, 2216, 1582, 1222],
  [2956, 2334, 1666, 1276],
];

const ECC_LEVEL_INDEX = {L: 0, M: 1, Q: 2, H: 3} as const satisfies Record<
  QRCodeErrorCorrectionLevel,
  number
>;

const CHARACTER_COUNT_BITS = {
  numeric: [10, 12, 14],
  alphanumeric: [9, 11, 13],
  octet: [8, 16, 16],
  kanji: [8, 10, 12],
} as const satisfies Record<QRCodeEncodingMode, readonly [number, number, number]>;

const MODE_INDICATOR_BITS = 4;
const UTF8_ECI_HEADER_BITS = 12;

/**
 * Returns the largest single-segment payload that fits the given symbol.
 *
 * The result counts characters for numeric, alphanumeric, and Kanji mode and bytes for octet mode.
 * With `eci`, octet payloads reserve room for the UTF-8 ECI header.
 */
export function fixtureCapacity(
  version: QRCodeVersion,
  errorCorrectionLevel: QRCodeErrorCorrectionLevel,
  mode: QRCodeEncodingMode,
  eci = false,
): number {
  const versionGroup = version <= 9 ? 0 : version <= 26 ? 1 : 2;
  const dataBits =
    DATA_CODEWORDS[version - 1]![ECC_LEVEL_INDEX[errorCorrectionLevel]] * 8 -
    MODE_INDICATOR_BITS -
    CHARACTER_COUNT_BITS[mode][versionGroup] -
    (eci && mode === 'octet' ? UTF8_ECI_HEADER_BITS : 0);
  return capacityOfBits(dataBits, mode);
}

/** Returns how many characters (or bytes in octet mode) of a mode fit into `dataBits`. */
function capacityOfBits(dataBits: number, mode: QRCodeEncodingMode): number {
  switch (mode) {
    case 'numeric': {
      // Three digits use 10 bits; a trailing pair uses 7 and a single digit 4.
      const remainder = dataBits % 10;
      return Math.floor(dataBits / 10) * 3 + (remainder >= 7 ? 2 : remainder >= 4 ? 1 : 0);
    }
    case 'alphanumeric':
      // Two characters use 11 bits; a trailing character uses 6.
      return Math.floor(dataBits / 11) * 2 + (dataBits % 11 >= 6 ? 1 : 0);
    case 'octet':
      return Math.floor(dataBits / 8);
    case 'kanji':
      return Math.floor(dataBits / 13);
  }
}

/**
 * Micro QR data capacity per symbol and mode (numeric, alphanumeric, octet, Kanji), from
 * ISO/IEC 18004 table 7. `0` marks a mode that the symbol does not support.
 */
const MICRO_CAPACITY = {
  M1: [5, 0, 0, 0],
  'M2-L': [10, 6, 0, 0],
  'M2-M': [8, 5, 0, 0],
  'M3-L': [23, 14, 9, 6],
  'M3-M': [18, 11, 7, 4],
  'M4-L': [35, 21, 15, 9],
  'M4-M': [30, 18, 13, 8],
  'M4-Q': [21, 13, 9, 5],
} as const satisfies Record<string, readonly [number, number, number, number]>;

const MODE_INDEX = {numeric: 0, alphanumeric: 1, octet: 2, kanji: 3} as const satisfies Record<
  QRCodeEncodingMode,
  number
>;

/**
 * Returns the largest single-segment payload that fits the given Micro QR symbol, or `0` when the
 * symbol does not support the mode. M1 only detects errors, so it ignores `errorCorrectionLevel`.
 *
 * The result counts characters for numeric, alphanumeric, and Kanji mode and bytes for octet mode.
 */
export function fixtureMicroCapacity(
  version: QRCodeMicroVersion,
  errorCorrectionLevel: QRCodeErrorCorrectionLevel,
  mode: QRCodeEncodingMode,
): number {
  const symbol = version === 'M1' ? version : `${version}-${errorCorrectionLevel}`;
  const capacities = (MICRO_CAPACITY as Record<string, readonly number[] | undefined>)[symbol];
  if (!capacities)
    throw new Error(`Micro QR ${version} does not support level ${errorCorrectionLevel}`);
  return capacities[MODE_INDEX[mode]]!;
}

/** rMQR versions in version-indicator order, from ISO/IEC 23941 table 1. */
export const RMQR_VERSIONS = (
  [
    [7, [43, 59, 77, 99, 139]],
    [9, [43, 59, 77, 99, 139]],
    [11, [27, 43, 59, 77, 99, 139]],
    [13, [27, 43, 59, 77, 99, 139]],
    [15, [43, 59, 77, 99, 139]],
    [17, [43, 59, 77, 99, 139]],
  ] as const
).flatMap(([height, widths]) =>
  widths.map((width) => `R${String(height)}x${String(width)}` as QRCodeRMQRVersion),
);

/** rMQR data codewords per version at the levels M and H, from ISO/IEC 23941 table 6. */
const RMQR_DATA_CODEWORDS = {
  M: [
    6, 12, 20, 28, 44, 12, 21, 31, 42, 63, 7, 19, 31, 43, 57, 84, 12, 27, 38, 53, 73, 106, 33, 48,
    67, 88, 127, 39, 56, 78, 100, 152,
  ],
  H: [
    3, 7, 10, 14, 24, 7, 11, 17, 22, 33, 5, 11, 15, 23, 29, 42, 7, 13, 20, 29, 35, 54, 15, 26, 31,
    48, 69, 21, 28, 38, 56, 76,
  ],
} as const;

/** rMQR character count indicator bits per mode and version, from ISO/IEC 23941 table 3. */
const RMQR_CHARACTER_COUNT_BITS = {
  numeric: [
    4, 5, 6, 7, 7, 5, 6, 7, 7, 8, 4, 6, 7, 7, 8, 8, 5, 6, 7, 7, 8, 8, 7, 7, 8, 8, 9, 7, 8, 8, 8, 9,
  ],
  alphanumeric: [
    3, 5, 5, 6, 6, 5, 5, 6, 6, 7, 4, 5, 6, 6, 7, 7, 5, 6, 6, 7, 7, 8, 6, 7, 7, 7, 8, 6, 7, 7, 8, 8,
  ],
  octet: [
    3, 4, 5, 5, 6, 4, 5, 5, 6, 6, 3, 5, 5, 6, 6, 7, 4, 5, 6, 6, 7, 7, 6, 6, 7, 7, 7, 6, 6, 7, 7, 8,
  ],
  kanji: [
    2, 3, 4, 5, 5, 3, 4, 5, 5, 6, 2, 4, 5, 5, 6, 6, 3, 5, 5, 6, 6, 7, 5, 5, 6, 6, 7, 5, 6, 6, 6, 7,
  ],
} as const satisfies Record<QRCodeEncodingMode, readonly number[]>;

const RMQR_MODE_INDICATOR_BITS = 3;

/**
 * Returns the largest single-segment payload that fits the given rMQR version.
 *
 * The result counts characters for numeric, alphanumeric, and Kanji mode and bytes for octet mode.
 */
export function fixtureRMQRCapacity(
  version: QRCodeRMQRVersion,
  errorCorrectionLevel: 'M' | 'H',
  mode: QRCodeEncodingMode,
): number {
  const index = RMQR_VERSIONS.indexOf(version);
  return capacityOfBits(
    RMQR_DATA_CODEWORDS[errorCorrectionLevel][index]! * 8 -
      RMQR_MODE_INDICATOR_BITS -
      RMQR_CHARACTER_COUNT_BITS[mode][index]!,
    mode,
  );
}
