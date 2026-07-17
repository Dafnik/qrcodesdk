import {QR_CODE_TEST_FIXTURES, getAllQRCodeCombinations} from '@repo/core-testing';
import {describe, expect, test} from 'vitest';

import {qrcode} from '@qrcodesdk/core';

import {QRCodeImageRenderer} from '../src';
import {decodeCanvasQRCode, imageToCanvas} from './helper';

/**
 * Version 23 QR codes always fail to decode
 * https://github.com/cozmo/jsQR/issues/251
 */
const JSQR_ROUNDTRIP_COMBINATIONS = [...getAllQRCodeCombinations()].filter(
  ({version, errorCorrectionLevel}) => version !== 23 || errorCorrectionLevel !== 'L',
);

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

  test.each(JSQR_ROUNDTRIP_COMBINATIONS)('decodes $name image output', async (fixture) => {
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
});
