import {describe, expect, test} from 'vitest';

import {qrcode, ɵcreateQRCodeStylePlan, ɵparseQRCodeStylingOptions} from '@qrcodesdk/core';
import type {QRCodeMatrix} from '@qrcodesdk/core';

import {QRCodeCanvasRenderer} from '../src';
import {BLACK, WHITE, expectPixel, getCanvasContext} from './helper';

describe('QRCodeCanvasRenderer', () => {
  function createPreparedImage(width: number, height: number, color: string): HTMLCanvasElement {
    const image = document.createElement('canvas');
    image.width = width;
    image.height = height;
    const context = getCanvasContext(image);
    context.fillStyle = color;
    context.fillRect(0, 0, width, height);
    return image;
  }

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

  test('adds image semantics when the accessible label is non-empty', () => {
    const canvas = QRCodeCanvasRenderer({ariaLabel: 'Scan to open qrcodesdk.dev'})([[1]]);

    expect(canvas.getAttribute('role')).toBe('img');
    expect(canvas.getAttribute('aria-label')).toBe('Scan to open qrcodesdk.dev');
  });

  test.each([undefined, '', ' \t\n '])(
    'leaves the canvas unlabelled when ariaLabel is %j',
    (ariaLabel) => {
      const canvas = QRCodeCanvasRenderer({ariaLabel})([[1]]);

      expect(canvas.hasAttribute('role')).toBe(false);
      expect(canvas.hasAttribute('aria-label')).toBe(false);
      expect(canvas.getAttribute('aria-hidden')).toBe('true');
    },
  );

  test('uses title as the canvas accessible name', () => {
    const canvas = QRCodeCanvasRenderer({title: 'Scan this code'})([[1]]);

    expect(canvas.getAttribute('role')).toBe('img');
    expect(canvas.getAttribute('aria-label')).toBe('Scan this code');
    expect(canvas.title).toBe('Scan this code');
    expect(canvas.hasAttribute('aria-hidden')).toBe(false);
  });

  test('snapshots styling, image, and accessibility options on first use', () => {
    const firstSource = createPreparedImage(1, 1, '#ff0000');
    const options = {
      size: 2,
      margin: 0,
      colors: {colorDark: '#112233' as '#112233' | '#445566'},
      image: {source: firstSource as CanvasImageSource, size: 0.2},
      ariaLabel: 'First label',
      title: 'First title',
    };
    const renderer = QRCodeCanvasRenderer(options);
    const first = renderer([[1]]);

    options.size = 4;
    options.margin = 2;
    options.colors.colorDark = '#445566';
    options.image.source = createPreparedImage(1, 1, '#00ff00');
    options.image.size = 0.8;
    options.ariaLabel = 'Second label';
    options.title = 'Second title';
    const second = renderer([[1]]);

    expect(second.width).toBe(first.width);
    expect(second.getAttribute('aria-label')).toBe('First label');
    expect(second.title).toBe('First title');
    expect(second.toDataURL()).toBe(first.toDataURL());
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

  test('centers and contains a prepared image without changing its aspect ratio', () => {
    const canvas = QRCodeCanvasRenderer({
      size: 10,
      margin: 0,
      image: {
        source: createPreparedImage(4, 2, '#ff0000'),
        size: 0.5,
        padding: 0,
      },
    })([
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
    ]);

    expectPixel(canvas, 10, 10, WHITE);
    expectPixel(canvas, 20, 14, WHITE);
    expectPixel(canvas, 10, 15, {red: 255, green: 0, blue: 0, alpha: 255});
    expectPixel(canvas, 29, 24, {red: 255, green: 0, blue: 0, alpha: 255});
    expectPixel(canvas, 20, 25, WHITE);
  });

  test('preserves modules under transparent pixels when clearing is disabled', () => {
    const transparentImage = createPreparedImage(1, 1, 'rgba(255, 0, 0, 0)');
    const matrix: QRCodeMatrix = [
      [1, 1],
      [1, 1],
    ];
    const withoutClearing = QRCodeCanvasRenderer({
      size: 10,
      margin: 0,
      image: {source: transparentImage, size: 1, clearBackground: false},
    })(matrix);
    const withClearing = QRCodeCanvasRenderer({
      size: 10,
      margin: 0,
      image: {source: transparentImage, size: 1},
    })(matrix);

    expectPixel(withoutClearing, 10, 10, BLACK);
    expectPixel(withClearing, 10, 10, WHITE);
  });

  test('rejects browser image sources that are not prepared', () => {
    const unloadedImage = document.createElement('img');
    Object.defineProperty(unloadedImage, 'complete', {value: false});
    expect(() =>
      QRCodeCanvasRenderer({
        image: {source: unloadedImage},
      })([[1]]),
    ).toThrow('QR code canvas image source must be loaded before rendering');

    const emptyCanvas = document.createElement('canvas');
    emptyCanvas.width = 0;
    emptyCanvas.height = 0;
    expect(() =>
      QRCodeCanvasRenderer({
        image: {source: emptyCanvas},
      })([[1]]),
    ).toThrow('QR code canvas image source must have positive intrinsic dimensions');
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
    const plan = ɵcreateQRCodeStylePlan(matrix, ɵparseQRCodeStylingOptions(options));
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
