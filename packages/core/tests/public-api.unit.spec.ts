import {describe, expectTypeOf, test} from 'vitest';

import type {
  QRCodeAccessibilityOptions,
  QRCodeColorHex,
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
  });
});
