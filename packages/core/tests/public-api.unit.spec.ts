import {describe, expect, expectTypeOf, test} from 'vitest';

import * as core from '../src';
import {
  QRCodeBuilder,
  QRCodeError,
  QRCodeSVGRenderer,
  QRCodeTextRenderer,
  createQRCodeStyler,
  qrcode,
} from '../src';
import type {
  QRCodeColor,
  QRCodeFinderShape,
  QRCodeModuleShape,
  QRCodeTextStyle,
  QRCodeVisualStyle,
} from '../src';
import * as drawing from '../src/drawing';
import type {QRCodeDrawing, QRCodeDrawingTarget, QRCodeStyler} from '../src/drawing';

describe('public API', () => {
  test('exports the stable runtime surface without internal utility exports', () => {
    expect(Object.keys(core).sort()).toEqual([
      'QRCodeBuilder',
      'QRCodeError',
      'QRCodeSVGRenderer',
      'QRCodeTextRenderer',
      'QR_CODE_ERROR_CODES',
      'createQRCodeStyler',
      'emailPayload',
      'geoPayload',
      'phonePayload',
      'qrcode',
      'smsPayload',
      'wifiPayload',
    ]);
    expect(qrcode).toBeTypeOf('function');
    expect(createQRCodeStyler).toBeTypeOf('function');
    expect(QRCodeBuilder).toBeTypeOf('function');
    expect(QRCodeError).toBeTypeOf('function');
    expect(QRCodeSVGRenderer).toBeTypeOf('function');
    expect(QRCodeTextRenderer).toBeTypeOf('function');
    const internalPrefix = String.fromCodePoint(0x275);
    expect([...Object.keys(core), ...Object.keys(drawing)]).not.toEqual(
      expect.arrayContaining([expect.stringMatching(new RegExp(`^${internalPrefix}`, 'u'))]),
    );
  });

  test('exposes the renderer-owned style contracts', () => {
    expectTypeOf<QRCodeColor>().toMatchTypeOf<`#${string}`>();
    expectTypeOf<QRCodeModuleShape>().toEqualTypeOf<
      'square' | 'circle' | 'rounded' | 'extra-rounded' | 'diagonal' | 'diagonal-rounded'
    >();
    expectTypeOf<QRCodeFinderShape>().toEqualTypeOf<
      'square' | 'rounded' | 'extra-rounded' | 'circle'
    >();
    expectTypeOf<QRCodeVisualStyle>().toHaveProperty('finder');
    expectTypeOf<QRCodeTextStyle>().toHaveProperty('moduleSize');
  });

  test('exposes drawing types from the drawing subpath', () => {
    expectTypeOf(createQRCodeStyler).returns.toEqualTypeOf<QRCodeStyler>();
    expectTypeOf<QRCodeStyler['draw']>().returns.toEqualTypeOf<QRCodeDrawing>();
    expectTypeOf<QRCodeDrawing['paint']>().parameter(0).toEqualTypeOf<QRCodeDrawingTarget>();
  });
});
