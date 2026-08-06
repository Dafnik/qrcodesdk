import {describe, expect, test} from 'vitest';

import {
  ECC_LEVEL_H,
  ECC_LEVEL_L,
  ECC_LEVEL_M,
  ECC_LEVEL_Q,
} from '../../src/matrix/error-correction';
import {getNumberOfAvailableBitsByVersion} from '../../src/matrix/get-number-of-available-bits-by-version';
import {getNumberOfAvailableBitsForData} from '../../src/matrix/get-number-of-available-bits-for-data';
import {getSizeByVersion} from '../../src/matrix/get-size-by-version';
import {
  MODE_ALPHANUMERIC,
  MODE_NUMERIC,
  MODE_OCTET,
  getModeDefinition,
} from '../../src/matrix/mode';
import {needsVersionInfo} from '../../src/matrix/needs-version-info';
import {segmentsFitVersion} from '../../src/matrix/resolve-matrix-options';
import {createSingleSegment, getSegmentsBitLength} from '../../src/matrix/segments';

describe('capacity helpers', () => {
  test('returns QR sizes and version-info boundaries', () => {
    expect(getSizeByVersion(1)).toBe(21);
    expect(getSizeByVersion(7)).toBe(45);
    expect(getSizeByVersion(40)).toBe(177);
    expect(needsVersionInfo(6)).toBe(false);
    expect(needsVersionInfo(7)).toBe(true);
  });

  test('returns character count bit widths by mode and version group', () => {
    expect(getModeDefinition(MODE_NUMERIC).getCharacterCountBits(1)).toBe(10);
    expect(getModeDefinition(MODE_NUMERIC).getCharacterCountBits(10)).toBe(12);
    expect(getModeDefinition(MODE_NUMERIC).getCharacterCountBits(27)).toBe(14);
    expect(getModeDefinition(MODE_ALPHANUMERIC).getCharacterCountBits(1)).toBe(9);
    expect(getModeDefinition(MODE_ALPHANUMERIC).getCharacterCountBits(10)).toBe(11);
    expect(getModeDefinition(MODE_ALPHANUMERIC).getCharacterCountBits(27)).toBe(13);
    expect(getModeDefinition(MODE_OCTET).getCharacterCountBits(1)).toBe(8);
    expect(getModeDefinition(MODE_OCTET).getCharacterCountBits(10)).toBe(16);
    expect(() => getModeDefinition(-1)).toThrow('QRCode: Invalid mode');
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
    expect(
      segmentsFitVersion(
        [createSingleSegment(MODE_NUMERIC, '1'.repeat(41))!],
        1,
        ECC_LEVEL_L,
        false,
      ),
    ).toBe(true);
    expect(
      segmentsFitVersion(
        [createSingleSegment(MODE_NUMERIC, '1'.repeat(42))!],
        1,
        ECC_LEVEL_L,
        false,
      ),
    ).toBe(false);
    expect(
      segmentsFitVersion(
        [createSingleSegment(MODE_ALPHANUMERIC, 'A'.repeat(25))!],
        1,
        ECC_LEVEL_L,
        false,
      ),
    ).toBe(true);
    expect(
      segmentsFitVersion(
        [createSingleSegment(MODE_ALPHANUMERIC, 'A'.repeat(26))!],
        1,
        ECC_LEVEL_L,
        false,
      ),
    ).toBe(false);
    expect(
      segmentsFitVersion([createSingleSegment(MODE_OCTET, 'A'.repeat(17))!], 1, ECC_LEVEL_L, false),
    ).toBe(true);
    expect(
      segmentsFitVersion([createSingleSegment(MODE_OCTET, 'A'.repeat(18))!], 1, ECC_LEVEL_L, false),
    ).toBe(false);
    expect(
      segmentsFitVersion([createSingleSegment(MODE_OCTET, 'A'.repeat(14))!], 1, ECC_LEVEL_M, false),
    ).toBe(true);
    expect(
      segmentsFitVersion([createSingleSegment(MODE_OCTET, 'A'.repeat(15))!], 1, ECC_LEVEL_M, false),
    ).toBe(false);
    expect(getSegmentsBitLength(1, [createSingleSegment(MODE_OCTET, 'A')!], false)).toBe(20);
    expect(getSegmentsBitLength(1, [createSingleSegment(MODE_OCTET, 'A')!], true)).toBe(32);
    // @ts-expect-error Exercise the runtime fallback for an unsupported mode.
    expect(() => getSegmentsBitLength(1, [{mode: -1, data: ''}], false)).toThrow(
      'QRCode: Invalid mode',
    );
  });

  test('charges the ECI header only for enabled octet segments', () => {
    const octetLWithECI = createSingleSegment(MODE_OCTET, 'A'.repeat(16))!;
    const octetL = createSingleSegment(MODE_OCTET, 'A'.repeat(17))!;
    const octetMWithECI = createSingleSegment(MODE_OCTET, 'A'.repeat(13))!;
    const octetM = createSingleSegment(MODE_OCTET, 'A'.repeat(14))!;
    const octetMaxWithECI = createSingleSegment(MODE_OCTET, 'A'.repeat(2_952))!;
    const octetMax = createSingleSegment(MODE_OCTET, 'A'.repeat(2_953))!;

    expect(segmentsFitVersion([octetLWithECI], 1, ECC_LEVEL_L, true)).toBe(true);
    expect(segmentsFitVersion([octetL], 1, ECC_LEVEL_L, false)).toBe(true);
    expect(segmentsFitVersion([octetL], 1, ECC_LEVEL_L, true)).toBe(false);
    expect(segmentsFitVersion([octetMWithECI], 1, ECC_LEVEL_M, true)).toBe(true);
    expect(segmentsFitVersion([octetM], 1, ECC_LEVEL_M, false)).toBe(true);
    expect(segmentsFitVersion([octetM], 1, ECC_LEVEL_M, true)).toBe(false);
    expect(segmentsFitVersion([octetMaxWithECI], 40, ECC_LEVEL_L, true)).toBe(true);
    expect(segmentsFitVersion([octetMax], 40, ECC_LEVEL_L, false)).toBe(true);
    expect(segmentsFitVersion([octetMax], 40, ECC_LEVEL_L, true)).toBe(false);
  });
});
