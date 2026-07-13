import {describe, expect, test} from 'vitest';

import {parseQRCodeStylingOptions} from '../src';

describe('parseQRCodeStylingOptions', () => {
  test('returns default styling when no options are provided', () => {
    expect(parseQRCodeStylingOptions()).toEqual({
      size: 5,
      margin: 4,
      colors: {
        colorLight: '#ffffff',
        colorDark: '#000000',
      },
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
    });

    expect(parseQRCodeStylingOptions({margin: 2})).toEqual({
      size: 5,
      margin: 2,
      colors: {
        colorLight: '#ffffff',
        colorDark: '#000000',
      },
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
    });

    expect(parseQRCodeStylingOptions({colors: {colorDark: '#111111'}})).toEqual({
      size: 5,
      margin: 4,
      colors: {
        colorLight: '#ffffff',
        colorDark: '#111111',
      },
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
    });
  });
});
