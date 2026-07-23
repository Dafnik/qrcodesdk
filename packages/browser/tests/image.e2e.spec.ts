import {QR_CODE_STYLING_FIXTURES, QR_CODE_TEST_FIXTURES} from '@repo/core-testing';
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

  test.each(QR_CODE_STYLING_FIXTURES)('decodes $name image styling fixture', async (fixture) => {
    const image = qrcode(fixture.data)
      .config(fixture.matrixOptions)
      .render(QRCodeImageRenderer(fixture.styling));

    await expect(decodeImageQRCode(image)).resolves.toBe(fixture.data);
  });
});
