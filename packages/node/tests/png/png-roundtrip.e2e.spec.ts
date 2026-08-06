import {QR_CODE_STYLING_FIXTURES, QR_CODE_TEST_FIXTURES} from '@repo/core-testing';
import {PNG} from 'pngjs';
import {describe, expect, test} from 'vitest';

import {qrcode} from '@qrcodesdk/core';

import {QRCodePNGRenderer} from '../../src';
import {decodePngQRCode} from './png-helpers';

describe('PNG QR roundtrips', () => {
  test('decodes output with a small prepared PNG overlay', () => {
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
              size: 4,
              margin: 4,
              image: {
                source: PNG.sync.write(logo),
                size: 0.16,
                padding: 0.25,
              },
            }),
          ),
      ),
    ).toBe('prepared Node image');
  });

  const defaultRenderer = QRCodePNGRenderer({size: 4, margin: 4});

  test.each(
    ['Grüße aus Wien', '東京 ✅🚀'].flatMap((data) => [
      {data, eci: false},
      {data, eci: true},
    ]),
  )('decodes UTF-8 PNG output for $data with ECI $eci', ({data, eci}) => {
    expect(decodePngQRCode(qrcode(data).mode('octet').eci(eci).render(defaultRenderer))).toBe(data);
  });

  test.each(QR_CODE_TEST_FIXTURES)('decodes $name PNG output', (fixture) => {
    expect(decodePngQRCode(qrcode(fixture.data).config(fixture).render(defaultRenderer))).toBe(
      fixture.data,
    );
  });

  test.each(QR_CODE_STYLING_FIXTURES)('decodes $name PNG styling fixture', (fixture) => {
    expect(
      decodePngQRCode(
        qrcode(fixture.data)
          .config(fixture.matrixOptions)
          .render(QRCodePNGRenderer(fixture.styling)),
      ),
    ).toBe(fixture.data);
  });
});
