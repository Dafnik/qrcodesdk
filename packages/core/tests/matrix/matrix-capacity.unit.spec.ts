import {describe, expect, test} from 'vitest';

import {
  ECC_LEVEL_H,
  ECC_LEVEL_L,
  ECC_LEVEL_M,
  ECC_LEVEL_Q,
  MODE_ALPHANUMERIC,
  MODE_KANJI,
  MODE_NUMERIC,
  MODE_OCTET,
} from '../../src/matrix/const';
import {getMaxDataLength} from '../../src/matrix/get-max-data-length';
import {getNumberOfAvailableBitsByVersion} from '../../src/matrix/get-number-of-available-bits-by-version';
import {getNumberOfAvailableBitsForData} from '../../src/matrix/get-number-of-available-bits-for-data';
import {getNumberOfBitsOfData} from '../../src/matrix/get-number-of-bits-of-data';
import {getSizeByVersion} from '../../src/matrix/get-size-by-version';
import {needsVersionInfo} from '../../src/matrix/needs-version-info';

describe('capacity helpers', () => {
  test('returns QR sizes and version-info boundaries', () => {
    expect(getSizeByVersion(1)).toBe(21);
    expect(getSizeByVersion(7)).toBe(45);
    expect(getSizeByVersion(40)).toBe(177);
    expect(needsVersionInfo(6)).toBe(false);
    expect(needsVersionInfo(7)).toBe(true);
  });

  test('returns character count bit widths by mode and version group', () => {
    expect(getNumberOfBitsOfData(1, MODE_NUMERIC)).toBe(10);
    expect(getNumberOfBitsOfData(10, MODE_NUMERIC)).toBe(12);
    expect(getNumberOfBitsOfData(27, MODE_NUMERIC)).toBe(14);
    expect(getNumberOfBitsOfData(1, MODE_ALPHANUMERIC)).toBe(9);
    expect(getNumberOfBitsOfData(10, MODE_ALPHANUMERIC)).toBe(11);
    expect(getNumberOfBitsOfData(27, MODE_ALPHANUMERIC)).toBe(13);
    expect(getNumberOfBitsOfData(1, MODE_OCTET)).toBe(8);
    expect(getNumberOfBitsOfData(10, MODE_OCTET)).toBe(16);
    expect(getNumberOfBitsOfData(27, MODE_KANJI)).toBe(12);
    // @ts-expect-error Exercise the runtime fallback for an unsupported mode.
    expect(getNumberOfBitsOfData(1, -1)).toBe(-100);
  });

  test('calculates available codeword and data bits', () => {
    expect(getNumberOfAvailableBitsByVersion(1)).toBe(208);
    expect(getNumberOfAvailableBitsByVersion(2)).toBe(359);
    expect(getNumberOfAvailableBitsByVersion(7)).toBe(1568);

    expect(getNumberOfAvailableBitsForData(1, ECC_LEVEL_L)).toBe(152);
    expect(getNumberOfAvailableBitsForData(1, ECC_LEVEL_M)).toBe(128);
    expect(getNumberOfAvailableBitsForData(1, ECC_LEVEL_Q)).toBe(104);
    expect(getNumberOfAvailableBitsForData(1, ECC_LEVEL_H)).toBe(72);
  });

  test('calculates maximum data length by mode and ECC level', () => {
    expect(getMaxDataLength(1, MODE_NUMERIC, ECC_LEVEL_L)).toBe(41);
    expect(getMaxDataLength(1, MODE_ALPHANUMERIC, ECC_LEVEL_L)).toBe(25);
    expect(getMaxDataLength(1, MODE_OCTET, ECC_LEVEL_L)).toBe(17);
    expect(getMaxDataLength(1, MODE_OCTET, ECC_LEVEL_M)).toBe(14);
    expect(getMaxDataLength(1, MODE_KANJI, ECC_LEVEL_L)).toBe(10);
    // @ts-expect-error Exercise the runtime fallback for an unsupported mode.
    expect(getMaxDataLength(1, -1, ECC_LEVEL_L)).toBe(-100);
  });
});
