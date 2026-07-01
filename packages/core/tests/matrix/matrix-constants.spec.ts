import {describe, expect, test} from 'vitest';

import {
  ALPHANUMERIC_MAP,
  ECC_LEVELS_MAP,
  ECC_LEVEL_H,
  ECC_LEVEL_L,
  ECC_LEVEL_M,
  ECC_LEVEL_Q,
  GF256_GEN_POLY,
  GF256_INVENTORY_MAP,
  GF256_MAP,
  MASK_FUNCTIONS,
  MODES_MAP,
  MODE_ALPHANUMERIC,
  MODE_NUMERIC,
  MODE_OCTET,
} from '../../src/matrix/const';

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
    expect(ALPHANUMERIC_MAP['0']).toBe(0);
    expect(ALPHANUMERIC_MAP['9']).toBe(9);
    expect(ALPHANUMERIC_MAP.A).toBe(10);
    expect(ALPHANUMERIC_MAP.Z).toBe(35);
    expect(ALPHANUMERIC_MAP[' ']).toBe(36);
    expect(ALPHANUMERIC_MAP[':']).toBe(44);
  });

  test('builds GF256 lookup tables and generator polynomial degrees', () => {
    expect(GF256_MAP).toHaveLength(255);
    expect(GF256_INVENTORY_MAP[0]).toBe(-1);
    for (let value = 1; value < 256; value++) {
      expect(GF256_MAP[GF256_INVENTORY_MAP[value]]).toBe(value);
    }
    expect(GF256_GEN_POLY).toHaveLength(31);
    expect(GF256_GEN_POLY.map((polynomial) => polynomial.length)).toEqual(
      Array.from({length: 31}, (_, degree) => degree),
    );
  });

  test('implements all QR mask predicates', () => {
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
