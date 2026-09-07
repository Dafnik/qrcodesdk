import {QR_CODE_STYLING_ROUNDTRIP_FIXTURES, QR_CODE_TEST_FIXTURES} from '@repo/core-testing';
import {PNG} from 'pngjs';
import {describe, expect, test} from 'vitest';

import {qrcode} from '@qrcodesdk/core';

import {QRCodePNGRenderer} from '../../src';
import {decodePngQRCode} from './png-helpers';

describe('PNG QR roundtrips', () => {
  test('decodes output with a small prepared PNG center image', () => {
    const logo = new PNG({width: 8, height: 4});
    for (let index = 0; index < logo.data.length; index += 4) {
      logo.data[index] = 220;
      logo.data[index + 1] = 38;
      logo.data[index + 2] = 38;
      logo.data[index + 3] = 255;
    }

    expect(
      decodePngQRCode(
        qrcode('prepared Node image')
          .errorCorrection('H')
          .render(
            QRCodePNGRenderer({
              style: {moduleSize: 4, quietZone: 4},
              centerImage: {
                source: PNG.sync.write(logo),
                size: 0.16,
                padding: 0.25,
              },
            }),
          ),
      ),
    ).toBe('prepared Node image');
  });

  const defaultRenderer = QRCodePNGRenderer({style: {moduleSize: 4, quietZone: 4}});

  test.each(
    ['Grüße aus Wien', '東京 ✅🚀'].flatMap((payload) => [
      {payload, eci: false},
      {payload, eci: true},
    ]),
  )('decodes UTF-8 PNG output for $payload with ECI $eci', ({payload, eci}) => {
    expect(decodePngQRCode(qrcode(payload).mode('octet').eci(eci).render(defaultRenderer))).toBe(
      payload,
    );
  });

  test.each(QR_CODE_TEST_FIXTURES)('decodes $name PNG output', (fixture) => {
    expect(decodePngQRCode(qrcode(fixture.payload).options(fixture).render(defaultRenderer))).toBe(
      fixture.payload,
    );
  });

  test.each(QR_CODE_STYLING_ROUNDTRIP_FIXTURES)('decodes $name PNG styling fixture', (fixture) => {
    expect(
      decodePngQRCode(
        qrcode(fixture.payload)
          .options(fixture.matrixOptions)
          .render(QRCodePNGRenderer({style: fixture.styling})),
      ),
    ).toBe(fixture.payload);
  });
});
