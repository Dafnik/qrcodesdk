import {describe, expect, test} from 'vitest';

import {createQRCodeStylePlan, parseQRCodeStylingOptions, qrcode} from '@qrcodesdk/core';
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

  test('renders square feature colors and finder holes without antialiasing', () => {
    const canvas = qrcode('square canvas').render(
      QRCodeCanvasRenderer({
        size: 4,
        margin: 0,
        dotsOptions: {color: '#112233', type: 'square'},
        cornersSquareOptions: {color: '#445566', type: 'square'},
        cornersDotOptions: {color: '#778899', type: 'square'},
      }),
    );

    expectPixel(canvas, 2, 2, {red: 68, green: 85, blue: 102, alpha: 255});
    expectPixel(canvas, 6, 6, WHITE);
    expectPixel(canvas, 14, 14, {red: 119, green: 136, blue: 153, alpha: 255});

    const pixels = getCanvasContext(canvas).getImageData(0, 0, canvas.width, canvas.height).data;
    const colors = new Set(['255,255,255,255', '17,34,51,255', '68,85,102,255', '119,136,153,255']);
    for (let index = 0; index < pixels.length; index += 4) {
      expect(colors.has([...pixels.slice(index, index + 4)].join(','))).toBe(true);
    }
  });

  test('renders independent feature colors with native antialiasing', () => {
    const matrix = qrcode('styled canvas').matrix();
    const options = {
      size: 8,
      margin: 4,
      dotsOptions: {color: '#112233' as const, type: 'dots' as const},
      cornersSquareOptions: {color: '#445566' as const, type: 'extra-rounded' as const},
      cornersDotOptions: {color: '#778899' as const, type: 'dot' as const},
    };
    const plan = createQRCodeStylePlan(matrix, parseQRCodeStylingOptions(options));
    const canvas = QRCodeCanvasRenderer(options)(matrix);
    const dataModule = plan.primitives.find(({role}) => role === 'dots')!;

    expectPixel(canvas, (dataModule.x + 0.5) * 8, (dataModule.y + 0.5) * 8, {
      red: 17,
      green: 34,
      blue: 51,
      alpha: 255,
    });
    expectPixel(canvas, 7 * 8 + 4, 4 * 8 + 4, {red: 68, green: 85, blue: 102, alpha: 255});
    expectPixel(canvas, 7 * 8 + 4, 7 * 8 + 4, {
      red: 119,
      green: 136,
      blue: 153,
      alpha: 255,
    });

    const pixels = getCanvasContext(canvas).getImageData(0, 0, canvas.width, canvas.height).data;
    const hasAntialiasedPixel = Array.from({length: canvas.width * canvas.height}, (_, index) => [
      pixels[index * 4],
      pixels[index * 4 + 1],
      pixels[index * 4 + 2],
      pixels[index * 4 + 3],
    ]).some(
      ([red, green, blue, alpha]) =>
        alpha === 255 &&
        red !== green &&
        green !== blue &&
        !(
          (red === 17 && green === 34 && blue === 51) ||
          (red === 68 && green === 85 && blue === 102) ||
          (red === 119 && green === 136 && blue === 153)
        ),
    );
    expect(hasAntialiasedPixel).toBe(true);
  });
});
