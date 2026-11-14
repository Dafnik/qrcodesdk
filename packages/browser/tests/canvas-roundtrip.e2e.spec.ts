import {
  fixtureMatrixOptions,
  fixtureMicroMatrixOptions,
  fixtureRMQRMatrixOptions,
} from '@repo/core-testing';
import {
  QR_CODE_CENTER_IMAGE_FIXTURES,
  QR_CODE_MICRO_STYLE_VARIANT_FIXTURES,
  QR_CODE_MICRO_TEST_FIXTURES,
  QR_CODE_RMQR_STYLE_VARIANT_FIXTURES,
  QR_CODE_RMQR_TEST_FIXTURES,
  QR_CODE_ROUNDTRIP_TEST_FIXTURES,
  QR_CODE_STYLE_VARIANT_FIXTURES,
  QR_CODE_STYLING_FIXTURES,
} from '@repo/core-testing';
import {describe, expect, test} from 'vitest';

import {qrcode} from '@qrcodesdk/core';

import {QRCodeCanvasRenderer, canvasCenterImage} from '../src';
import {
  ROUNDTRIP_COMBINATIONS_ONE,
  decodeCanvasMicroQRCode,
  decodeCanvasQRCode,
  decodeCanvasRMQRCode,
  fixtureImageCanvas,
} from './helper';

describe('QRCodeCanvasRenderer', () => {
  test.each(QR_CODE_CENTER_IMAGE_FIXTURES)(
    'decodes $name canvas center image fixture',
    async (fixture) => {
      await expect(
        decodeCanvasQRCode(
          qrcode(fixture.payload)
            .options(fixture.matrixOptions)
            .render(
              QRCodeCanvasRenderer({
                style: fixture.style,
                centerImage: canvasCenterImage(fixtureImageCanvas(fixture.image), fixture.layout),
              }),
            ),
        ),
      ).resolves.toBe(fixture.payload);
    },
  );

  const defaultRenderer = QRCodeCanvasRenderer({style: {moduleSize: 4, quietZone: 4}});

  test.each(QR_CODE_ROUNDTRIP_TEST_FIXTURES)('decodes $name canvas output', async (fixture) => {
    await expect(
      decodeCanvasQRCode(
        qrcode()
          .payload(fixture.payload)
          .options(fixtureMatrixOptions(fixture))
          .render(defaultRenderer),
      ),
    ).resolves.toBe(fixture.payload);
  });

  test.each(ROUNDTRIP_COMBINATIONS_ONE)(
    'decodes combination $name canvas output',
    async (fixture) => {
      await expect(
        decodeCanvasQRCode(
          qrcode(fixture.payload).options(fixtureMatrixOptions(fixture)).render(defaultRenderer),
        ),
      ).resolves.toBe(fixture.payload);
    },
  );

  test.each(QR_CODE_STYLING_FIXTURES)('decodes $name canvas styling fixture', async (fixture) => {
    await expect(
      decodeCanvasQRCode(
        qrcode(fixture.payload)
          .options(fixture.matrixOptions)
          .render(QRCodeCanvasRenderer({style: fixture.styling})),
      ),
    ).resolves.toBe(fixture.payload);
  });

  test.each(QR_CODE_STYLE_VARIANT_FIXTURES)(
    'decodes $name canvas style variant',
    async (fixture) => {
      await expect(
        decodeCanvasQRCode(
          qrcode(fixture.payload)
            .options(fixture.matrixOptions)
            .render(QRCodeCanvasRenderer({style: fixture.styling})),
        ),
      ).resolves.toBe(fixture.payload);
    },
  );

  // Micro QR and rMQR fixtures keep the default quiet zone of 2 modules.
  const smallSymbolRenderer = QRCodeCanvasRenderer({style: {moduleSize: 4}});

  test.each(QR_CODE_MICRO_TEST_FIXTURES)(
    'decodes $name canvas Micro QR output',
    async (fixture) => {
      await expect(
        decodeCanvasMicroQRCode(
          qrcode(fixture.payload)
            .options(fixtureMicroMatrixOptions(fixture))
            .render(smallSymbolRenderer),
        ),
      ).resolves.toMatchObject({text: fixture.payload, version: fixture.version});
    },
  );

  test.each(QR_CODE_MICRO_STYLE_VARIANT_FIXTURES)(
    'decodes $name canvas Micro QR style variant',
    async (fixture) => {
      await expect(
        decodeCanvasMicroQRCode(
          qrcode(fixture.payload)
            .options(fixture.matrixOptions)
            .render(QRCodeCanvasRenderer({style: fixture.styling})),
        ),
      ).resolves.toMatchObject({text: fixture.payload});
    },
  );

  test.each(QR_CODE_RMQR_TEST_FIXTURES)('decodes $name canvas rMQR output', async (fixture) => {
    await expect(
      decodeCanvasRMQRCode(
        qrcode(fixture.payload)
          .options(fixtureRMQRMatrixOptions(fixture))
          .render(smallSymbolRenderer),
      ),
    ).resolves.toMatchObject({text: fixture.payload, version: fixture.symbol});
  });

  test.each(QR_CODE_RMQR_STYLE_VARIANT_FIXTURES)(
    'decodes $name canvas rMQR style variant',
    async (fixture) => {
      await expect(
        decodeCanvasRMQRCode(
          qrcode(fixture.payload)
            .options(fixture.matrixOptions)
            .render(QRCodeCanvasRenderer({style: fixture.styling})),
        ),
      ).resolves.toMatchObject({text: fixture.payload, version: fixture.symbol});
    },
  );
});
