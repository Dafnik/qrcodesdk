import {matrixFromRows} from '@repo/core-testing';
import {describe, expect, test} from 'vitest';

import {QRCodeError, qrcode} from '@qrcodesdk/core';
import {circle, finder} from '@qrcodesdk/core/style';

import {QRCodeCanvasRenderer, canvasCenterImage} from '../src';
import {BLACK, WHITE, expectPixel} from './helper';

describe('QRCodeCanvasRenderer', () => {
  test('renders dimensions, colors, and transparent RGBA backgrounds', () => {
    const canvas = QRCodeCanvasRenderer({
      style: {
        moduleSize: 3,
        quietZone: 1,
        foreground: '#000000',
        background: '#ffffff80',
      },
    })(
      matrixFromRows([
        [1, 0],
        [0, 1],
      ]),
    );
    expect(canvas.width).toBe(12);
    expect(canvas.height).toBe(12);
    expectPixel(canvas, 0, 0, {red: 255, green: 255, blue: 255, alpha: 128});
    expectPixel(canvas, 3, 3, BLACK);
    expectPixel(canvas, 6, 3, {red: 255, green: 255, blue: 255, alpha: 128});
  });

  test('applies nested accessibility options', () => {
    const canvas = QRCodeCanvasRenderer({
      accessibility: {ariaLabel: 'Scan this', title: 'QR code'},
    })(matrixFromRows([[1]]));
    expect(canvas.getAttribute('role')).toBe('img');
    expect(canvas.getAttribute('aria-label')).toBe('Scan this');
    expect(canvas.title).toBe('QR code');
    expect(QRCodeCanvasRenderer()(matrixFromRows([[1]])).getAttribute('aria-hidden')).toBe('true');
  });

  test('renders imported shapes', () => {
    const canvas = QRCodeCanvasRenderer({
      style: {
        moduleSize: 8,
        quietZone: 0,
        modules: circle(),
      },
    })(matrixFromRows([[1]]));
    expectPixel(canvas, 0, 0, WHITE);
    expectPixel(canvas, 4, 4, BLACK);
  });

  test('renders finder parts in their own color', () => {
    const canvas = QRCodeCanvasRenderer({
      style: {moduleSize: 4, quietZone: 0, finder: finder({color: '#ff0000'})},
    })(qrcode('finder color').matrix());
    expectPixel(canvas, 1, 1, {red: 255, green: 0, blue: 0, alpha: 255});
    expectPixel(canvas, 9, 9, {red: 255, green: 0, blue: 0, alpha: 255});
  });

  test('validates options at construction', () => {
    expect(() => QRCodeCanvasRenderer({style: {moduleSize: 0}})).toThrow(QRCodeError);
    expect(() => QRCodeCanvasRenderer({size: 2} as never)).toThrow(
      expect.objectContaining({details: expect.objectContaining({field: 'options.size'})}),
    );
    expect(() => QRCodeCanvasRenderer({accessibility: {ariaLabel: 1 as never}})).toThrow(
      expect.objectContaining({
        details: expect.objectContaining({field: 'accessibility.ariaLabel'}),
      }),
    );
    expect(() => QRCodeCanvasRenderer({accessibility: null} as never)).toThrow(
      expect.objectContaining({details: expect.objectContaining({field: 'accessibility'})}),
    );
    expect(() => QRCodeCanvasRenderer({centerImage: []} as never)).toThrow(
      expect.objectContaining({details: expect.objectContaining({field: 'centerImage'})}),
    );
  });

  test('rejects center images not created with canvasCenterImage()', () => {
    expect(() => QRCodeCanvasRenderer({centerImage: {source: new Image()} as never})).toThrow(
      expect.objectContaining({details: expect.objectContaining({field: 'centerImage'})}),
    );
  });

  test('draws center images over cleared modules', () => {
    const logo = document.createElement('canvas');
    logo.width = logo.height = 4;
    const logoContext = logo.getContext('2d')!;
    logoContext.fillStyle = '#ff0000';
    logoContext.fillRect(0, 0, 4, 4);
    const canvas = QRCodeCanvasRenderer({
      style: {moduleSize: 4, quietZone: 0},
      centerImage: canvasCenterImage(logo, {size: 0.2, padding: 1}),
    })(qrcode('canvas center image').errorCorrection('H').matrix());

    const moduleCount = canvas.width / 4;
    const center = canvas.width / 2;
    // The first module inside the padding, left of the image.
    const padding = Math.floor((moduleCount * 0.8) / 2 - 1) * 4 + 2;
    expectPixel(canvas, center, center, {red: 255, green: 0, blue: 0, alpha: 255});
    expectPixel(canvas, padding, center, WHITE);
  });

  test('reports a missing unchecked center image source through QRCodeError', () => {
    const render = QRCodeCanvasRenderer({centerImage: canvasCenterImage(undefined as never)});

    expect(() => render(matrixFromRows([[1]]))).toThrow(
      expect.objectContaining({code: 'INVALID_IMAGE_SOURCE'}),
    );
  });
});
