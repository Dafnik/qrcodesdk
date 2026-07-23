import {PNG} from 'pngjs';
import {describe, expect, test} from 'vitest';

import {createQRCodeStylePlan, parseQRCodeStylingOptions, qrcode} from '@qrcodesdk/core';
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

  test('renders square feature colors and finder holes without partial coverage', () => {
    const png = readPng(
      qrcode('square png').render(
        QRCodePNGRenderer({
          size: 4,
          margin: 0,
          dotsOptions: {color: '#112233', type: 'square'},
          cornersSquareOptions: {color: '#445566', type: 'square'},
          cornersDotOptions: {color: '#778899', type: 'square'},
        }),
      ),
    );

    expectPixel(png, 2, 2, {red: 68, green: 85, blue: 102, alpha: 255});
    expectPixel(png, 6, 6, {red: 255, green: 255, blue: 255, alpha: 255});
    expectPixel(png, 14, 14, {red: 119, green: 136, blue: 153, alpha: 255});

    const colors = new Set(['255,255,255,255', '17,34,51,255', '68,85,102,255', '119,136,153,255']);
    for (let index = 0; index < png.data.length; index += 4) {
      expect(colors.has([...png.data.subarray(index, index + 4)].join(','))).toBe(true);
    }
  });

  test('renders independent module and finder colors with opaque antialiased curves', () => {
    const matrix = qrcode('styled png').matrix();
    const options = {
      size: 8,
      margin: 4,
      colors: {colorLight: '#ffffff' as const, colorDark: '#000000' as const},
      dotsOptions: {color: '#112233' as const, type: 'dots' as const},
      cornersSquareOptions: {color: '#445566' as const, type: 'extra-rounded' as const},
      cornersDotOptions: {color: '#778899' as const, type: 'dot' as const},
    };
    const plan = createQRCodeStylePlan(matrix, parseQRCodeStylingOptions(options));
    const png = readPng(QRCodePNGRenderer(options)(matrix));
    const dataModule = plan.primitives.find(({role}) => role === 'dots')!;

    expectPixel(png, (dataModule.x + 0.5) * 8, (dataModule.y + 0.5) * 8, {
      red: 17,
      green: 34,
      blue: 51,
      alpha: 255,
    });
    expectPixel(png, 7 * 8 + 4, 4 * 8 + 4, {red: 68, green: 85, blue: 102, alpha: 255});
    expectPixel(png, 7 * 8 + 4, 7 * 8 + 4, {
      red: 119,
      green: 136,
      blue: 153,
      alpha: 255,
    });

    const antialiasedPixel = Array.from({length: png.width * png.height}, (_, index) => ({
      red: png.data[index * 4],
      green: png.data[index * 4 + 1],
      blue: png.data[index * 4 + 2],
      alpha: png.data[index * 4 + 3],
    })).find(
      ({red, green, blue}) =>
        red !== green &&
        green !== blue &&
        !(
          (red === 17 && green === 34 && blue === 51) ||
          (red === 68 && green === 85 && blue === 102) ||
          (red === 119 && green === 136 && blue === 153)
        ),
    );
    expect(antialiasedPixel?.alpha).toBe(255);
  });
});
