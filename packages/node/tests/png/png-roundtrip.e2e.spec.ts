import {QR_CODE_STYLING_ROUNDTRIP_FIXTURES, QR_CODE_TEST_FIXTURES} from '@repo/core-testing';
import sharp from 'sharp';
import {describe, expect, test} from 'vitest';

import {qrcode} from '@qrcodesdk/core';

import {QRCodePNGRenderer, pngCenterImage} from '../../src';
import {decodePngQRCode} from './png-helpers';

describe('PNG QR roundtrips', () => {
  test('decodes output with a small prepared PNG center image', async () => {
    const logo = await sharp({
      create: {width: 8, height: 4, channels: 4, background: {r: 220, g: 38, b: 38, alpha: 1}},
    })
      .png()
      .toBuffer();

    await expect(
      decodePngQRCode(
        qrcode('prepared Node image')
          .errorCorrection('H')
          .render(
            QRCodePNGRenderer({
              style: {moduleSize: 4, quietZone: 4},
              centerImage: pngCenterImage(logo, {size: 0.16, padding: 0.25}),
            }),
          ),
      ),
    ).resolves.toBe('prepared Node image');
  });

  const defaultRenderer = QRCodePNGRenderer({style: {moduleSize: 4, quietZone: 4}});

  test.each(
    ['Grüße aus Wien', '東京 ✅🚀'].flatMap((payload) => [
      {payload, eci: false},
      {payload, eci: true},
    ]),
  )('decodes UTF-8 PNG output for $payload with ECI $eci', async ({payload, eci}) => {
    await expect(
      decodePngQRCode(qrcode(payload).mode('octet').eci(eci).render(defaultRenderer)),
    ).resolves.toBe(payload);
  });

  test.each(QR_CODE_TEST_FIXTURES)('decodes $name PNG output', async (fixture) => {
    await expect(
      decodePngQRCode(qrcode(fixture.payload).options(fixture).render(defaultRenderer)),
    ).resolves.toBe(fixture.payload);
  });

  test.each(QR_CODE_STYLING_ROUNDTRIP_FIXTURES)(
    'decodes $name PNG styling fixture',
    async (fixture) => {
      await expect(
        decodePngQRCode(
          qrcode(fixture.payload)
            .options(fixture.matrixOptions)
            .render(QRCodePNGRenderer({style: fixture.styling})),
        ),
      ).resolves.toBe(fixture.payload);
    },
  );
});
