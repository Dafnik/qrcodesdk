import {describe, expect, test} from 'vitest';

import {ECC_LEVELS_MAP} from '../../src/matrix/const';
import {buildQRCodeMatrix} from '../../src/matrix/generate';
import {qrcode} from '../../src/qrcode-builder';
import type {QRCodeErrorCorrectionLevel, QRCodeMask, QRCodeMode} from '../../src/types';
import {
  ECC_LEVELS,
  MASKS,
  expectSquareBinaryMatrix,
  formatBitsMatch,
  referenceMatrix,
} from './helpers';

describe('buildQRCodeMatrix', () => {
  test('generates square binary matrices with expected sizes', () => {
    expectSquareBinaryMatrix(buildQRCodeMatrix('123456789', {version: 1, mask: 1}), 21);
    expectSquareBinaryMatrix(buildQRCodeMatrix('123456789', {version: 40, mask: 1}), 177);
  });

  test('matches reference matrices for explicit modes, ECC levels, versions, and masks', () => {
    const cases: Array<{
      data: string;
      mode: QRCodeMode;
      version: number;
      errorCorrectionLevel: QRCodeErrorCorrectionLevel;
      mask: QRCodeMask;
    }> = [
      {data: '123456789', mode: 'numeric', version: 1, errorCorrectionLevel: 'L', mask: 1},
      {data: 'HELLO WORLD', mode: 'alphanumeric', version: 1, errorCorrectionLevel: 'M', mask: 2},
      {data: 'hello, 世界', mode: 'octet', version: 2, errorCorrectionLevel: 'Q', mask: 3},
      {
        data: '012345678901234567890123456789',
        mode: 'numeric',
        version: 3,
        errorCorrectionLevel: 'H',
        mask: 4,
      },
      {
        data: 'VERSION 7 PAYLOAD',
        mode: 'alphanumeric',
        version: 7,
        errorCorrectionLevel: 'L',
        mask: 5,
      },
    ];

    for (const options of cases) {
      expect(
        buildQRCodeMatrix(options.data, {
          mode: options.mode,
          version: options.version as never,
          errorCorrectionLevel: options.errorCorrectionLevel,
          mask: options.mask,
        }),
      ).toEqual(referenceMatrix(options.data, options));
    }
  });

  test('matches reference matrices for every mask and ECC level', () => {
    for (const errorCorrectionLevel of ECC_LEVELS) {
      for (const mask of MASKS) {
        expect(buildQRCodeMatrix('MASK TEST 123', {errorCorrectionLevel, mask})).toEqual(
          referenceMatrix('MASK TEST 123', {
            mode: 'alphanumeric',
            errorCorrectionLevel,
            mask,
          }),
        );
      }
    }
  });

  test('auto-detects modes and versions', () => {
    expect(buildQRCodeMatrix('123456789', {mask: 1})).toEqual(
      buildQRCodeMatrix('123456789', {mode: 'numeric', mask: 1}),
    );
    expect(buildQRCodeMatrix('HELLO WORLD', {mask: 1})).toEqual(
      buildQRCodeMatrix('HELLO WORLD', {mode: 'alphanumeric', mask: 1}),
    );
    expect(buildQRCodeMatrix('hello world', {mask: 1})).toEqual(
      buildQRCodeMatrix('hello world', {mode: 'octet', mask: 1}),
    );
    expect(buildQRCodeMatrix('1'.repeat(42), {mask: 1})).toHaveLength(25);
  });

  test('auto-selects one of the reference mask matrices and writes matching format bits', () => {
    const matrix = buildQRCodeMatrix('AUTO MASK 12345', {
      mode: 'alphanumeric',
      errorCorrectionLevel: 'M',
      version: 2,
    });

    const selectedMask = MASKS.find((mask) =>
      matrix.every((row, rowIndex) =>
        row.every(
          (value, columnIndex) =>
            value ===
            referenceMatrix('AUTO MASK 12345', {
              mode: 'alphanumeric',
              errorCorrectionLevel: 'M',
              version: 2,
              mask,
            })[rowIndex][columnIndex],
        ),
      ),
    );

    expect(selectedMask).toBeDefined();
    expect(formatBitsMatch(matrix, ECC_LEVELS_MAP.M, selectedMask as QRCodeMask)).toBe(true);
  });

  test('builder matrix and renderer paths use matrix generation', () => {
    const matrix = qrcode('123456789').mode('numeric').mask(1).matrix();

    expect(matrix).toEqual(
      buildQRCodeMatrix('123456789', {
        mode: 'numeric',
        errorCorrectionLevel: 'M',
        mask: 1,
      }),
    );
    expect(
      qrcode('123456789')
        .mode('numeric')
        .mask(1)
        .render((value) => value.length),
    ).toBe(21);
    // @ts-expect-error Testing Types
    expect(() => qrcode('123456789').render()).toThrow('QRCode: Renderer missing');
  });

  test('rejects invalid public options and incompatible data', () => {
    expect(() => buildQRCodeMatrix('ABC', {mode: 'numeric'})).toThrow(
      'QRCode: Invalid data format',
    );
    expect(() => buildQRCodeMatrix('abc', {mode: 'alphanumeric'})).toThrow(
      'QRCode: Invalid data format',
    );
    expect(() => buildQRCodeMatrix('123', {mode: 'kanji'} as never)).toThrow(
      'QRCode: Invalid mode',
    );
    expect(() => buildQRCodeMatrix('123', {errorCorrectionLevel: 'X'} as never)).toThrow(
      'QRCode: Invalid ECC level',
    );
    expect(() => buildQRCodeMatrix('123', {version: 0} as never)).toThrow(
      'QRCode: Invalid version',
    );
    expect(() => buildQRCodeMatrix('123', {version: 41} as never)).toThrow(
      'QRCode: Invalid version',
    );
    expect(() => buildQRCodeMatrix('123', {mask: 8} as never)).toThrow('QRCode: Invalid mask');
    expect(() => buildQRCodeMatrix('1'.repeat(7_090), {mode: 'numeric'})).toThrow(
      'QRCode: Data to large',
    );
  });
});
