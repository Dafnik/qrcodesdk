import {describe, expect, test} from 'vitest';

import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';
import type {QRCodeCornerDotType, QRCodeCornerSquareType, QRCodeDotType} from '@qrcodesdk/core';

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

  test.each([
    'rounded',
    'dots',
    'classy',
    'classy-rounded',
    'square',
    'extra-rounded',
  ] satisfies QRCodeDotType[])('decodes %s data module styling', async (type) => {
    await expect(
      decodeSvgQRCode(
        qrcode('styled dots').render(QRCodeSVGRenderer({size: 12, dotsOptions: {type}})),
      ),
    ).resolves.toBe('styled dots');
  });

  test.each([
    'dot',
    'square',
    'extra-rounded',
    'rounded',
    'dots',
    'classy',
    'classy-rounded',
  ] satisfies QRCodeCornerSquareType[])('decodes %s finder ring styling', async (type) => {
    await expect(
      decodeSvgQRCode(
        qrcode('styled finder ring').render(
          QRCodeSVGRenderer({size: 12, cornersSquareOptions: {type}}),
        ),
      ),
    ).resolves.toBe('styled finder ring');
  });

  test.each([
    'dot',
    'square',
    'rounded',
    'classy',
    'classy-rounded',
    'extra-rounded',
  ] satisfies QRCodeCornerDotType[])('decodes %s finder center styling', async (type) => {
    await expect(
      decodeSvgQRCode(
        qrcode('styled finder center').render(
          QRCodeSVGRenderer({size: 12, cornersDotOptions: {type}}),
        ),
      ),
    ).resolves.toBe('styled finder center');
  });

  test('decodes mixed styles and independent feature colors', async () => {
    await expect(
      decodeSvgQRCode(
        qrcode('mixed styled svg').render(
          QRCodeSVGRenderer({
            size: 12,
            dotsOptions: {color: '#112233', type: 'classy-rounded'},
            cornersSquareOptions: {color: '#445566', type: 'extra-rounded'},
            cornersDotOptions: {color: '#778899', type: 'dot'},
          }),
        ),
      ),
    ).resolves.toBe('mixed styled svg');
  });
});
