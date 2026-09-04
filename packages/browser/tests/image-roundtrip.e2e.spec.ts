import {QR_CODE_STYLING_ROUNDTRIP_FIXTURES, QR_CODE_TEST_FIXTURES} from '@repo/core-testing';
import {describe, expect, test} from 'vitest';

import {qrcode} from '@qrcodesdk/core';

import {QRCodeImageRenderer} from '../src';
import {JSQR_ROUNDTRIP_COMBINATIONS_TWO, decodeCanvasQRCode, imageToCanvas} from './helper';

async function decodeImageQRCode(image: HTMLImageElement): Promise<string> {
  return decodeCanvasQRCode(await imageToCanvas(image));
}

describe('QRCodeImageRenderer', () => {
  const defaultRenderer = QRCodeImageRenderer({style: {moduleSize: 4, quietZone: 4}});

  test.each(QR_CODE_TEST_FIXTURES)('decodes $name image output', async (fixture) => {
    await expect(
      decodeImageQRCode(qrcode().data(fixture.data).config(fixture).render(defaultRenderer)),
    ).resolves.toBe(fixture.data);
  });

  test.each(JSQR_ROUNDTRIP_COMBINATIONS_TWO)('decodes $name image output', async (fixture) => {
    await expect(
      decodeImageQRCode(qrcode(fixture.data).config(fixture).render(defaultRenderer)),
    ).resolves.toBe(fixture.data);
  });

  test.each(QR_CODE_STYLING_ROUNDTRIP_FIXTURES)(
    'decodes $name image styling fixture',
    async (fixture) => {
      const image = qrcode(fixture.data)
        .config(fixture.matrixOptions)
        .render(QRCodeImageRenderer({style: fixture.styling}));

      await expect(decodeImageQRCode(image)).resolves.toBe(fixture.data);
    },
  );
});
