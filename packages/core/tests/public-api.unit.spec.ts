import {describe, expect, expectTypeOf, test} from 'vitest';

// @ts-expect-error The unprefixed internal styling type is intentionally not exported.
import type {QRCodeParsedStylingOptions as LegacyParsedStylingOptions} from '../src';
// @ts-expect-error The unprefixed internal image type is intentionally not exported.
import type {QRCodeResolvedImageOverlay as LegacyResolvedImageOverlay} from '../src';
// @ts-expect-error The unprefixed internal matrix type is intentionally not exported.
import type {QRCodeResolvedMatrixOptions as LegacyResolvedMatrixOptions} from '../src';
// @ts-expect-error The unprefixed internal style-plan type is intentionally not exported.
import type {QRCodeStylePlan as LegacyStylePlan} from '../src';
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
  ɵresolveQRCodeImageOverlay,
} from '../src';
import type {
  QRCodeAccessibilityOptions,
  QRCodeColorHex,
  QRCodeCornerDotType,
  QRCodeCornerSquareType,
  QRCodeCornersDotOptions,
  QRCodeCornersSquareOptions,
  QRCodeDataImageURL,
  QRCodeDotType,
  QRCodeDotsOptions,
  QRCodeErrorCorrectionLevel,
  QRCodeImageOverlayOptions,
  QRCodeInputData,
  QRCodeMatrix,
  QRCodeMatrixOptions,
  QRCodeOptions,
  QRCodeSVGImageOptions,
  QRCodeSVGOptions,
  QRCodeSVGRendererOptions,
  QRCodeStylingColors,
  QRCodeStylingOptions,
  QRCodeTextRendererOptions,
  ɵQRCodeFinderCenterStylePrimitive,
  ɵQRCodeFinderRingStylePrimitive,
  ɵQRCodeMatrixGenerationMetadata,
  ɵQRCodeMatrixMetadataRole,
  ɵQRCodeMatrixModuleMetadata,
  ɵQRCodeModuleShape,
  ɵQRCodeModuleStylePrimitive,
  ɵQRCodeParsedStylingOptions,
  ɵQRCodeResolvedImageOverlay,
  ɵQRCodeResolvedMatrixOptions,
  ɵQRCodeStyleLayer,
  ɵQRCodeStylePlan,
  ɵQRCodeStylePrimitive,
  ɵQRCodeStyleRectangle,
  ɵQRCodeStyleRole,
  ɵQRCodeStyleRotation,
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
      eci?: boolean;
    }>();
    expectTypeOf<ɵQRCodeResolvedMatrixOptions['eci']>().toEqualTypeOf<boolean>();
    expectTypeOf(qrcode('data').eci(true).matrix()).toEqualTypeOf<QRCodeMatrix>();
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
    expectTypeOf<ɵQRCodeParsedStylingOptions>().toMatchTypeOf<ExpectedParsedStylingOptions>();
    expectTypeOf<ExpectedParsedStylingOptions>().toMatchTypeOf<ɵQRCodeParsedStylingOptions>();
    expectTypeOf<QRCodeSVGOptions>().toEqualTypeOf<QRCodeOptions<QRCodeSVGRendererOptions>>();
    expectTypeOf<QRCodeSVGOptions>().toEqualTypeOf<
      QRCodeMatrixOptions &
        QRCodeStylingOptions &
        QRCodeAccessibilityOptions & {image?: QRCodeSVGImageOptions}
    >();
    expectTypeOf<QRCodeDataImageURL>().toMatchTypeOf<string>();
    expectTypeOf<QRCodeSVGImageOptions>().toEqualTypeOf<
      QRCodeImageOverlayOptions<QRCodeDataImageURL>
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
    expectTypeOf(ɵcreateQRCodeStylePlan).parameter(1).toEqualTypeOf<ɵQRCodeParsedStylingOptions>();
    expectTypeOf(ɵcreateQRCodeStylePlan).returns.toEqualTypeOf<ɵQRCodeStylePlan>();
    expectTypeOf(ɵisQRCodeDotType).parameter(0).toEqualTypeOf<unknown>();
    expectTypeOf(ɵisQRCodeCornerSquareType).parameter(0).toEqualTypeOf<unknown>();
    expectTypeOf(ɵisQRCodeCornerDotType).parameter(0).toEqualTypeOf<unknown>();
    expectTypeOf(ɵparseQRCodeStylingOptions).returns.toEqualTypeOf<ɵQRCodeParsedStylingOptions>();
    expectTypeOf(ɵresolveQRCodeImageOverlay).parameter(0).toEqualTypeOf<number>();
    expectTypeOf(ɵresolveQRCodeImageOverlay(21, 4, {source: 'image'})).toEqualTypeOf<
      ɵQRCodeResolvedImageOverlay<string> | undefined
    >();
    expectTypeOf<ɵQRCodeStylePlan['layers'][number]>().toEqualTypeOf<ɵQRCodeStyleLayer>();
    expectTypeOf<ɵQRCodeStyleLayer['rectangles'][number]>().toEqualTypeOf<ɵQRCodeStyleRectangle>();
    expectTypeOf<ɵQRCodeStylePlan['primitives'][number]>().toEqualTypeOf<ɵQRCodeStylePrimitive>();
    expectTypeOf<
      Extract<ɵQRCodeStylePrimitive, {kind: 'module'}>
    >().toEqualTypeOf<ɵQRCodeModuleStylePrimitive>();
    expectTypeOf<
      Extract<ɵQRCodeStylePrimitive, {kind: 'finder-ring'}>
    >().toEqualTypeOf<ɵQRCodeFinderRingStylePrimitive>();
    expectTypeOf<
      Extract<ɵQRCodeStylePrimitive, {kind: 'finder-center'}>
    >().toEqualTypeOf<ɵQRCodeFinderCenterStylePrimitive>();
    expectTypeOf<ɵQRCodeModuleStylePrimitive['shape']>().toEqualTypeOf<ɵQRCodeModuleShape>();
    expectTypeOf<ɵQRCodeStylePrimitive['role']>().toMatchTypeOf<ɵQRCodeStyleRole>();
    expectTypeOf<ɵQRCodeStylePrimitive['rotation']>().toEqualTypeOf<ɵQRCodeStyleRotation>();

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
    expectTypeOf<LegacyParsedStylingOptions>();
    expectTypeOf<LegacyResolvedImageOverlay>();
    expectTypeOf<LegacyResolvedMatrixOptions>();
    expectTypeOf<LegacyStylePlan>();

    expect(qrcode).toBeTypeOf('function');
    expect(QRCodeBuilder).toBeTypeOf('function');
    expect(QRCodeSVGRenderer).toBeTypeOf('function');
    expect(QRCodeTextRenderer).toBeTypeOf('function');

    const legacyInternalNames = [
      'calculateQRCodeRenderedSize',
      'createQRCodeStylePlan',
      'resolveQRCodeImageOverlay',
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
