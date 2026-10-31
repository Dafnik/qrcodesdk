import {describe, expect, expectTypeOf, test} from 'vitest';

import * as core from '../src';
import {QRCodeBuilder, QRCodeError, QRCodeSVGRenderer, QRCodeTextRenderer, qrcode} from '../src';
import type {
  QRCodeColor,
  QRCodeMatrix,
  QRCodeModuleRole,
  QRCodeModuleShape,
  QRCodeShape,
  QRCodeStylePart,
  QRCodeTextStyle,
  QRCodeVisualStyle,
} from '../src';
import * as drawing from '../src/drawing';
import type {QRCodeDrawContext, QRCodeDrawing, QRCodeStyler} from '../src/drawing';
import * as payload from '../src/payload';
import type {
  QRCodeEmailPayload,
  QRCodeGeoPayload,
  QRCodePhonePayload,
  QRCodeSMSPayload,
  QRCodeWiFiEncryption,
  QRCodeWiFiPayload,
} from '../src/payload';
import * as style from '../src/style';

describe('public API', () => {
  test('exports the documented runtime API without internal utilities', () => {
    expect(Object.keys(core).sort()).toEqual([
      'QRCodeBuilder',
      'QRCodeError',
      'QRCodeSVGRenderer',
      'QRCodeTextRenderer',
      'QR_CODE_ERROR_CODES',
      'qrcode',
      'svgCenterImage',
    ]);
    expect(qrcode).toBeTypeOf('function');
    expectTypeOf<typeof core>().not.toHaveProperty('createQRCodeStyler');
    expect(QRCodeBuilder).toBeTypeOf('function');
    expect(QRCodeError).toBeTypeOf('function');
    expect(QRCodeSVGRenderer).toBeTypeOf('function');
    expect(QRCodeTextRenderer).toBeTypeOf('function');
    const internalPrefix = String.fromCodePoint(0x275);
    expect([
      ...Object.keys(core),
      ...Object.keys(drawing),
      ...Object.keys(payload),
      ...Object.keys(style),
    ]).not.toEqual(
      expect.arrayContaining([expect.stringMatching(new RegExp(`^${internalPrefix}`, 'u'))]),
    );
  });

  test('exposes the renderer-owned style contracts', () => {
    expectTypeOf<QRCodeColor>().toMatchTypeOf<`#${string}`>();
    expectTypeOf<QRCodeModuleRole>().toEqualTypeOf<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>();
    expectTypeOf<QRCodeMatrix['modules']>().toEqualTypeOf<readonly number[]>();
    expectTypeOf<QRCodeMatrix['roles']>().toEqualTypeOf<readonly number[]>();
    expectTypeOf<QRCodeVisualStyle['modules']>().toEqualTypeOf<QRCodeModuleShape | undefined>();
    expectTypeOf<QRCodeVisualStyle['finder']>().toEqualTypeOf<QRCodeStylePart | undefined>();
    expectTypeOf<QRCodeVisualStyle['alignment']>().toEqualTypeOf<QRCodeStylePart | undefined>();
    expectTypeOf<QRCodeTextStyle>().toHaveProperty('moduleSize');
  });

  test('exposes shapes and parts from the style subpath', () => {
    expect(Object.keys(style).sort()).toEqual([
      'alignment',
      'circle',
      'diagonal',
      'finder',
      'rounded',
    ]);
    expectTypeOf(style.rounded).returns.toEqualTypeOf<QRCodeShape>();
    expectTypeOf(style.finder).returns.toEqualTypeOf<QRCodeStylePart>();
    expectTypeOf<typeof core>().not.toHaveProperty('rounded');
  });

  test('exposes the styler and drawing types from the drawing subpath', () => {
    expect(Object.keys(drawing).sort()).toEqual([
      'QR_CODE_MODULE_ROLES',
      'createQRCodeCenterImage',
      'createQRCodeStyler',
      'toQRCodePathData',
    ]);
    expectTypeOf(drawing.createQRCodeStyler).returns.toEqualTypeOf<QRCodeStyler>();
    expectTypeOf<QRCodeStyler>().returns.toEqualTypeOf<QRCodeDrawing>();
    expectTypeOf<QRCodeStylePart>().parameter(0).toEqualTypeOf<QRCodeDrawContext>();
  });

  test('exposes payload utilities and types from the payload subpath', () => {
    expect(Object.keys(payload).sort()).toEqual([
      'emailPayload',
      'geoPayload',
      'phonePayload',
      'smsPayload',
      'wifiPayload',
    ]);
    expectTypeOf<QRCodeEmailPayload>().toHaveProperty('to');
    expectTypeOf<QRCodePhonePayload>().toHaveProperty('number');
    expectTypeOf<QRCodeSMSPayload>().toHaveProperty('recipients');
    expectTypeOf<QRCodeGeoPayload>().toHaveProperty('latitude');
    expectTypeOf<QRCodeWiFiEncryption>().toEqualTypeOf<'WPA' | 'WEP' | 'nopass'>();
    expectTypeOf<QRCodeWiFiPayload>().toHaveProperty('ssid');
  });
});
