import {describe, expect, test} from 'vitest';

import {
  calculateQRCodeRenderedSize,
  isQRCodeColorHex,
  isQRCodeCornerDotType,
  isQRCodeCornerSquareType,
  isQRCodeDotType,
  isValidQRCodeMargin,
  isValidQRCodeSize,
  parseQRCodeStylingOptions,
} from '../src';
import type {QRCodeStylingOptions} from '../src';

describe('parseQRCodeStylingOptions', () => {
  test('returns default styling when no options are provided', () => {
    expect(parseQRCodeStylingOptions()).toEqual({
      size: 5,
      margin: 4,
      colors: {
        colorLight: '#ffffff',
        colorDark: '#000000',
      },
      dotsOptions: {color: '#000000', type: 'square'},
      cornersSquareOptions: {color: '#000000', type: 'square'},
      cornersDotOptions: {color: '#000000', type: 'square'},
    });
  });

  test('preserves top-level defaults for omitted options', () => {
    expect(parseQRCodeStylingOptions({size: 8})).toEqual({
      size: 8,
      margin: 4,
      colors: {
        colorLight: '#ffffff',
        colorDark: '#000000',
      },
      dotsOptions: {color: '#000000', type: 'square'},
      cornersSquareOptions: {color: '#000000', type: 'square'},
      cornersDotOptions: {color: '#000000', type: 'square'},
    });

    expect(parseQRCodeStylingOptions({margin: 2})).toEqual({
      size: 5,
      margin: 2,
      colors: {
        colorLight: '#ffffff',
        colorDark: '#000000',
      },
      dotsOptions: {color: '#000000', type: 'square'},
      cornersSquareOptions: {color: '#000000', type: 'square'},
      cornersDotOptions: {color: '#000000', type: 'square'},
    });
  });

  test('preserves color defaults for omitted colors', () => {
    expect(parseQRCodeStylingOptions({colors: {colorLight: '#eeeeee'}})).toEqual({
      size: 5,
      margin: 4,
      colors: {
        colorLight: '#eeeeee',
        colorDark: '#000000',
      },
      dotsOptions: {color: '#000000', type: 'square'},
      cornersSquareOptions: {color: '#000000', type: 'square'},
      cornersDotOptions: {color: '#000000', type: 'square'},
    });

    expect(parseQRCodeStylingOptions({colors: {colorDark: '#111111'}})).toEqual({
      size: 5,
      margin: 4,
      colors: {
        colorLight: '#ffffff',
        colorDark: '#111111',
      },
      dotsOptions: {color: '#111111', type: 'square'},
      cornersSquareOptions: {color: '#111111', type: 'square'},
      cornersDotOptions: {color: '#111111', type: 'square'},
    });
  });

  test('passes through custom styling values', () => {
    expect(
      parseQRCodeStylingOptions({
        size: 10,
        margin: 1,
        colors: {
          colorLight: '#fefefe',
          colorDark: '#101010',
        },
      }),
    ).toEqual({
      size: 10,
      margin: 1,
      colors: {
        colorLight: '#fefefe',
        colorDark: '#101010',
      },
      dotsOptions: {color: '#101010', type: 'square'},
      cornersSquareOptions: {color: '#101010', type: 'square'},
      cornersDotOptions: {color: '#101010', type: 'square'},
    });
  });

  test('accepts boundary geometry and case-insensitive hex colors', () => {
    expect(
      parseQRCodeStylingOptions({
        size: 1,
        margin: 0,
        colors: {colorLight: '#ABCDEF', colorDark: '#abcdef'},
      }),
    ).toEqual({
      size: 1,
      margin: 0,
      colors: {colorLight: '#ABCDEF', colorDark: '#abcdef'},
      dotsOptions: {color: '#abcdef', type: 'square'},
      cornersSquareOptions: {color: '#abcdef', type: 'square'},
      cornersDotOptions: {color: '#abcdef', type: 'square'},
    });
  });

  test('resolves feature types and colors independently from the base dark color', () => {
    expect(
      parseQRCodeStylingOptions({
        colors: {colorDark: '#111111'},
        dotsOptions: {color: '#222222', type: 'rounded'},
        cornersSquareOptions: {type: 'extra-rounded'},
        cornersDotOptions: {color: '#333333', type: 'dot'},
      }),
    ).toMatchObject({
      dotsOptions: {color: '#222222', type: 'rounded'},
      cornersSquareOptions: {color: '#111111', type: 'extra-rounded'},
      cornersDotOptions: {color: '#333333', type: 'dot'},
    });
  });

  test.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53])(
    'rejects invalid size %s',
    (size) => {
      expect(() => parseQRCodeStylingOptions({size})).toThrow(
        'QR code size must be a positive integer',
      );
    },
  );

  test.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53])(
    'rejects invalid margin %s',
    (margin) => {
      expect(() => parseQRCodeStylingOptions({margin})).toThrow(
        'QR code margin must be a non-negative integer',
      );
    },
  );

  test.each([
    ['colorDark', '111111'],
    ['colorDark', '#fff'],
    ['colorLight', '#1234567'],
    ['colorLight', '#gggggg'],
  ] as const)('rejects invalid %s value %s', (name, value) => {
    const options = {colors: {[name]: value}} as QRCodeStylingOptions;

    expect(() => parseQRCodeStylingOptions(options)).toThrow(
      `QR code ${name} must be a 6-digit hex color`,
    );
  });

  test.each([
    ['dotsOptions', 'color', '#fff'],
    ['cornersSquareOptions', 'color', '112233'],
    ['cornersDotOptions', 'color', '#gggggg'],
  ] as const)('rejects invalid %s.%s colors', (group, name, value) => {
    const options = {[group]: {[name]: value}} as QRCodeStylingOptions;
    expect(() => parseQRCodeStylingOptions(options)).toThrow(
      `QR code ${group}.${name} must be a 6-digit hex color`,
    );
  });

  test.each(['dotsOptions', 'cornersSquareOptions', 'cornersDotOptions'] as const)(
    'rejects invalid %s types at runtime',
    (group) => {
      const options = {[group]: {type: 'pill'}} as unknown as QRCodeStylingOptions;
      expect(() => parseQRCodeStylingOptions(options)).toThrow(
        `QR code ${group}.type must be one of`,
      );
    },
  );
});

describe('styling validation predicates', () => {
  test('identify valid sizes and margins', () => {
    expect(isValidQRCodeSize(1)).toBe(true);
    expect(isValidQRCodeSize(0)).toBe(false);
    expect(isValidQRCodeSize(2 ** 53)).toBe(false);
    expect(isValidQRCodeMargin(0)).toBe(true);
    expect(isValidQRCodeMargin(-1)).toBe(false);
    expect(isValidQRCodeMargin(1.5)).toBe(false);
  });

  test('identifies six-digit hex colors', () => {
    expect(isQRCodeColorHex('#abcdef')).toBe(true);
    expect(isQRCodeColorHex('#ABCDEF')).toBe(true);
    expect(isQRCodeColorHex('#abc')).toBe(false);
    expect(isQRCodeColorHex('abcdef')).toBe(false);
    expect(isQRCodeColorHex(123456)).toBe(false);
  });

  test('identifies supported module and finder types', () => {
    expect(isQRCodeDotType('classy-rounded')).toBe(true);
    expect(isQRCodeDotType('dot')).toBe(false);
    expect(isQRCodeCornerSquareType('dot')).toBe(true);
    expect(isQRCodeCornerSquareType('pill')).toBe(false);
    expect(isQRCodeCornerDotType('extra-rounded')).toBe(true);
    expect(isQRCodeCornerDotType('DOT')).toBe(false);
  });
});

describe('calculateQRCodeRenderedSize', () => {
  test('calculates the scaled matrix size including margins', () => {
    expect(
      calculateQRCodeRenderedSize(
        [
          [1, 0],
          [0, 1],
        ],
        {size: 3, margin: 1},
      ),
    ).toBe(12);
  });

  test('rejects invalid and unsafe rendered dimensions', () => {
    expect(() => calculateQRCodeRenderedSize([], {size: 1, margin: 0})).toThrow(
      'QR code dimensions must be positive integers',
    );
    expect(() =>
      calculateQRCodeRenderedSize(
        [
          [1, 0],
          [0, 1],
        ],
        {size: Number.MAX_SAFE_INTEGER, margin: 0},
      ),
    ).toThrow('QR code dimensions must be positive integers');
  });
});
