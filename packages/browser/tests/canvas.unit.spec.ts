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

  test('draws on a software-backed context so output does not depend on the GPU', () => {
    const canvas = QRCodeCanvasRenderer()(matrixFromRows([[1]]));
    expect(canvas.getContext('2d')?.getContextAttributes().willReadFrequently).toBe(true);
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

  test('validates module size at construction', () => {
    expect(() => QRCodeCanvasRenderer({style: {moduleSize: 0}})).toThrow(QRCodeError);
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

  test('rejects center image sources that are not ready when rendering', async () => {
    const render = (source: CanvasImageSource) =>
      QRCodeCanvasRenderer({centerImage: canvasCenterImage(source)})(matrixFromRows([[1]]));
    const invalidSource = expect.objectContaining({
      name: 'QRCodeError',
      code: 'INVALID_IMAGE_SOURCE',
    });

    const pending = new Image();
    pending.src = 'data:image/png;base64,iVBORw0KGgo=';
    if (!pending.complete) expect(() => render(pending)).toThrowError(invalidSource);

    const empty = document.createElement('canvas');
    empty.width = empty.height = 0;
    expect(() => render(empty)).toThrowError(invalidSource);

    const source = document.createElement('canvas');
    source.width = source.height = 2;
    const bitmap = await createImageBitmap(source);
    bitmap.close();
    expect(() => render(bitmap)).toThrowError(invalidSource);
  });

  test('rejects a loaded image without intrinsic dimensions', () => {
    // An image without a source is complete but has no natural size.
    expect(() =>
      QRCodeCanvasRenderer({centerImage: canvasCenterImage(new Image())})(matrixFromRows([[1]])),
    ).toThrowError(expect.objectContaining({code: 'INVALID_IMAGE_SOURCE'}));
  });
});
