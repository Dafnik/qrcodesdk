import {describe, expect, test} from 'vitest';

import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

import {QR_CODE_TEST_FIXTURES, getAllQRCodeCombinations} from '../../src';
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

  test('decodes custom high-contrast color SVG output', async () => {
    const fixture = QR_CODE_TEST_FIXTURES[1];
    const svg = qrcode(fixture.data)
      .config(fixture)
      .render(
        QRCodeSVGRenderer({
          size: 8,
          margin: 4,
          colors: {
            colorLight: '#fefefe',
            colorDark: '#101010',
          },
        }),
      );

    await expect(decodeSvgQRCode(svg)).resolves.toBe(QR_CODE_TEST_FIXTURES[1].data);
  });
});
