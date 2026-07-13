import {describe, expect, test} from 'vitest';

import {ECC_LEVELS_MAP} from '../../src/matrix/const';
import {qrcode} from '../../src/qrcode-builder';
import type {
  QRCodeErrorCorrectionLevel,
  QRCodeMask,
  QRCodeMode,
  QRCodeVersion,
} from '../../src/types';
import {
  ECC_LEVELS,
  MASKS,
  expectSquareBinaryMatrix,
  formatBitsMatch,
  referenceMatrixQRCodeGeneratorPackage,
  referenceMatrixQRCodePackage,
} from './helpers';

describe('qrcode().matrix()', () => {
  test('generates square binary matrices with expected sizes', () => {
    expectSquareBinaryMatrix(qrcode('123456789').version(1).mask(1).matrix(), 21);
    expectSquareBinaryMatrix(qrcode('123456789').version(40).mask(1).matrix(), 177);
  });

  test('matches reference matrices for explicit modes, ECC levels, versions, and masks', () => {
    const cases: Array<{
      data: string;
      mode: QRCodeMode;
      version: QRCodeVersion;
      errorCorrectionLevel: QRCodeErrorCorrectionLevel;
      mask: QRCodeMask;
    }> = [
      {data: '123456789', mode: 'numeric', version: 30, errorCorrectionLevel: 'H', mask: 0},
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
      {data: '', mode: 'octet', version: 2, errorCorrectionLevel: 'Q', mask: 3},
      {data: ' ', mode: 'octet', version: 2, errorCorrectionLevel: 'Q', mask: 3},
    ];

    for (const options of cases) {
      const matrix = qrcode(options.data)
        .mode(options.mode)
        .version(options.version as never)
        .errorCorrection(options.errorCorrectionLevel)
        .mask(options.mask)
        .matrix();
      expect(matrix).toEqual(referenceMatrixQRCodePackage(options.data, options));
      expect(matrix).toEqual(referenceMatrixQRCodeGeneratorPackage(options.data, options));
    }
  });

  test('matches reference matrices for every mask and ECC level', () => {
    for (const errorCorrectionLevel of ECC_LEVELS) {
      for (const mask of MASKS) {
        const matrix = qrcode('MASK TEST 123')
          .errorCorrection(errorCorrectionLevel)
          .mask(mask)
          .matrix();
        expect(matrix).toEqual(
          referenceMatrixQRCodePackage('MASK TEST 123', {
            mode: 'alphanumeric',
            errorCorrectionLevel,
            mask,
          }),
        );
        expect(matrix).toEqual(
          referenceMatrixQRCodeGeneratorPackage('MASK TEST 123', {
            mode: 'alphanumeric',
            errorCorrectionLevel,
            mask,
          }),
        );
      }
    }
  });

  test('auto-detects modes and versions', () => {
    expect(qrcode('123456789').mask(1).matrix()).toEqual(
      qrcode('123456789').mode('numeric').mask(1).matrix(),
    );
    expect(qrcode('HELLO WORLD').mask(1).matrix()).toEqual(
      qrcode('HELLO WORLD').mode('alphanumeric').mask(1).matrix(),
    );
    expect(qrcode('hello world').mask(1).matrix()).toEqual(
      qrcode('hello world').mode('octet').mask(1).matrix(),
    );
    expect(qrcode('1'.repeat(42)).mask(1).matrix()).toHaveLength(25);
  });

  test('auto-selects one of the reference qrcode mask matrices and writes matching format bits', () => {
    const matrix = qrcode('AUTO MASK 12345')
      .mode('alphanumeric')
      .errorCorrection('M')
      .version(2)
      .matrix();

    const selectedMask = MASKS.find((mask) =>
      matrix.every((row, rowIndex) =>
        row.every(
          (value, columnIndex) =>
            value ===
            referenceMatrixQRCodePackage('AUTO MASK 12345', {
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

  test('auto-selects one of the reference qrcode-generator mask matrices and writes matching format bits', () => {
    const matrix = qrcode('AUTO MASK 12345')
      .mode('alphanumeric')
      .errorCorrection('M')
      .version(2)
      .matrix();

    const selectedMask = MASKS.find((mask) =>
      matrix.every((row, rowIndex) =>
        row.every(
          (value, columnIndex) =>
            value ===
            referenceMatrixQRCodeGeneratorPackage('AUTO MASK 12345', {
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
      qrcode('123456789').mode('numeric').errorCorrection('M').mask(1).matrix(),
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
    expect(() => qrcode('ABC').mode('numeric').matrix()).toThrow('QRCode: Invalid data format');
    expect(() => qrcode('abc').mode('alphanumeric').matrix()).toThrow(
      'QRCode: Invalid data format',
    );
    expect(() =>
      qrcode('123')
        .mode('kanji' as never)
        .matrix(),
    ).toThrow('QRCode: Invalid mode');
    expect(() =>
      qrcode('123')
        .errorCorrection('X' as never)
        .matrix(),
    ).toThrow('QRCode: Invalid ECC level');
    expect(() =>
      qrcode('123')
        .version(0 as never)
        .matrix(),
    ).toThrow('QRCode: Invalid version');
    expect(() =>
      qrcode('123')
        .version(41 as never)
        .matrix(),
    ).toThrow('QRCode: Invalid version');
    expect(() =>
      qrcode('123')
        .mask(8 as never)
        .matrix(),
    ).toThrow('QRCode: Invalid mask');
    expect(() => qrcode('1'.repeat(7_090)).mode('numeric').matrix()).toThrow(
      'QRCode: Data too large',
    );
  });

  test('throws Error instances for invalid runtime usage', () => {
    // @ts-expect-error Expected type error
    expect(() => qrcode('123456789').render()).toThrow(Error);
    expect(() => qrcode('ABC').mode('numeric').matrix()).toThrow(Error);
  });
});
