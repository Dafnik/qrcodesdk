import {fixtureMatrixOptions, fixtureMicroMatrixOptions} from '@repo/core-testing';
import {
  QR_CODE_CENTER_IMAGE_FIXTURES,
  QR_CODE_MICRO_STYLE_VARIANT_FIXTURES,
  QR_CODE_MICRO_TEST_FIXTURES,
  QR_CODE_STYLE_VARIANT_FIXTURES,
  QR_CODE_STYLING_ROUNDTRIP_FIXTURES,
  QR_CODE_TEST_FIXTURES,
} from '@repo/core-testing';
import {describe, expect, test} from 'vitest';

import {qrcode} from '@qrcodesdk/core';

import {QRCodeCanvasRenderer, canvasCenterImage} from '../src';
import {JSQR_ROUNDTRIP_COMBINATIONS_ONE, decodeCanvasQRCode, fixtureImageCanvas} from './helper';
import {decodeCanvasMicroQRCode} from './micro-decoder';

describe('QRCodeCanvasRenderer', () => {
  test.each(QR_CODE_CENTER_IMAGE_FIXTURES)(
    'decodes $name canvas center image fixture',
    (fixture) => {
      expect(
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
      ).toBe(fixture.payload);
    },
  );

  const defaultRenderer = QRCodeCanvasRenderer({style: {moduleSize: 4, quietZone: 4}});

  test.each(QR_CODE_TEST_FIXTURES)('decodes $name canvas output', (fixture) => {
    expect(
      decodeCanvasQRCode(
        qrcode()
          .payload(fixture.payload)
          .options(fixtureMatrixOptions(fixture))
          .render(defaultRenderer),
      ),
    ).toBe(fixture.payload);
  });

  test.each(JSQR_ROUNDTRIP_COMBINATIONS_ONE)('decodes $name image output', async (fixture) => {
    expect(
      decodeCanvasQRCode(
        qrcode(fixture.payload).options(fixtureMatrixOptions(fixture)).render(defaultRenderer),
      ),
    ).toBe(fixture.payload);
  });

  test.each(QR_CODE_STYLING_ROUNDTRIP_FIXTURES)(
    'decodes $name canvas styling fixture',
    (fixture) => {
      expect(
        decodeCanvasQRCode(
          qrcode(fixture.payload)
            .options(fixture.matrixOptions)
            .render(QRCodeCanvasRenderer({style: fixture.styling})),
        ),
      ).toBe(fixture.payload);
    },
  );

  test.each(QR_CODE_STYLE_VARIANT_FIXTURES)('decodes $name canvas style variant', (fixture) => {
    expect(
      decodeCanvasQRCode(
        qrcode(fixture.payload)
          .options(fixture.matrixOptions)
          .render(QRCodeCanvasRenderer({style: fixture.styling})),
      ),
    ).toBe(fixture.payload);
  });

  // Micro QR fixtures keep the default quiet zone of 2 modules.
  const microRenderer = QRCodeCanvasRenderer({style: {moduleSize: 4}});

  test.each(QR_CODE_MICRO_TEST_FIXTURES)(
    'decodes $name canvas Micro QR output',
    async (fixture) => {
      await expect(
        decodeCanvasMicroQRCode(
          qrcode(fixture.payload).options(fixtureMicroMatrixOptions(fixture)).render(microRenderer),
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
});
