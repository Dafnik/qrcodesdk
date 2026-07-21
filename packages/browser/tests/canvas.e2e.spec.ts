import {QR_CODE_TEST_FIXTURES} from '@repo/core-testing';
import {describe, expect, test} from 'vitest';

import {qrcode} from '@qrcodesdk/core';

import {QRCodeCanvasRenderer} from '../src';
import {JSQR_ROUNDTRIP_COMBINATIONS_ONE, decodeCanvasQRCode} from './helper';

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

  test.each(JSQR_ROUNDTRIP_COMBINATIONS_ONE)('decodes $name image output', async (fixture) => {
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
