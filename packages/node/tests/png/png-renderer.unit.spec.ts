import {PNG} from 'pngjs';
import {describe, expect, test} from 'vitest';

import type {QRCodeMatrix} from '@qrcodesdk/core';

import {QRCodePNGRenderer} from '../../src';
import {getPngPixel} from './png-helpers';

function readPng(buffer: Buffer): PNG {
  return PNG.sync.read(buffer);
}

function expectPixel(png: PNG, x: number, y: number, rgba: ReturnType<typeof getPngPixel>): void {
  expect(getPngPixel(png, x, y)).toEqual(rgba);
}

describe('QRCodePNGRenderer', () => {
  test('renders default PNG geometry from a hand-authored matrix', () => {
    const matrix: QRCodeMatrix = [
      [1, 0],
      [0, 1],
    ];
    const png = readPng(QRCodePNGRenderer()(matrix));

    expect(png.width).toBe(50);
    expect(png.height).toBe(50);
    expectPixel(png, 0, 0, {red: 255, green: 255, blue: 255, alpha: 255});
    expectPixel(png, 20, 20, {red: 0, green: 0, blue: 0, alpha: 255});
    expectPixel(png, 24, 24, {red: 0, green: 0, blue: 0, alpha: 255});
    expectPixel(png, 25, 20, {red: 255, green: 255, blue: 255, alpha: 255});
    expectPixel(png, 25, 25, {red: 0, green: 0, blue: 0, alpha: 255});
  });

  test('renders custom sizing, margin, and colors', () => {
    const matrix: QRCodeMatrix = [
      [0, 1, 0],
      [1, 0, 1],
      [0, 0, 0],
    ];
    const png = readPng(
      QRCodePNGRenderer({
        size: 3,
        margin: 1,
        colors: {
          colorLight: '#eeeeee',
          colorDark: '#111111',
        },
      })(matrix),
    );

    expect(png.width).toBe(15);
    expect(png.height).toBe(15);
    expectPixel(png, 0, 0, {red: 238, green: 238, blue: 238, alpha: 255});
    expectPixel(png, 6, 3, {red: 17, green: 17, blue: 17, alpha: 255});
    expectPixel(png, 3, 6, {red: 17, green: 17, blue: 17, alpha: 255});
    expectPixel(png, 9, 6, {red: 17, green: 17, blue: 17, alpha: 255});
    expectPixel(png, 6, 6, {red: 238, green: 238, blue: 238, alpha: 255});
  });

  test('renders only background pixels when the matrix has no dark modules', () => {
    const png = readPng(
      QRCodePNGRenderer({size: 2, margin: 0})([
        [0, 0],
        [0, 0],
      ]),
    );

    expect(png.width).toBe(4);
    expect(png.height).toBe(4);
    expect(Array.from(png.data)).toEqual(new Array<number>(4 * 4 * 4).fill(255));
  });

  test('rejects PNG dimensions that cannot map cleanly to pixels', () => {
    expect(() => QRCodePNGRenderer({size: 1.5})([[1]])).toThrow(
      'QR code size must be a positive integer',
    );
    expect(() => QRCodePNGRenderer({margin: -1})([[1]])).toThrow(
      'QR code margin must be a non-negative integer',
    );
    expect(() => QRCodePNGRenderer({colors: {colorDark: '#xyz'}})([[1]])).toThrow(
      'QR code colorDark must be a 6-digit hex color',
    );
  });
});
