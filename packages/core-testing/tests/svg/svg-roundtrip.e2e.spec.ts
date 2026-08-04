import sharp from 'sharp';
import {describe, expect, test} from 'vitest';

import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

import {QR_CODE_STYLING_FIXTURES, QR_CODE_TEST_FIXTURES, getAllQRCodeCombinations} from '../../src';
import {decodeSvgQRCode} from './svg-helpers';

/**
 * Version 23 QR codes always fail to decode
 * https://github.com/cozmo/jsQR/issues/251
 */
const JSQR_ROUNDTRIP_COMBINATIONS = [...getAllQRCodeCombinations()].filter(
  ({version, errorCorrectionLevel}) => version !== 23 || errorCorrectionLevel !== 'L',
);

describe('SVG QR roundtrips', () => {
  test('decodes SVG output with a small prepared image overlay', async () => {
    const logo = await sharp({
      create: {
        width: 4,
        height: 4,
        channels: 4,
        background: {r: 220, g: 38, b: 38, alpha: 1},
      },
    })
      .png()
      .toBuffer();
    const source = `data:image/png;base64,${logo.toString('base64')}` as const;

    await expect(
      decodeSvgQRCode(
        qrcode('prepared SVG image')
          .errorCorrection('H')
          .render(
            QRCodeSVGRenderer({
              size: 4,
              margin: 4,
              image: {source, size: 0.16, padding: 0.25},
            }),
          ),
      ),
    ).resolves.toBe('prepared SVG image');
  });

  const testSVGRenderer = QRCodeSVGRenderer({size: 4, margin: 4});

  test.each(['ABCDE12345678?A1A', 'ABé12345678901234567890', 'AB✅🚀12345678901234567890'])(
    'decodes automatic mixed-mode SVG output for %s',
    async (data) => {
      await expect(decodeSvgQRCode(qrcode(data).render(testSVGRenderer))).resolves.toBe(data);
    },
  );

  test.each(QR_CODE_TEST_FIXTURES)('decodes $name SVG output', async (fixture) => {
    await expect(
      decodeSvgQRCode(qrcode(fixture.data).config(fixture).render(testSVGRenderer)),
    ).resolves.toBe(fixture.data);
  });

  test.each(JSQR_ROUNDTRIP_COMBINATIONS)('decodes $name SVG output', async (fixture) => {
    await expect(
      decodeSvgQRCode(qrcode(fixture.data).config(fixture).render(testSVGRenderer)),
    ).resolves.toBe(fixture.data);
  });

  test.each(QR_CODE_STYLING_FIXTURES)('decodes $name SVG styling fixture', async (fixture) => {
    await expect(
      decodeSvgQRCode(
        qrcode(fixture.data)
          .config(fixture.matrixOptions)
          .render(QRCodeSVGRenderer(fixture.styling)),
      ),
    ).resolves.toBe(fixture.data);
  });
});
