import {describe, expect, test} from 'vitest';

import type {QRCodeVersion} from '../../src';
import {
  ECC_LEVELS_MAP,
  ECC_LEVEL_H,
  ECC_LEVEL_L,
  ECC_LEVEL_M,
  ECC_LEVEL_Q,
  getGF256GeneratorPolynomial,
  getGF256LookupTables,
} from '../../src/matrix/error-correction';
import {
  ALPHANUMERIC_CHARACTERS,
  MODES_MAP,
  MODE_ALPHANUMERIC,
  MODE_NUMERIC,
  MODE_OCTET,
  resolveMode,
} from '../../src/matrix/mode';
import {
  getAlignmentPatternCount,
  getAlignmentPatternPositions,
  getErrorCorrectionBlockCount,
  getErrorCorrectionCodewordsPerBlock,
} from '../../src/matrix/version-config';
import {MASK_FUNCTIONS, QR_CODE_MASKS, getGF256GeneratorPolynomials} from './helpers';

// JIS X 0510:2004 Table 9, indexed by the internal ECC value (M, L, H, Q) and version 1-40.
const EXPECTED_ERROR_CORRECTION_CODEWORDS_PER_BLOCK = [
  [
    10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28,
    28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
  ],
  [
    7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30,
    26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  [
    17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  [
    13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30,
    30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
];

const EXPECTED_ERROR_CORRECTION_BLOCKS = [
  [
    1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25,
    26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49,
  ],
  [
    1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15,
    16, 17, 18, 19, 19, 20, 21, 22, 24, 25,
  ],
  [
    1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37,
    40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81,
  ],
  [
    1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34,
    35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68,
  ],
];

const EXPECTED_ALIGNMENT_PATTERN_POSITIONS = [
  [],
  [4, 16],
  [4, 20],
  [4, 24],
  [4, 28],
  [4, 32],
  [4, 20, 36],
  [4, 22, 40],
  [4, 24, 44],
  [4, 26, 48],
  [4, 28, 52],
  [4, 30, 56],
  [4, 32, 60],
  [4, 24, 44, 64],
  [4, 24, 46, 68],
  [4, 24, 48, 72],
  [4, 28, 52, 76],
  [4, 28, 54, 80],
  [4, 28, 56, 84],
  [4, 32, 60, 88],
  [4, 26, 48, 70, 92],
  [4, 24, 48, 72, 96],
  [4, 28, 52, 76, 100],
  [4, 26, 52, 78, 104],
  [4, 30, 56, 82, 108],
  [4, 28, 56, 84, 112],
  [4, 32, 60, 88, 116],
  [4, 24, 48, 72, 96, 120],
  [4, 28, 52, 76, 100, 124],
  [4, 24, 50, 76, 102, 128],
  [4, 28, 54, 80, 106, 132],
  [4, 32, 58, 84, 110, 136],
  [4, 28, 56, 84, 112, 140],
  [4, 32, 60, 88, 116, 144],
  [4, 28, 52, 76, 100, 124, 148],
  [4, 22, 48, 74, 100, 126, 152],
  [4, 26, 52, 78, 104, 130, 156],
  [4, 30, 56, 82, 108, 134, 160],
  [4, 24, 52, 80, 108, 136, 164],
  [4, 28, 56, 84, 112, 140, 168],
] as const;

describe('matrix constants', () => {
  test('exposes QR mode and ECC maps', () => {
    expect(MODES_MAP).toEqual({
      numeric: MODE_NUMERIC,
      alphanumeric: MODE_ALPHANUMERIC,
      octet: MODE_OCTET,
    });
    expect(ECC_LEVELS_MAP).toEqual({
      L: ECC_LEVEL_L,
      M: ECC_LEVEL_M,
      Q: ECC_LEVEL_Q,
      H: ECC_LEVEL_H,
    });
  });

  test('maps alphanumeric characters to QR table indexes', () => {
    expect(ALPHANUMERIC_CHARACTERS.indexOf('0')).toBe(0);
    expect(ALPHANUMERIC_CHARACTERS.indexOf('9')).toBe(9);
    expect(ALPHANUMERIC_CHARACTERS.indexOf('A')).toBe(10);
    expect(ALPHANUMERIC_CHARACTERS.indexOf('Z')).toBe(35);
    expect(ALPHANUMERIC_CHARACTERS.indexOf(' ')).toBe(36);
    expect(ALPHANUMERIC_CHARACTERS.indexOf(':')).toBe(44);
    expect(ALPHANUMERIC_CHARACTERS).toHaveLength(45);
  });

  test('resolves every supported mode', () => {
    expect(Object.keys(MODES_MAP).map((mode) => resolveMode('1', mode as never))).toEqual([
      MODE_NUMERIC,
      MODE_ALPHANUMERIC,
      MODE_OCTET,
    ]);
    expect(() => resolveMode('1', 'kanji' as never)).toThrow('QRCode: Invalid mode');
  });

  test.each(['kanji', 'toString'])('reports the rejected mode %s in error details', (mode) => {
    expect(() => resolveMode('1', mode as never)).toThrowError(
      expect.objectContaining({
        code: 'INVALID_OPTIONS',
        details: {field: 'mode', value: mode},
      }),
    );
  });

  test('builds GF256 lookup tables and generator polynomial degrees', () => {
    const {exponents, logarithms} = getGF256LookupTables();
    const generatorPolynomials = getGF256GeneratorPolynomials();

    expect(exponents).toHaveLength(255);
    expect(logarithms[0]).toBe(-1);
    for (let value = 1; value < 256; value++) {
      expect(exponents[logarithms[value]]).toBe(value);
    }
    expect(generatorPolynomials).toHaveLength(31);
    expect(generatorPolynomials.map((polynomial) => polynomial.length)).toEqual(
      Array.from({length: 31}, (_, degree) => degree),
    );
  });

  test('caches generated lookup tables', () => {
    expect(getGF256LookupTables()).toBe(getGF256LookupTables());
    expect(getGF256GeneratorPolynomial(30)).toBe(getGF256GeneratorPolynomial(30));
  });

  test('implements all QR mask predicates', () => {
    expect(QR_CODE_MASKS).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    const points = [
      [0, 0],
      [0, 1],
      [1, 0],
      [2, 3],
      [5, 7],
    ] as const;
    expect(
      MASK_FUNCTIONS.map((maskFunction) => points.map(([i, j]) => maskFunction(i, j))),
    ).toEqual([
      [true, false, false, false, true],
      [true, true, false, true, false],
      [true, false, true, true, false],
      [true, false, false, false, true],
      [true, true, true, true, true],
      [true, true, true, true, false],
      [true, true, true, true, false],
      [true, false, false, false, true],
    ]);
  });

  test('decodes the packed error-correction tables', () => {
    for (const level of [0, 1, 2, 3] as const) {
      for (let version = 1; version <= 40; version++) {
        const qrVersion = version as QRCodeVersion;
        expect(getErrorCorrectionCodewordsPerBlock(qrVersion, level)).toBe(
          EXPECTED_ERROR_CORRECTION_CODEWORDS_PER_BLOCK[level]![version - 1],
        );
        expect(getErrorCorrectionBlockCount(qrVersion, level)).toBe(
          EXPECTED_ERROR_CORRECTION_BLOCKS[level]![version - 1],
        );
      }
    }
  });

  test('derives every alignment pattern position from the QR version', () => {
    for (let version = 1; version <= 40; version++) {
      const qrVersion = version as QRCodeVersion;
      expect(getAlignmentPatternPositions(qrVersion)).toEqual(
        EXPECTED_ALIGNMENT_PATTERN_POSITIONS[version - 1],
      );
      expect(getAlignmentPatternCount(qrVersion)).toBe(
        EXPECTED_ALIGNMENT_PATTERN_POSITIONS[version - 1]!.length,
      );
    }
  });
});
