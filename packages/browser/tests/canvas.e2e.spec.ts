import {type QRCodeTestFixture, QR_CODE_TEST_FIXTURES, renderFixture} from '@repo/core-testing';
import {describe, expect, test} from 'vitest';

import {QRCodeCanvasRenderer, type QRCodeCanvasRendererOptions} from '../src';
import {decodeCanvasQRCode} from './helper';

function renderFixtureCanvas(
  fixture: QRCodeTestFixture,
  options: QRCodeCanvasRendererOptions = {size: 8, margin: 4},
): HTMLCanvasElement {
  return renderFixture(fixture, QRCodeCanvasRenderer(options));
}

describe('QRCodeCanvasRenderer', () => {
  test.each(QR_CODE_TEST_FIXTURES)('decodes $name canvas output', (fixture) => {
    expect(decodeCanvasQRCode(renderFixtureCanvas(fixture))).toBe(fixture.data);
  });

  test('decodes custom high-contrast color canvas output', () => {
    const canvas = renderFixtureCanvas(QR_CODE_TEST_FIXTURES[1], {
      size: 8,
      margin: 4,
      colors: {
        colorLight: '#fefefe',
        colorDark: '#101010',
      },
    });

    expect(decodeCanvasQRCode(canvas)).toBe(QR_CODE_TEST_FIXTURES[1].data);
  });
});
