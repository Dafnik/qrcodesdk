import {QR_CODE_STYLING_FIXTURES, QR_CODE_TEST_FIXTURES} from '@repo/core-testing';
import {describe, expect, test} from 'vitest';

import {qrcode} from '@qrcodesdk/core';

import {QRCodeCanvasRenderer} from '../src';
import {JSQR_ROUNDTRIP_COMBINATIONS_ONE, decodeCanvasQRCode} from './helper';

describe('QRCodeCanvasRenderer', () => {
  test('decodes output with a small prepared image overlay', () => {
    const logo = document.createElement('canvas');
    logo.width = 8;
    logo.height = 4;
    const context = logo.getContext('2d')!;
    context.fillStyle = '#dc2626';
    context.fillRect(0, 0, logo.width, logo.height);

    expect(
      decodeCanvasQRCode(
        qrcode('prepared browser image')
          .errorCorrection('H')
          .render(
            QRCodeCanvasRenderer({
              size: 8,
              margin: 4,
              image: {source: logo, size: 0.16, padding: 0.25},
            }),
          ),
      ),
    ).toBe('prepared browser image');
  });

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

  test.each(QR_CODE_STYLING_FIXTURES)('decodes $name canvas styling fixture', (fixture) => {
    expect(
      decodeCanvasQRCode(
        qrcode(fixture.data)
          .config(fixture.matrixOptions)
          .render(QRCodeCanvasRenderer(fixture.styling)),
      ),
    ).toBe(fixture.data);
  });
});
