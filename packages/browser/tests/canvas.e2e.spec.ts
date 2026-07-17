import {QR_CODE_TEST_FIXTURES, getAllQRCodeCombinations} from '@repo/core-testing';
import {describe, expect, test} from 'vitest';

import {qrcode} from '@qrcodesdk/core';

import {QRCodeCanvasRenderer} from '../src';
import {decodeCanvasQRCode} from './helper';

/**
 * Version 23 QR codes always fail to decode
 * https://github.com/cozmo/jsQR/issues/251
 */
const JSQR_ROUNDTRIP_COMBINATIONS = [...getAllQRCodeCombinations()].filter(
  ({version, errorCorrectionLevel}) => version !== 23 || errorCorrectionLevel !== 'L',
);

describe('QRCodeCanvasRenderer', () => {
  test.each(QR_CODE_TEST_FIXTURES)('decodes $name canvas output', (fixture) => {
    expect(
      decodeCanvasQRCode(
        qrcode()
          .data(fixture.data)
          .config(fixture)
          .render(QRCodeCanvasRenderer({size: 8, margin: 4})),
      ),
    ).toBe(fixture.data);
  });

  test.each(JSQR_ROUNDTRIP_COMBINATIONS)('decodes $name image output', async (fixture) => {
    expect(
      decodeCanvasQRCode(
        qrcode(fixture.data)
          .config(fixture)
          .render(QRCodeCanvasRenderer({size: 8, margin: 4})),
      ),
    ).toBe(fixture.data);
  });

  test('decodes custom high-contrast color canvas output', () => {
    const fixture = QR_CODE_TEST_FIXTURES[1];
    const canvas = qrcode()
      .data(fixture.data)
      .config(fixture)
      .render(
        QRCodeCanvasRenderer({
          size: 8,
          margin: 4,
          colors: {
            colorLight: '#fefefe',
            colorDark: '#101010',
          },
        }),
      );

    expect(decodeCanvasQRCode(canvas)).toBe(fixture.data);
  });
});
