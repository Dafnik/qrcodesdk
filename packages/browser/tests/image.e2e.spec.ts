import {QR_CODE_TEST_FIXTURES} from '@repo/core-testing';
import {describe, expect, test} from 'vitest';

import {qrcode} from '@qrcodesdk/core';

import {QRCodeImageRenderer} from '../src';
import {JSQR_ROUNDTRIP_COMBINATIONS_TWO, decodeCanvasQRCode, imageToCanvas} from './helper';

async function decodeImageQRCode(image: HTMLImageElement): Promise<string> {
  return decodeCanvasQRCode(await imageToCanvas(image));
}

describe('QRCodeImageRenderer', () => {
  test.each(QR_CODE_TEST_FIXTURES)('decodes $name image output', async (fixture) => {
    await expect(
      decodeImageQRCode(
        qrcode()
          .data(fixture.data)
          .config(fixture)
          .render(QRCodeImageRenderer({size: 8, margin: 4})),
      ),
    ).resolves.toBe(fixture.data);
  });

  test.each(JSQR_ROUNDTRIP_COMBINATIONS_TWO)('decodes $name image output', async (fixture) => {
    await expect(
      decodeImageQRCode(
        qrcode(fixture.data)
          .config(fixture)
          .render(QRCodeImageRenderer({size: 8, margin: 4})),
      ),
    ).resolves.toBe(fixture.data);
  });

  test('decodes custom high-contrast color image output', async () => {
    const fixture = QR_CODE_TEST_FIXTURES[1];
    const image = qrcode()
      .data(fixture.data)
      .config(fixture)
      .render(
        QRCodeImageRenderer({
          size: 8,
          margin: 4,
          colors: {
            colorLight: '#fefefe',
            colorDark: '#101010',
          },
        }),
      );

    await expect(decodeImageQRCode(image)).resolves.toBe(QR_CODE_TEST_FIXTURES[1].data);
  });

  test('decodes mixed styled PNG image output', async () => {
    const image = qrcode('mixed styled browser png').render(
      QRCodeImageRenderer({
        size: 12,
        dotsOptions: {color: '#112233', type: 'classy-rounded'},
        cornersSquareOptions: {color: '#445566', type: 'extra-rounded'},
        cornersDotOptions: {color: '#778899', type: 'dot'},
      }),
    );

    await expect(decodeImageQRCode(image)).resolves.toBe('mixed styled browser png');
  });
});
