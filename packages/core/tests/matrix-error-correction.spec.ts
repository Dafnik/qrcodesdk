import {describe, expect, test} from 'vitest';

import {augmentBCH} from '../src/matrix/augment-bch';
import {augmentECCs} from '../src/matrix/augment-eccs';
import {calculateECC} from '../src/matrix/calculate-ecc';
import {GF256_GEN_POLY} from '../src/matrix/const';

describe('error correction helpers', () => {
  test('augments BCH format and version codes', () => {
    expect(augmentBCH(0b01000, 5, 0x537, 10)).toBe(0b10001111010110);
    expect(augmentBCH(7, 6, 0x1f25, 12)).toBe(0b0111110010010100);
  });

  test('calculates Reed-Solomon ECC words', () => {
    expect(calculateECC([32, 91, 11, 120, 209, 114, 220], GF256_GEN_POLY[10])).toEqual([
      250, 65, 36, 91, 41, 102, 76, 98, 187, 105,
    ]);
  });

  test('interleaves data and ECC blocks', () => {
    expect(augmentECCs([1, 2, 3, 4, 5], 2, GF256_GEN_POLY[2])).toEqual([1, 3, 2, 4, 5, 1, 2, 2, 0]);
  });
});
