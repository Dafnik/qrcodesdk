import {QR_CODE_STYLING_ROUNDTRIP_FIXTURES} from '@repo/core-testing';
import sharp from 'sharp';
import {describe, expect, test} from 'vitest';

import {QRCodeError, qrcode} from '@qrcodesdk/core';
import {circle} from '@qrcodesdk/core/style';

import {QRCodeGIFRenderer, QRCodePNGRenderer, rasterCenterImage} from '../../src';
import {getRasterPixel, readRaster} from '../raster-helpers';

describe('QRCodeGIFRenderer', () => {
  test('returns a GIF89a Buffer with the output dimensions', () => {
    const gif = qrcode('gif').render(QRCodeGIFRenderer({style: {moduleSize: 3, quietZone: 2}}));
    expect(Buffer.isBuffer(gif)).toBe(true);
    expect(gif.toString('latin1', 0, 6)).toBe('GIF89a');
    expect(gif.readUInt16LE(6)).toBe(25 * 3);
    expect(gif.readUInt16LE(8)).toBe(25 * 3);
    expect(gif[gif.length - 1]).toBe(0x3b);
  });

  test.each(QR_CODE_STYLING_ROUNDTRIP_FIXTURES.slice(0, 6))(
    'matches the PNG pixels of the opaque $name styling fixture',
    async ({payload, matrixOptions, styling}) => {
      const builder = qrcode(payload).options(matrixOptions);
      const gif = await readRaster(builder.render(QRCodeGIFRenderer({style: styling})));
      const png = await readRaster(builder.render(QRCodePNGRenderer({style: styling})));
      expect(gif.data.equals(png.data)).toBe(true);
    },
  );

  test('makes pixels below the transparency threshold transparent', async () => {
    const style = {
      moduleSize: 8,
      quietZone: 1,
      background: '#ffffff00' as const,
      modules: circle(),
    };
    const builder = qrcode('transparent');
    const gif = await readRaster(builder.render(QRCodeGIFRenderer({style})));
    expect(getRasterPixel(gif, 0, 0).alpha).toBe(0);
    expect(getRasterPixel(gif, 12, 12)).toEqual({red: 0, green: 0, blue: 0, alpha: 255});

    const opaque = await readRaster(
      builder.render(QRCodeGIFRenderer({style, transparency: {threshold: 0}})),
    );
    expect(getRasterPixel(opaque, 0, 0).alpha).toBe(255);
  });

  test('keeps module colors exact when a center image needs color reduction', async () => {
    const width = 64;
    const pixels = Buffer.alloc(width * width * 4);
    for (let index = 0; index < width * width; index++) {
      pixels.set([index % 256, (index * 7) % 256, (index * 13) % 256, 255], index * 4);
    }
    const logo = await sharp(pixels, {raw: {width, height: width, channels: 4}})
      .png()
      .toBuffer();
    const gif = await readRaster(
      qrcode('many colors')
        .errorCorrection('H')
        .render(
          QRCodeGIFRenderer({
            style: {moduleSize: 8, foreground: '#123456', background: '#fedcba'},
            centerImage: rasterCenterImage(logo, {size: 0.3}),
          }),
        ),
    );
    expect(getRasterPixel(gif, 0, 0)).toEqual({red: 254, green: 220, blue: 186, alpha: 255});
    expect(getRasterPixel(gif, 32 + 4, 32 + 4)).toEqual({
      red: 0x12,
      green: 0x34,
      blue: 0x56,
      alpha: 255,
    });
  });

  test.each([-1, 1.5, 257, Number.NaN])('rejects transparency threshold %s', (threshold) => {
    expect(() => QRCodeGIFRenderer({transparency: {threshold}})).toThrowError(
      expect.objectContaining({
        code: 'INVALID_OPTIONS',
        details: {field: 'transparency.threshold', value: threshold},
      }) as QRCodeError,
    );
  });
});
