import {fixtureMatrixOptions, fixtureMicroMatrixOptions} from '@repo/core-testing';
import {
  QR_CODE_CENTER_IMAGE_FIXTURES,
  QR_CODE_MICRO_STYLE_VARIANT_FIXTURES,
  QR_CODE_MICRO_TEST_FIXTURES,
  QR_CODE_ROUNDTRIP_TEST_FIXTURES,
  QR_CODE_STYLE_VARIANT_FIXTURES,
  QR_CODE_STYLING_FIXTURES,
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
  ROUNDTRIP_COMBINATIONS_TWO,
  decodeCanvasMicroQRCode,
  decodeCanvasQRCode,
  fixtureImageCanvas,
  imageToCanvas,
} from './helper';

async function decodeImageQRCode(image: HTMLImageElement): Promise<string> {
  return decodeCanvasQRCode(await imageToCanvas(image));
}

describe('QRCodePNGImageRenderer', () => {
  const defaultRenderer = QRCodePNGImageRenderer({style: {moduleSize: 4, quietZone: 4}});

  test.each(ROUNDTRIP_COMBINATIONS_TWO)('decodes $name image output', async (fixture) => {
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

  test.each(QR_CODE_ROUNDTRIP_TEST_FIXTURES)(
    `decodes $name ${format} image output`,
    async (fixture) => {
      await expect(
        decodeImageQRCode(
          qrcode()
            .payload(fixture.payload)
            .options(fixtureMatrixOptions(fixture))
            .render(defaultRenderer),
        ),
      ).resolves.toBe(fixture.payload);
    },
  );

  // Micro QR fixtures keep the default quiet zone of 2 modules.
  const microRenderer = createRenderer({style: {moduleSize: 4}});

  test.each(QR_CODE_MICRO_TEST_FIXTURES)(
    `decodes $name ${format} Micro QR image output`,
    async (fixture) => {
      const image = qrcode(fixture.payload)
        .options(fixtureMicroMatrixOptions(fixture))
        .render(microRenderer);

      await expect(decodeCanvasMicroQRCode(await imageToCanvas(image))).resolves.toMatchObject({
        text: fixture.payload,
        version: fixture.version,
      });
    },
  );

  test.each(QR_CODE_MICRO_STYLE_VARIANT_FIXTURES)(
    `decodes $name ${format} Micro QR image style variant`,
    async (fixture) => {
      const image = qrcode(fixture.payload)
        .options(fixture.matrixOptions)
        .render(createRenderer({style: fixture.styling}));

      await expect(decodeCanvasMicroQRCode(await imageToCanvas(image))).resolves.toMatchObject({
        text: fixture.payload,
      });
    },
  );

  test.each(QR_CODE_STYLING_FIXTURES)(
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
