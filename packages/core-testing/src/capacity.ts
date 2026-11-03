import type {QRCodeErrorCorrectionLevel, QRCodeMode, QRCodeVersion} from '@qrcodesdk/core';

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
} as const satisfies Record<QRCodeMode, readonly [number, number, number]>;

const MODE_INDICATOR_BITS = 4;
const UTF8_ECI_HEADER_BITS = 12;

/**
 * Returns the largest single-segment payload that fits the given symbol.
 *
 * The result counts characters for numeric and alphanumeric mode and bytes for octet mode.
 * With `eci`, octet payloads reserve room for the UTF-8 ECI header.
 */
export function fixtureCapacity(
  version: QRCodeVersion,
  errorCorrectionLevel: QRCodeErrorCorrectionLevel,
  mode: QRCodeMode,
  eci = false,
): number {
  const versionGroup = version <= 9 ? 0 : version <= 26 ? 1 : 2;
  const dataBits =
    DATA_CODEWORDS[version - 1]![ECC_LEVEL_INDEX[errorCorrectionLevel]] * 8 -
    MODE_INDICATOR_BITS -
    CHARACTER_COUNT_BITS[mode][versionGroup] -
    (eci && mode === 'octet' ? UTF8_ECI_HEADER_BITS : 0);

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
  }
}
