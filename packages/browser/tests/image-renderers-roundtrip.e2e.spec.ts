import {fixtureMatrixOptions} from '@repo/core-testing';
import {
  QR_CODE_CENTER_IMAGE_FIXTURES,
  QR_CODE_STYLE_VARIANT_FIXTURES,
  QR_CODE_STYLING_ROUNDTRIP_FIXTURES,
  QR_CODE_TEST_FIXTURES,
} from '@repo/core-testing';
import {describe, expect, test} from 'vitest';

import {qrcode} from '@qrcodesdk/core';

import {
  QRCodeGIFImageRenderer,
  QRCodeJPEGImageRenderer,
  QRCodePNGImageRenderer,
  QRCodeWebPImageRenderer,
  canvasCenterImage,
} from '../src';
import {
  JSQR_ROUNDTRIP_COMBINATIONS_TWO,
  decodeCanvasQRCode,
  fixtureImageCanvas,
  imageToCanvas,
} from './helper';

async function decodeImageQRCode(image: HTMLImageElement): Promise<string> {
  return decodeCanvasQRCode(await imageToCanvas(image));
}

describe('QRCodePNGImageRenderer', () => {
  const defaultRenderer = QRCodePNGImageRenderer({style: {moduleSize: 4, quietZone: 4}});

  test.each(JSQR_ROUNDTRIP_COMBINATIONS_TWO)('decodes $name image output', async (fixture) => {
    await expect(
      decodeImageQRCode(
        qrcode(fixture.payload).options(fixtureMatrixOptions(fixture)).render(defaultRenderer),
      ),
    ).resolves.toBe(fixture.payload);
  });
});

describe.each([
  {format: 'PNG', createRenderer: QRCodePNGImageRenderer},
  {format: 'WebP', createRenderer: QRCodeWebPImageRenderer},
  {format: 'GIF', createRenderer: QRCodeGIFImageRenderer},
  {format: 'JPEG', createRenderer: QRCodeJPEGImageRenderer},
])('$format image renderer roundtrips', ({format, createRenderer}) => {
  const defaultRenderer = createRenderer({style: {moduleSize: 4, quietZone: 4}});

  test.each(QR_CODE_TEST_FIXTURES)(`decodes $name ${format} image output`, async (fixture) => {
    await expect(
      decodeImageQRCode(
        qrcode()
          .payload(fixture.payload)
          .options(fixtureMatrixOptions(fixture))
          .render(defaultRenderer),
      ),
    ).resolves.toBe(fixture.payload);
  });

  test.each(QR_CODE_STYLING_ROUNDTRIP_FIXTURES)(
    `decodes $name ${format} image styling fixture`,
    async (fixture) => {
      const image = qrcode(fixture.payload)
        .options(fixture.matrixOptions)
        .render(createRenderer({style: fixture.styling}));

      await expect(decodeImageQRCode(image)).resolves.toBe(fixture.payload);
    },
  );

  test.each(QR_CODE_STYLE_VARIANT_FIXTURES)(
    `decodes $name ${format} image style variant`,
    async (fixture) => {
      const image = qrcode(fixture.payload)
        .options(fixture.matrixOptions)
        .render(createRenderer({style: fixture.styling}));

      await expect(decodeImageQRCode(image)).resolves.toBe(fixture.payload);
    },
  );

  test.each(QR_CODE_CENTER_IMAGE_FIXTURES)(
    `decodes $name ${format} image center image fixture`,
    async (fixture) => {
      const image = qrcode(fixture.payload)
        .options(fixture.matrixOptions)
        .render(
          createRenderer({
            style: fixture.style,
            centerImage: canvasCenterImage(fixtureImageCanvas(fixture.image), fixture.layout),
          }),
        );

      await expect(decodeImageQRCode(image)).resolves.toBe(fixture.payload);
    },
  );
});
