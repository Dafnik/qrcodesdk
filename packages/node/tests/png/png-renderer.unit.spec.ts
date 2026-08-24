import {PNG} from 'pngjs';
import {describe, expect, test} from 'vitest';

import {qrcode, ɵcreateQRCodeStylePlan, ɵparseQRCodeStylingOptions} from '@qrcodesdk/core';
import type {QRCodeMatrix} from '@qrcodesdk/core';

import {QRCodePNGRenderer} from '../../src';
import {getPngPixel} from './png-helpers';

function readPng(buffer: Buffer): PNG {
  return PNG.sync.read(buffer);
}

function expectPixel(png: PNG, x: number, y: number, rgba: ReturnType<typeof getPngPixel>): void {
  expect(getPngPixel(png, x, y)).toEqual(rgba);
}

function createPreparedImage(
  width: number,
  height: number,
  color: {red: number; green: number; blue: number; alpha: number},
): Buffer {
  const png = new PNG({width, height});
  for (let index = 0; index < png.data.length; index += 4) {
    png.data[index] = color.red;
    png.data[index + 1] = color.green;
    png.data[index + 2] = color.blue;
    png.data[index + 3] = color.alpha;
  }
  return PNG.sync.write(png);
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

  test('clips curved modules outside the raster bounds', () => {
    const png = readPng(
      QRCodePNGRenderer({size: 4, margin: 0, dotsOptions: {type: 'dots'}})([
        [0, 0, 1],
        [0, 0],
      ]),
    );

    expect(Array.from(png.data)).toEqual(new Array<number>(8 * 8 * 4).fill(255));
  });

  test('centers and contains prepared PNG bytes without changing their aspect ratio', () => {
    const png = readPng(
      QRCodePNGRenderer({
        size: 10,
        margin: 0,
        image: {
          source: createPreparedImage(4, 2, {red: 255, green: 0, blue: 0, alpha: 255}),
          size: 0.5,
          padding: 0,
        },
      })([
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
      ]),
    );

    expectPixel(png, 10, 10, {red: 255, green: 255, blue: 255, alpha: 255});
    expectPixel(png, 20, 14, {red: 255, green: 255, blue: 255, alpha: 255});
    expectPixel(png, 10, 15, {red: 255, green: 0, blue: 0, alpha: 255});
    expectPixel(png, 29, 24, {red: 255, green: 0, blue: 0, alpha: 255});
    expectPixel(png, 20, 25, {red: 255, green: 255, blue: 255, alpha: 255});
  });

  test('alpha-composites over QR modules when clearing is disabled', () => {
    const transparentImage = createPreparedImage(1, 1, {
      red: 255,
      green: 0,
      blue: 0,
      alpha: 0,
    });
    const matrix: QRCodeMatrix = [
      [1, 1],
      [1, 1],
    ];
    const withoutClearing = readPng(
      QRCodePNGRenderer({
        size: 10,
        margin: 0,
        image: {source: transparentImage, size: 1, clearBackground: false},
      })(matrix),
    );
    const withClearing = readPng(
      QRCodePNGRenderer({
        size: 10,
        margin: 0,
        image: {source: transparentImage, size: 1},
      })(matrix),
    );

    expectPixel(withoutClearing, 10, 10, {red: 0, green: 0, blue: 0, alpha: 255});
    expectPixel(withClearing, 10, 10, {red: 255, green: 255, blue: 255, alpha: 255});
  });

  test('caches decoded image data independently per renderer instance', () => {
    const source = createPreparedImage(1, 1, {red: 255, green: 0, blue: 0, alpha: 255});
    const renderer = QRCodePNGRenderer({image: {source}});

    expect(() => renderer([[1]])).not.toThrow();
    source.fill(0);
    expect(() => renderer([[1]])).not.toThrow();
    expect(() => QRCodePNGRenderer({image: {source}})([[1]])).toThrow(
      'QR code PNG image source must contain valid PNG bytes',
    );
  });

  test('rejects invalid prepared PNG sources with stable errors', () => {
    expect(() =>
      QRCodePNGRenderer({
        image: {source: Buffer.from('not a png')},
      })([[1]]),
    ).toThrow('QR code PNG image source must contain valid PNG bytes');

    expect(() =>
      QRCodePNGRenderer({
        image: {source: new Uint8Array() as unknown as Buffer},
      })([[1]]),
    ).toThrow('QR code PNG image source must be a Buffer containing PNG bytes');
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
    expect(() => QRCodePNGRenderer({compressionLevel: 10})([[1]])).toThrow(
      'QR code PNG compressionLevel must be an integer from 0 to 9',
    );
  });

  test('supports faster configurable PNG compression', () => {
    const fast = QRCodePNGRenderer({compressionLevel: 0})([[1]]);
    const compressed = QRCodePNGRenderer({compressionLevel: 9})([[1]]);
    const png = readPng(fast);

    expectPixel(png, 20, 20, {red: 0, green: 0, blue: 0, alpha: 255});
    expect(fast.length).not.toBe(compressed.length);
  });

  test('snapshots styling, image, and PNG options on first use', () => {
    const source = createPreparedImage(1, 1, {red: 255, green: 0, blue: 0, alpha: 255});
    const options = {
      size: 2,
      margin: 0,
      colors: {colorDark: '#112233' as '#112233' | '#445566'},
      image: {source, size: 0.2},
      compressionLevel: 0,
    };
    const renderer = QRCodePNGRenderer(options);
    const first = renderer([[1]]);

    options.size = 4;
    options.margin = 2;
    options.colors.colorDark = '#445566';
    options.image.source = createPreparedImage(1, 1, {
      red: 0,
      green: 255,
      blue: 0,
      alpha: 255,
    });
    options.image.size = 0.8;
    options.compressionLevel = 9;

    expect(renderer([[1]])).toEqual(first);
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
    const plan = ɵcreateQRCodeStylePlan(matrix, ɵparseQRCodeStylingOptions(options));
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
