import {describe, expect, expectTypeOf, test} from 'vitest';

import * as core from '../src';
import {QRCodeBuilder, QRCodeError, QRCodeSVGRenderer, QRCodeTextRenderer, qrcode} from '../src';
import type {
  QRCodeAlignmentStyle,
  QRCodeColor,
  QRCodeFinderStyle,
  QRCodeMatrix,
  QRCodeModuleRole,
  QRCodeModuleShape,
  QRCodeShape,
  QRCodeShapePiece,
  QRCodeTextStyle,
  QRCodeVisualStyle,
} from '../src';
import * as matrix from '../src/matrix';
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
  test('exports the documented runtime API', () => {
    expect(Object.keys(core).sort()).toEqual(
      expect.arrayContaining([
        'QRCodeBuilder',
        'QRCodeError',
        'QRCodeSVGRenderer',
        'QRCodeTextRenderer',
        'QR_CODE_ERROR_CODES',
        'QR_CODE_MODULE_ROLES',
        'qrcode',
        'svgCenterImage',
      ]),
    );
    expect(qrcode).toBeTypeOf('function');
    expect(QRCodeBuilder).toBeTypeOf('function');
    expect(QRCodeError).toBeTypeOf('function');
    expect(QRCodeSVGRenderer).toBeTypeOf('function');
    expect(QRCodeTextRenderer).toBeTypeOf('function');
  });

  test('exposes the renderer-owned style contracts', () => {
    expectTypeOf<QRCodeColor>().toMatchTypeOf<`#${string}`>();
    expectTypeOf<QRCodeModuleRole>().toEqualTypeOf<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>();
    expectTypeOf<QRCodeMatrix['modules']>().toEqualTypeOf<readonly (0 | 1)[]>();
    expectTypeOf<QRCodeMatrix['roles']>().toEqualTypeOf<readonly QRCodeModuleRole[]>();
    expectTypeOf<QRCodeVisualStyle['modules']>().toEqualTypeOf<QRCodeModuleShape | undefined>();
    expectTypeOf<QRCodeVisualStyle['finder']>().toEqualTypeOf<QRCodeFinderStyle | undefined>();
    expectTypeOf<QRCodeVisualStyle['alignment']>().toEqualTypeOf<
      QRCodeAlignmentStyle | undefined
    >();
    expectTypeOf<QRCodeTextStyle>().toHaveProperty('moduleSize');
  });

  test('exposes shape factories', () => {
    expect(Object.keys(style).sort()).toEqual(
      expect.arrayContaining([
        'alignment',
        'circle',
        'customShape',
        'diagonal',
        'finder',
        'rounded',
      ]),
    );
    expectTypeOf(style.rounded).returns.toEqualTypeOf<QRCodeShape>();
    expectTypeOf(style.finder).returns.toEqualTypeOf<QRCodeFinderStyle>();
    expectTypeOf(style.customShape({module: 'm0 0h1v1h-1z'})).toEqualTypeOf<QRCodeModuleShape>();
    expectTypeOf(style.customShape({finderRing: 'm0 0h7v7h-7zm1 1h5v5h-5z'})).toEqualTypeOf<{
      readonly finderRing: QRCodeShapePiece;
    }>();
  });

  test('exposes the builder, matrix types, and role names through the matrix entry', () => {
    expect(Object.keys(matrix).sort()).toEqual(
      expect.arrayContaining(['QRCodeBuilder', 'QR_CODE_MODULE_ROLES', 'qrcode']),
    );
    expect(matrix.QR_CODE_MODULE_ROLES).toBe(core.QR_CODE_MODULE_ROLES);
    expectTypeOf<matrix.QRCodeMatrix>().toEqualTypeOf<QRCodeMatrix>();
    expectTypeOf<matrix.QRCodeModuleRole>().toEqualTypeOf<QRCodeModuleRole>();
  });

  test('accepts configured builders through a bare builder type', () => {
    const plain: QRCodeBuilder = qrcode('typed builder');
    const withRenderer: QRCodeBuilder = qrcode('typed builder').renderer(QRCodeSVGRenderer());
    const size = (builder: QRCodeBuilder) => builder.render((value) => value.size);
    expect(size(plain)).toBe(size(withRenderer));
  });

  test('creates SVG center images through the exported factory', () => {
    expect(core.svgCenterImage).toBeTypeOf('function');
    expectTypeOf(core.svgCenterImage).returns.toEqualTypeOf<core.QRCodeSVGCenterImage>();
  });

  test('exposes payload utilities and types from the payload subpath', () => {
    expect(Object.keys(payload).sort()).toEqual(
      expect.arrayContaining([
        'emailPayload',
        'geoPayload',
        'phonePayload',
        'smsPayload',
        'wifiPayload',
      ]),
    );
    expectTypeOf<QRCodeEmailPayload>().toHaveProperty('to');
    expectTypeOf<QRCodePhonePayload>().toHaveProperty('number');
    expectTypeOf<QRCodeSMSPayload>().toHaveProperty('recipients');
    expectTypeOf<QRCodeGeoPayload>().toHaveProperty('latitude');
    expectTypeOf<QRCodeWiFiEncryption>().toEqualTypeOf<'WPA' | 'WEP' | 'nopass'>();
    expectTypeOf<QRCodeWiFiPayload>().toHaveProperty('ssid');
  });
});
