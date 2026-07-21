import {describe, expect, test} from 'vitest';

import type {QRCodeMatrix} from '@qrcodesdk/core';

import {QRCodeCanvasRenderer} from '../src';
import {BLACK, WHITE, expectPixel, getCanvasContext} from './helper';

describe('QRCodeCanvasRenderer', () => {
  test('renders default canvas geometry and pixels from a hand-authored matrix', () => {
    const matrix: QRCodeMatrix = [
      [1, 0],
      [0, 1],
    ];
    const canvas = QRCodeCanvasRenderer()(matrix);

    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(canvas.width).toBe(50);
    expect(canvas.height).toBe(50);
    expectPixel(canvas, 0, 0, WHITE);
    expectPixel(canvas, 20, 20, BLACK);
    expectPixel(canvas, 24, 24, BLACK);
    expectPixel(canvas, 25, 20, WHITE);
    expectPixel(canvas, 25, 25, BLACK);
  });

  test('renders custom sizing, margin, and colors', () => {
    const matrix: QRCodeMatrix = [
      [0, 1, 0],
      [1, 0, 1],
      [0, 0, 0],
    ];
    const canvas = QRCodeCanvasRenderer({
      size: 3,
      margin: 1,
      colors: {
        colorLight: '#eeeeee',
        colorDark: '#111111',
      },
    })(matrix);

    expect(canvas.width).toBe(15);
    expect(canvas.height).toBe(15);
    expectPixel(canvas, 0, 0, {red: 238, green: 238, blue: 238, alpha: 255});
    expectPixel(canvas, 6, 3, {red: 17, green: 17, blue: 17, alpha: 255});
    expectPixel(canvas, 3, 6, {red: 17, green: 17, blue: 17, alpha: 255});
    expectPixel(canvas, 9, 6, {red: 17, green: 17, blue: 17, alpha: 255});
    expectPixel(canvas, 6, 6, {red: 238, green: 238, blue: 238, alpha: 255});
  });

  test('renders only background pixels when the matrix has no dark modules', () => {
    const canvas = QRCodeCanvasRenderer({size: 2, margin: 0})([
      [0, 0],
      [0, 0],
    ]);

    expect(canvas.width).toBe(4);
    expect(canvas.height).toBe(4);
    expect(Array.from(getCanvasContext(canvas).getImageData(0, 0, 4, 4).data)).toEqual(
      new Array<number>(4 * 4 * 4).fill(255),
    );
  });

  test('rejects canvas dimensions that cannot map cleanly to pixels', () => {
    expect(() => QRCodeCanvasRenderer({size: 1.5})([[1]])).toThrow(
      'QR code size must be a positive integer',
    );
    expect(() => QRCodeCanvasRenderer({margin: -1})([[1]])).toThrow(
      'QR code margin must be a non-negative integer',
    );
    expect(() => QRCodeCanvasRenderer({colors: {colorLight: '#fff'}})([[1]])).toThrow(
      'QR code colorLight must be a 6-digit hex color',
    );
  });

  test('accepts canvas dimensions that are valid', () => {
    expect(() => QRCodeCanvasRenderer({margin: 0})([[1]])).not.toThrow();
    expect(() => QRCodeCanvasRenderer({size: 1})([[1]])).not.toThrow();
  });
});
