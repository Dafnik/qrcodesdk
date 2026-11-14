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
import * as kanjiEntry from '../src/kanji';
import * as matrix from '../src/matrix';
import * as payload from '../src/payload';
import type {
  QRCodeCalendarPayload,
  QRCodeEmailPayload,
  QRCodeGeoPayload,
  QRCodePhonePayload,
  QRCodeSMSPayload,
  QRCodeVCardAddress,
  QRCodeVCardEmail,
  QRCodeVCardName,
  QRCodeVCardPayload,
  QRCodeVCardPhone,
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
    expect(() => plain.render()).toThrowError(
      expect.objectContaining({name: 'QRCodeError', code: 'RENDERER_MISSING'}),
    );
  });

  test('exposes the Kanji table only through the Kanji subpath', () => {
    expect(Object.keys(kanjiEntry)).toEqual(['kanji']);
    expect(Object.keys(core)).not.toContain('kanji');
    expectTypeOf(kanjiEntry.kanji).toEqualTypeOf<core.QRCodeKanji>();
    expectTypeOf<kanjiEntry.QRCodeKanji>().toEqualTypeOf<core.QRCodeKanji>();
    expectTypeOf<core.QRCodeMatrixOptions['kanji']>().toEqualTypeOf<core.QRCodeKanji | undefined>();
    expectTypeOf<core.QRCodeEncodingMode>().toEqualTypeOf<
      'numeric' | 'alphanumeric' | 'octet' | 'kanji'
    >();
  });

  test('creates SVG center images through the exported factory', () => {
    expect(core.svgCenterImage).toBeTypeOf('function');
    expectTypeOf(core.svgCenterImage).returns.toEqualTypeOf<core.QRCodeSVGCenterImage>();
  });

  test('exposes payload utilities and types from the payload subpath', () => {
    expect(Object.keys(payload).sort()).toEqual(
      expect.arrayContaining([
        'calendarPayload',
        'vcardPayload',
        'emailPayload',
        'geoPayload',
        'phonePayload',
        'smsPayload',
        'wifiPayload',
      ]),
    );
    expectTypeOf<QRCodeCalendarPayload>().toHaveProperty('uid');
    expectTypeOf<QRCodeVCardPayload>().toHaveProperty('formattedName');
    expectTypeOf<QRCodeVCardName>().toHaveProperty('familyName');
    expectTypeOf<QRCodeVCardPhone>().toHaveProperty('number');
    expectTypeOf<QRCodeVCardEmail>().toHaveProperty('address');
    expectTypeOf<QRCodeVCardAddress>().toHaveProperty('postalCode');
    expectTypeOf(payload.vcardPayload).returns.toEqualTypeOf<string>();
    expectTypeOf(payload.calendarPayload).returns.toEqualTypeOf<string>();
    expectTypeOf<QRCodeEmailPayload>().toHaveProperty('to');
    expectTypeOf<QRCodePhonePayload>().toHaveProperty('number');
    expectTypeOf<QRCodeSMSPayload>().toHaveProperty('recipients');
    expectTypeOf<QRCodeGeoPayload>().toHaveProperty('latitude');
    expectTypeOf<QRCodeWiFiEncryption>().toEqualTypeOf<'WPA' | 'WEP' | 'nopass'>();
    expectTypeOf<QRCodeWiFiPayload>().toHaveProperty('ssid');
  });
});

// Compile-time failures belong outside executed tests.
function payloadTypeChecks() {
  // @ts-expect-error Calendar identity is mandatory.
  const missingUID: QRCodeCalendarPayload = {
    timestamp: '2026-01-01T00:00:00Z',
    summary: 'A',
    start: '2026-01-01',
    end: '2026-01-02',
  };
  // @ts-expect-error Timestamp is caller supplied.
  const missingTimestamp: QRCodeCalendarPayload = {
    uid: 'a',
    summary: 'A',
    start: '2026-01-01',
    end: '2026-01-02',
  };
  // @ts-expect-error An explicit end is mandatory.
  const missingEnd: QRCodeCalendarPayload = {
    uid: 'a',
    timestamp: '2026-01-01T00:00:00Z',
    summary: 'A',
    start: '2026-01-01',
  };
  const invalidVariant: QRCodeCalendarPayload = {
    uid: 'a',
    timestamp: '2026-01-01T00:00:00Z',
    summary: 'A',
    start: '2026-01-01',
    end: '2026-01-02',
    // @ts-expect-error The discriminant is boolean.
    allDay: 'true',
  };
  // @ts-expect-error A formatted name is mandatory.
  const missingName: QRCodeVCardPayload = {};
  return [missingUID, missingTimestamp, missingEnd, invalidVariant, missingName];
}
void payloadTypeChecks;
