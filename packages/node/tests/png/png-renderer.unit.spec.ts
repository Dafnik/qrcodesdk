import {matrixFromRows} from '@repo/core-testing';
import sharp from 'sharp';
import {describe, expect, test} from 'vitest';

import {QRCodeError, type QRCodeStylePart, qrcode} from '@qrcodesdk/core';
import {circle, finder, rounded} from '@qrcodesdk/core/style';

import {QRCodePNGRenderer, pngCenterImage} from '../../src';
import {readPng} from './png-helpers';

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
    const png = await readPng(bytes);
    expect(png.width).toBe(12);
    expect(png.height).toBe(12);
    expect([...png.data.subarray(0, 4)]).toEqual([255, 255, 255, 128]);
  });

  test('rasterizes imported module shapes with antialiased edges', async () => {
    const png = await readPng(
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
    const png = await readPng(
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
        readPng(
          QRCodePNGRenderer({
            style: {
              moduleSize,
              quietZone: 0,
              background: '#ffffff00',
              foreground: '#ff0000',
              finder: part,
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
      const tile = await render((context) => context.layer().tile('m0 0h1v1h-1z', offset, offset));
      expect(tile.data).toEqual(rect.data);
      expect([...tile.data.subarray(0, 4)]).toEqual([255, 0, 0, 64]);
    },
  );

  test('rasterizes signed exponential coordinates and compact arc flags', async () => {
    const bytes = QRCodePNGRenderer({
      style: {
        moduleSize: 8,
        quietZone: 0,
        modules: {
          module: 'm+5e-1,0a.5.5 0 010 1a.5.5 0 010-1z',
        },
      },
    })(matrixFromRows([[1]]));
    const circleBytes = QRCodePNGRenderer({
      style: {moduleSize: 8, quietZone: 0, modules: circle()},
    })(matrixFromRows([[1]]));
    expect((await readPng(bytes)).data).toEqual((await readPng(circleBytes)).data);
  });

  test.each(['rectangles', 'tiles', 'mixed'] as const)(
    'fills adjacent fractional %s as one color layer',
    async (kind) => {
      const png = await readPng(
        QRCodePNGRenderer({
          style: {
            moduleSize: 1,
            quietZone: 0,
            background: '#ffffff00',
            foreground: '#ff000080',
            finder: (context) => {
              const layer = context.layer();
              if (kind === 'tiles') layer.tile('m0 0h1v1h-1z', 0.5, 0);
              else layer.rect(0.5, 0, 1, 1);
              if (kind === 'rectangles') layer.rect(1.5, 0, 1, 1);
              else layer.tile('m0 0h1v1h-1z', 1.5, 0);
            },
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
    const png = await readPng(
      QRCodePNGRenderer({
        style: {
          moduleSize: 1,
          quietZone: 0,
          finder: (context) => {
            context.layer().rect(-3, 0, 1, 1);
            context.layer().rect(3, 0, 1, 1);
          },
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
    const png = await readPng(
      QRCodePNGRenderer({
        style: {moduleSize: 4, quietZone: 0},
        centerImage: pngCenterImage(logo, {size: 0.2, padding: 1}),
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

  test('validates nested compression and rejects legacy fields eagerly', () => {
    expect(() => QRCodePNGRenderer({compression: {level: 10}})).toThrowError(QRCodeError);
    expect(() => QRCodePNGRenderer({compressionLevel: 9} as never)).toThrowError(
      expect.objectContaining({
        details: expect.objectContaining({field: 'options.compressionLevel'}),
      }),
    );
    expect(() => QRCodePNGRenderer({compression: null} as never)).toThrowError(
      expect.objectContaining({details: expect.objectContaining({field: 'compression'})}),
    );
    expect(() => QRCodePNGRenderer({centerImage: {source: Buffer.alloc(0)}} as never)).toThrowError(
      expect.objectContaining({details: expect.objectContaining({field: 'centerImage'})}),
    );
    expect(() => QRCodePNGRenderer({centerImage: []} as never)).toThrowError(
      expect.objectContaining({details: expect.objectContaining({field: 'centerImage'})}),
    );
  });

  test('rejects center-image PNG headers above the pixel budget before decoding', () => {
    const source = Buffer.alloc(24);
    source.write('89504e470d0a1a0a', 'hex');
    source.writeUInt32BE(13, 8);
    source.write('IHDR', 12, 'ascii');
    source.writeUInt32BE(10_000, 16);
    source.writeUInt32BE(10_000, 20);

    expect(() => pngCenterImage(source)).toThrowError(
      expect.objectContaining({code: 'INVALID_IMAGE_SOURCE'}),
    );
    expect(() => pngCenterImage('logo.png' as never)).toThrowError(
      expect.objectContaining({code: 'INVALID_IMAGE_SOURCE'}),
    );
  });
});
