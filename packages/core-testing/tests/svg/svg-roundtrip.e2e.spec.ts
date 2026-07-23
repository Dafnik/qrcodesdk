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
  test.each(QR_CODE_TEST_FIXTURES)('decodes $name SVG output', async (fixture) => {
    await expect(
      decodeSvgQRCode(
        qrcode(fixture.data)
          .config(fixture)
          .render(QRCodeSVGRenderer({size: 8, margin: 4})),
      ),
    ).resolves.toBe(fixture.data);
  });

  test.each(JSQR_ROUNDTRIP_COMBINATIONS)('decodes $name SVG output', async (fixture) => {
    await expect(
      decodeSvgQRCode(
        qrcode(fixture.data)
          .config(fixture)
          .render(QRCodeSVGRenderer({size: 8, margin: 4})),
      ),
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
