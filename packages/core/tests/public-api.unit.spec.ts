import {describe, expect, expectTypeOf, test} from 'vitest';

import * as core from '../src';
import {
  QRCodeBuilder,
  QRCodeSVGRenderer,
  QRCodeTextRenderer,
  qrcode,
  ɵECC_LEVELS,
  ɵMODES,
  ɵQR_CODE_COLOR_HEX_PATTERN,
  ɵQR_CODE_CORNER_DOT_TYPES,
  ɵQR_CODE_CORNER_SQUARE_TYPES,
  ɵQR_CODE_DOT_TYPES,
  ɵcalculateQRCodeRenderedSize,
  ɵcreateQRCodeStylePlan,
  ɵgenerateQRCodeMatrixWithMetadata,
  ɵisQRCodeColorHex,
  ɵisQRCodeCornerDotType,
  ɵisQRCodeCornerSquareType,
  ɵisQRCodeDotType,
  ɵisValidQRCodeMargin,
  ɵisValidQRCodeSize,
  ɵparseQRCodeStylingOptions,
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
  ɵQRCodeMatrixGenerationMetadata,
  ɵQRCodeMatrixMetadataRole,
  ɵQRCodeMatrixModuleMetadata,
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

  test('exports styling validation and geometry utilities with internal prefixes', () => {
    expectTypeOf(ɵisValidQRCodeSize).parameter(0).toEqualTypeOf<unknown>();
    expectTypeOf(ɵisValidQRCodeMargin).parameter(0).toEqualTypeOf<unknown>();
    expectTypeOf(ɵisQRCodeColorHex).parameter(0).toEqualTypeOf<unknown>();
    expectTypeOf(ɵcalculateQRCodeRenderedSize).returns.toEqualTypeOf<number>();
    expectTypeOf(ɵcreateQRCodeStylePlan)
      .parameter(0)
      .toEqualTypeOf<import('../src').QRCodeMatrix>();
    expectTypeOf(ɵisQRCodeDotType).parameter(0).toEqualTypeOf<unknown>();
    expectTypeOf(ɵisQRCodeCornerSquareType).parameter(0).toEqualTypeOf<unknown>();
    expectTypeOf(ɵisQRCodeCornerDotType).parameter(0).toEqualTypeOf<unknown>();
    expectTypeOf(ɵparseQRCodeStylingOptions).returns.toEqualTypeOf<QRCodeParsedStylingOptions>();

    expect(ɵECC_LEVELS).toEqual(['L', 'M', 'Q', 'H']);
    expect(ɵMODES).toEqual(['numeric', 'alphanumeric', 'octet']);
    expect(ɵQR_CODE_COLOR_HEX_PATTERN.test('#123456')).toBe(true);
    expect(ɵQR_CODE_DOT_TYPES).toContain('classy-rounded');
    expect(ɵQR_CODE_CORNER_SQUARE_TYPES).toContain('dot');
    expect(ɵQR_CODE_CORNER_DOT_TYPES).toContain('dot');

    const value: unknown = '#123456';
    expect(ɵisQRCodeColorHex(value)).toBe(true);
    if (ɵisQRCodeColorHex(value)) expectTypeOf(value).toEqualTypeOf<QRCodeColorHex>();
  });

  test('keeps primary runtime APIs public and prefixes package-internal exports', () => {
    expect(qrcode).toBeTypeOf('function');
    expect(QRCodeBuilder).toBeTypeOf('function');
    expect(QRCodeSVGRenderer).toBeTypeOf('function');
    expect(QRCodeTextRenderer).toBeTypeOf('function');

    const legacyInternalNames = [
      'calculateQRCodeRenderedSize',
      'createQRCodeStylePlan',
      'parseQRCodeStylingOptions',
      'isQRCodeColorHex',
      'isQRCodeCornerDotType',
      'isQRCodeCornerSquareType',
      'isQRCodeDotType',
      'isValidQRCodeMargin',
      'isValidQRCodeSize',
      'ECC_LEVELS',
      'MODES',
      'QR_CODE_COLOR_HEX_PATTERN',
      'QR_CODE_DOT_TYPES',
      'QR_CODE_CORNER_SQUARE_TYPES',
      'QR_CODE_CORNER_DOT_TYPES',
    ];
    for (const name of legacyInternalNames) expect(core).not.toHaveProperty(name);
  });

  test('exports prefixed QR matrix metadata contracts', () => {
    expectTypeOf(
      ɵgenerateQRCodeMatrixWithMetadata,
    ).returns.toEqualTypeOf<ɵQRCodeMatrixGenerationMetadata>();
    expectTypeOf<ɵQRCodeMatrixModuleMetadata['role']>().toEqualTypeOf<ɵQRCodeMatrixMetadataRole>();

    const generated = ɵgenerateQRCodeMatrixWithMetadata('1', {version: 1, mask: 0});
    expect(generated.moduleGrid).toHaveLength(21);
  });
});
