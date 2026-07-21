import {describe, expect, test} from 'vitest';

import {
  ECC_LEVELS_MAP,
  ECC_LEVEL_H,
  ECC_LEVEL_L,
  ECC_LEVEL_M,
  ECC_LEVEL_Q,
  getGF256GeneratorPolynomials,
  getGF256LookupTables,
} from '../../src/matrix/error-correction';
import {MASK_FUNCTIONS, QR_CODE_MASKS} from '../../src/matrix/mask';
import {
  MODES_MAP,
  MODE_ALPHANUMERIC,
  MODE_NUMERIC,
  MODE_OCTET,
  getAlphanumericMap,
  getModeDefinition,
} from '../../src/matrix/mode';

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
    const alphanumericMap = getAlphanumericMap();

    expect(alphanumericMap['0']).toBe(0);
    expect(alphanumericMap['9']).toBe(9);
    expect(alphanumericMap.A).toBe(10);
    expect(alphanumericMap.Z).toBe(35);
    expect(alphanumericMap[' ']).toBe(36);
    expect(alphanumericMap[':']).toBe(44);
  });

  test('resolves every supported mode through its descriptor', () => {
    expect(Object.values(MODES_MAP).map((mode) => getModeDefinition(mode).indicator)).toEqual([
      MODE_NUMERIC,
      MODE_ALPHANUMERIC,
      MODE_OCTET,
    ]);
    expect(() => getModeDefinition(-1)).toThrow('QRCode: Invalid mode');
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
    expect(getAlphanumericMap()).toBe(getAlphanumericMap());
    expect(getGF256LookupTables()).toBe(getGF256LookupTables());
    expect(getGF256GeneratorPolynomials()).toBe(getGF256GeneratorPolynomials());
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
});
