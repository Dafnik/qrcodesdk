import {matrixFromRows} from '@repo/core-testing';
import sharp from 'sharp';
import {describe, expect, test} from 'vitest';

import {QRCodeError, type QRCodeFinderStyle, qrcode} from '@qrcodesdk/core';
import type {ɵQRCodeStylePart as QRCodeStylePart} from '@qrcodesdk/core/internal';
import {circle, customShape, finder, rounded} from '@qrcodesdk/core/style';

import {QRCodePNGRenderer, rasterCenterImage} from '../../src';
import {readRaster} from '../raster-helpers';

// A prepared unit square, passed to internal layers in place of their path type.
const square = customShape({module: 'm0 0h1v1h-1z'}).module as never;

// Exercise internal raster geometry without making drawing callbacks a consumer API.
function internalFinder(part: QRCodeStylePart): QRCodeFinderStyle {
  return part as unknown as QRCodeFinderStyle;
}

describe('QRCodePNGRenderer', () => {
  test('scales output dimensions and preserves the background alpha', async () => {
    const bytes = QRCodePNGRenderer({
      style: {
        moduleSize: 4,
        quietZone: 1,
        foreground: '#112233cc',
        background: '#ffffff80',
      },
    })(matrixFromRows([[1]]));
    const png = await readRaster(bytes);
    expect(png.width).toBe(12);
    expect(png.height).toBe(12);
    expect([...png.data.subarray(0, 4)]).toEqual([255, 255, 255, 128]);
  });

  test('rasterizes imported module shapes with antialiased edges', async () => {
    const png = await readRaster(
      QRCodePNGRenderer({style: {moduleSize: 8, quietZone: 0, modules: circle()}})(
        matrixFromRows([[1]]),
      ),
    );
    const pixel = (x: number, y: number) => [
      ...png.data.subarray((y * 8 + x) * 4, (y * 8 + x) * 4 + 4),
    ];
    expect(pixel(0, 0)).toEqual([255, 255, 255, 255]);
    expect(pixel(4, 4)).toEqual([0, 0, 0, 255]);
    // Edge pixels are partially covered.
    expect(pixel(1, 1)[0]).toBeGreaterThan(0);
    expect(pixel(1, 1)[0]).toBeLessThan(255);
  });

  test('draws finder parts with their own shapes and color', async () => {
    const png = await readRaster(
      QRCodePNGRenderer({
        style: {
          moduleSize: 4,
          quietZone: 0,
          finder: finder({ring: rounded({radius: 1}), center: circle(), color: '#ff0000'}),
        },
      })(qrcode('finder').matrix()),
    );
    const pixel = (x: number, y: number) => {
      const index = (y * png.width + x) * 4;
      return [...png.data.subarray(index, index + 4)];
    };
    // The rounded ring leaves its outer corner light, and the circle center is red.
    expect(pixel(0, 0)).toEqual([255, 255, 255, 255]);
    expect(pixel(14, 1)).toEqual([255, 0, 0, 255]);
    expect(pixel(14, 14)).toEqual([255, 0, 0, 255]);
  });

  test.each([1, 5])(
    'preserves fractional rectangle and tile coverage at module size %i',
    async (moduleSize) => {
      const render = async (part: QRCodeStylePart) =>
        readRaster(
          QRCodePNGRenderer({
            style: {
              moduleSize,
              quietZone: 0,
              background: '#ffffff00',
              foreground: '#ff0000',
              finder: internalFinder(part),
            },
          })(
            matrixFromRows([
              [0, 0],
              [0, 0],
            ]),
          ),
        );
      const offset = 0.5 / moduleSize;
      const rect = await render((context) => context.layer().rect(offset, offset, 1, 1));
      const tile = await render((context) => context.layer().tile(square, offset, offset));
      expect(tile.data).toEqual(rect.data);
      expect([...tile.data.subarray(0, 4)]).toEqual([255, 0, 0, 64]);
    },
  );

  test('rasterizes signed exponential coordinates and compact arc flags', async () => {
    const bytes = QRCodePNGRenderer({
      style: {
        moduleSize: 8,
        quietZone: 0,
        modules: customShape({
          module: 'm+5e-1,0a.5.5 0 010 1a.5.5 0 010-1z',
        }),
      },
    })(matrixFromRows([[1]]));
    const circleBytes = QRCodePNGRenderer({
      style: {moduleSize: 8, quietZone: 0, modules: circle()},
    })(matrixFromRows([[1]]));
    expect((await readRaster(bytes)).data).toEqual((await readRaster(circleBytes)).data);
  });

  test.each(['rectangles', 'tiles', 'mixed'] as const)(
    'fills adjacent fractional %s as one color layer',
    async (kind) => {
      const png = await readRaster(
        QRCodePNGRenderer({
          style: {
            moduleSize: 1,
            quietZone: 0,
            background: '#ffffff00',
            foreground: '#ff000080',
            finder: internalFinder((context) => {
              const layer = context.layer();
              if (kind === 'tiles') layer.tile(square, 0.5, 0);
              else layer.rect(0.5, 0, 1, 1);
              if (kind === 'rectangles') layer.rect(1.5, 0, 1, 1);
              else layer.tile(square, 1.5, 0);
            }),
          },
        })(
          matrixFromRows([
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ]),
        ),
      );
      expect([...png.data.subarray(0, 12)]).toEqual([255, 0, 0, 64, 255, 0, 0, 128, 255, 0, 0, 64]);
    },
  );

  test('clips rectangles entirely outside the output without touching its pixels', async () => {
    const png = await readRaster(
      QRCodePNGRenderer({
        style: {
          moduleSize: 1,
          quietZone: 0,
          finder: internalFinder((context) => {
            context.layer().rect(-3, 0, 1, 1);
            context.layer().rect(3, 0, 1, 1);
          }),
        },
      })(matrixFromRows([[0]])),
    );
    expect([...png.data]).toEqual([255, 255, 255, 255]);
  });

  test('composites center images over cleared modules', async () => {
    const logo = await sharp({
      create: {width: 4, height: 4, channels: 4, background: {r: 255, g: 0, b: 0, alpha: 1}},
    })
      .png()
      .toBuffer();
    const png = await readRaster(
      QRCodePNGRenderer({
        style: {moduleSize: 4, quietZone: 0},
        centerImage: rasterCenterImage(logo, {size: 0.2, padding: 1}),
      })(qrcode('png center image').errorCorrection('H').matrix()),
    );
    const pixel = (x: number, y: number) => {
      const index = (y * png.width + x) * 4;
      return [...png.data.subarray(index, index + 4)];
    };
    const moduleCount = png.width / 4;
    const center = png.width / 2;
    const padding = Math.floor((moduleCount * 0.8) / 2 - 1) * 4 + 2;

    expect(pixel(center, center)).toEqual([255, 0, 0, 255]);
    expect(pixel(padding, center)).toEqual([255, 255, 255, 255]);
  });

  test('accepts PNG bytes in a plain Uint8Array view', async () => {
    const logo = await sharp({
      create: {width: 4, height: 4, channels: 4, background: {r: 255, g: 0, b: 0, alpha: 1}},
    })
      .png()
      .toBuffer();
    const padded = new Uint8Array(logo.length + 3);
    padded.set(logo, 3);
    const render = (source: Uint8Array) =>
      QRCodePNGRenderer({style: {moduleSize: 2}, centerImage: rasterCenterImage(source)})(
        qrcode('byte view').matrix(),
      );

    expect(render(padded.subarray(3))).toEqual(render(logo));
  });

  test('fits non-square, semi-transparent images over modules without clearing', async () => {
    const logo = await sharp({
      create: {width: 8, height: 2, channels: 4, background: {r: 255, g: 0, b: 0, alpha: 0.5}},
    })
      .png()
      .toBuffer();
    const matrix = matrixFromRows(
      Array.from({length: 10}, () => Array.from({length: 10}, () => 1)),
    );
    const png = await readRaster(
      QRCodePNGRenderer({
        style: {moduleSize: 4, quietZone: 0},
        centerImage: rasterCenterImage(logo, {size: 0.4, clearBackground: false}),
      })(matrix),
    );
    const pixel = (x: number, y: number) => {
      const index = (y * png.width + x) * 4;
      return [...png.data.subarray(index, index + 4)];
    };

    // The 16 x 4 pixel image box is centered vertically inside its 16 x 16 pixel square.
    const [red, green, blue, alpha] = pixel(20, 20);
    expect(Math.abs(red! - 128)).toBeLessThanOrEqual(1);
    expect([green, blue, alpha]).toEqual([0, 0, 255]);
    expect(pixel(20, 14)).toEqual([0, 0, 0, 255]);
  });

  test('rejects output above the pixel budget before allocating it', () => {
    // 8193 x 8193 pixels is one row and column above the budget.
    expect(() =>
      QRCodePNGRenderer({style: {moduleSize: 8193, quietZone: 0}})(matrixFromRows([[1]])),
    ).toThrowError(
      expect.objectContaining({
        code: 'INVALID_OPTIONS',
        details: {field: 'dimensions', value: 8193},
      }),
    );
  });

  test('validates compression levels eagerly', () => {
    expect(() => QRCodePNGRenderer({compression: {level: 10}})).toThrowError(QRCodeError);
  });

  test('rejects center-image PNG headers above the pixel budget before decoding', () => {
    const source = Buffer.alloc(24);
    source.write('89504e470d0a1a0a', 'hex');
    source.writeUInt32BE(13, 8);
    source.write('IHDR', 12, 'ascii');
    source.writeUInt32BE(10_000, 16);
    source.writeUInt32BE(10_000, 20);

    expect(() => rasterCenterImage(source)).toThrowError(
      expect.objectContaining({code: 'INVALID_IMAGE_SOURCE'}),
    );
  });
});
