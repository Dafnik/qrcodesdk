import {describe, expect, expectTypeOf, test} from 'vitest';

import {
  calculateQRCodeRenderedSize,
  createQRCodeStylePlan,
  isQRCodeColorHex,
  isQRCodeCornerDotType,
  isQRCodeCornerSquareType,
  isQRCodeDotType,
  isValidQRCodeMargin,
  isValidQRCodeSize,
} from '../src';
import type {
  QRCodeAccessibilityOptions,
  QRCodeColorHex,
  QRCodeCornerDotType,
  QRCodeCornerSquareType,
  QRCodeCornersDotOptions,
  QRCodeCornersSquareOptions,
  QRCodeDotType,
  QRCodeDotsOptions,
  QRCodeErrorCorrectionLevel,
  QRCodeInputData,
  QRCodeMatrixOptions,
  QRCodeOptions,
  QRCodeParsedStylingOptions,
  QRCodeSVGOptions,
  QRCodeSVGRendererOptions,
  QRCodeStylingColors,
  QRCodeStylingOptions,
  QRCodeTextRendererOptions,
} from '../src';

describe('public API types', () => {
  test('exports user-facing matrix input types', () => {
    expectTypeOf<QRCodeInputData>().toEqualTypeOf<string | number>();
    expectTypeOf<QRCodeErrorCorrectionLevel>().toEqualTypeOf<'L' | 'M' | 'Q' | 'H'>();
    expectTypeOf<QRCodeMatrixOptions>().toMatchTypeOf<{
      version?: number;
      mode?: string;
      errorCorrectionLevel?: string;
      mask?: number;
    }>();
  });

  test('exports canonical renderer and styling composition types', () => {
    expectTypeOf<QRCodeColorHex>().toEqualTypeOf<`#${string}`>();
    expectTypeOf<QRCodeStylingColors>().toEqualTypeOf<{
      colorLight: QRCodeColorHex;
      colorDark: QRCodeColorHex;
    }>();
    expectTypeOf<QRCodeStylingOptions['colors']>().toEqualTypeOf<
      Partial<QRCodeStylingColors> | undefined
    >();
    type ExpectedParsedStylingOptions = {
      size: number;
      margin: number;
      colors: QRCodeStylingColors;
      dotsOptions: Required<QRCodeDotsOptions>;
      cornersSquareOptions: Required<QRCodeCornersSquareOptions>;
      cornersDotOptions: Required<QRCodeCornersDotOptions>;
    };
    expectTypeOf<QRCodeParsedStylingOptions>().toMatchTypeOf<ExpectedParsedStylingOptions>();
    expectTypeOf<ExpectedParsedStylingOptions>().toMatchTypeOf<QRCodeParsedStylingOptions>();
    expectTypeOf<QRCodeSVGOptions>().toEqualTypeOf<QRCodeOptions<QRCodeSVGRendererOptions>>();
    expectTypeOf<QRCodeSVGOptions>().toEqualTypeOf<
      QRCodeMatrixOptions & QRCodeStylingOptions & QRCodeAccessibilityOptions
    >();
    expectTypeOf<QRCodeTextRendererOptions['colors']>().toEqualTypeOf<
      QRCodeStylingOptions['colors']
    >();
    expectTypeOf<QRCodeTextRendererOptions['small']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<QRCodeTextRendererOptions['ansiColors']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<QRCodeTextRendererOptions['onlyAnsiColors']>().toEqualTypeOf<
      boolean | undefined
    >();
    expectTypeOf<QRCodeDotType>().toEqualTypeOf<
      'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded'
    >();
    expectTypeOf<QRCodeCornerSquareType>().toEqualTypeOf<QRCodeDotType | 'dot'>();
    expectTypeOf<QRCodeCornerDotType>().toEqualTypeOf<QRCodeDotType | 'dot'>();
  });

  test('exports styling validation and geometry utilities', () => {
    expectTypeOf(isValidQRCodeSize).parameter(0).toEqualTypeOf<unknown>();
    expectTypeOf(isValidQRCodeMargin).parameter(0).toEqualTypeOf<unknown>();
    expectTypeOf(isQRCodeColorHex).parameter(0).toEqualTypeOf<unknown>();
    expectTypeOf(calculateQRCodeRenderedSize).returns.toEqualTypeOf<number>();
    expectTypeOf(createQRCodeStylePlan).parameter(0).toEqualTypeOf<import('../src').QRCodeMatrix>();
    expectTypeOf(isQRCodeDotType).parameter(0).toEqualTypeOf<unknown>();
    expectTypeOf(isQRCodeCornerSquareType).parameter(0).toEqualTypeOf<unknown>();
    expectTypeOf(isQRCodeCornerDotType).parameter(0).toEqualTypeOf<unknown>();

    const value: unknown = '#123456';
    expect(isQRCodeColorHex(value)).toBe(true);
    if (isQRCodeColorHex(value)) expectTypeOf(value).toEqualTypeOf<QRCodeColorHex>();
  });
});
