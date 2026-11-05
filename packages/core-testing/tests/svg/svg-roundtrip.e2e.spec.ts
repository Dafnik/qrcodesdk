import {describe, expect, test} from 'vitest';

import {QRCodeSVGRenderer, qrcode, svgCenterImage} from '@qrcodesdk/core';
import {automaticSegmenter} from '@qrcodesdk/core/segmenter';

import {fixtureImageDataURL, fixtureMatrixOptions} from '../../src';
import {
  QR_CODE_CENTER_IMAGE_FIXTURES,
  QR_CODE_STYLE_VARIANT_FIXTURES,
  QR_CODE_STYLING_ROUNDTRIP_FIXTURES,
  QR_CODE_TEST_FIXTURES,
  getAllQRCodeCombinations,
} from '../../src';
import {decodeSvgQRCode} from './svg-helpers';

/**
 * Version 23 QR codes always fail to decode
 * https://github.com/cozmo/jsQR/issues/251
 */
const JSQR_ROUNDTRIP_COMBINATIONS = [...getAllQRCodeCombinations()].filter(
  ({version, errorCorrectionLevel}) => version !== 23 || errorCorrectionLevel !== 'L',
);
describe('SVG QR roundtrips', () => {
  test.each(QR_CODE_CENTER_IMAGE_FIXTURES)(
    'decodes $name SVG center image fixture',
    async (fixture) => {
      await expect(
        decodeSvgQRCode(
          qrcode(fixture.payload)
            .options(fixture.matrixOptions)
            .render(
              QRCodeSVGRenderer({
                style: fixture.style,
                centerImage: svgCenterImage(fixtureImageDataURL(fixture.image), fixture.layout),
              }),
            ),
        ),
      ).resolves.toBe(fixture.payload);
    },
  );

  const testSVGRenderer = QRCodeSVGRenderer({style: {moduleSize: 4, quietZone: 4}});

  test.each(
    ['ABCDE12345678?A1A', 'ABé12345678901234567890', 'AB✅🚀12345678901234567890', '00123'].flatMap(
      (payload) =>
        [false, true].flatMap((optimized) =>
          [false, true].map((eci) => ({payload, optimized, eci})),
        ),
    ),
  )(
    'decodes auto SVG output for $payload, optimized $optimized, ECI $eci',
    async ({payload, optimized, eci}) => {
      await expect(
        decodeSvgQRCode(
          qrcode(payload)
            .mode('auto')
            .eci(eci)
            .segmenter(optimized ? automaticSegmenter : undefined)
            .render(testSVGRenderer),
        ),
      ).resolves.toBe(payload);
    },
  );

  test.each(
    ['Grüße aus Wien', '東京 ✅🚀'].flatMap((payload) => [
      {payload, eci: false},
      {payload, eci: true},
    ]),
  )('decodes forced UTF-8 octet SVG output for $payload with ECI $eci', async ({payload, eci}) => {
    await expect(
      decodeSvgQRCode(qrcode(payload).mode('octet').eci(eci).render(testSVGRenderer)),
    ).resolves.toBe(payload);
  });

  test.each(QR_CODE_TEST_FIXTURES)('decodes $name SVG output', async (fixture) => {
    await expect(
      decodeSvgQRCode(
        qrcode(fixture.payload).options(fixtureMatrixOptions(fixture)).render(testSVGRenderer),
      ),
    ).resolves.toBe(fixture.payload);
  });

  test.each(JSQR_ROUNDTRIP_COMBINATIONS)('decodes $name SVG output', async (fixture) => {
    await expect(
      decodeSvgQRCode(
        qrcode(fixture.payload).options(fixtureMatrixOptions(fixture)).render(testSVGRenderer),
      ),
    ).resolves.toBe(fixture.payload);
  });

  test.each(QR_CODE_STYLING_ROUNDTRIP_FIXTURES)(
    'decodes $name SVG styling fixture',
    async (fixture) => {
      await expect(
        decodeSvgQRCode(
          qrcode(fixture.payload)
            .options(fixture.matrixOptions)
            .render(QRCodeSVGRenderer({style: fixture.styling})),
        ),
      ).resolves.toBe(fixture.payload);
    },
  );

  test.each(QR_CODE_STYLE_VARIANT_FIXTURES)('decodes $name SVG style variant', async (fixture) => {
    await expect(
      decodeSvgQRCode(
        qrcode(fixture.payload)
          .options(fixture.matrixOptions)
          .render(QRCodeSVGRenderer({style: fixture.styling})),
      ),
    ).resolves.toBe(fixture.payload);
  });
});
