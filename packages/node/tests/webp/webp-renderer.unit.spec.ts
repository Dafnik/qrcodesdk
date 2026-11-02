import {QR_CODE_STYLING_ROUNDTRIP_FIXTURES} from '@repo/core-testing';
import sharp from 'sharp';
import {describe, expect, test} from 'vitest';

import {QRCodeError, qrcode} from '@qrcodesdk/core';

import {QRCodePNGRenderer, QRCodeWebPRenderer, rasterCenterImage} from '../../src';
import {readRaster} from '../raster-helpers';

describe('QRCodeWebPRenderer', () => {
  test('returns a lossless WebP Buffer', () => {
    const webp = qrcode('webp').render(QRCodeWebPRenderer());
    expect(Buffer.isBuffer(webp)).toBe(true);
    expect(webp.toString('latin1', 0, 4)).toBe('RIFF');
    expect(webp.readUInt32LE(4)).toBe(webp.length - 8);
    expect(webp.toString('latin1', 8, 16)).toBe('WEBPVP8L');
  });

  test.each(QR_CODE_STYLING_ROUNDTRIP_FIXTURES.slice(0, 6))(
    'matches the PNG pixels of the $name styling fixture',
    async ({payload, matrixOptions, styling}) => {
      const builder = qrcode(payload).options(matrixOptions);
      const webp = await readRaster(builder.render(QRCodeWebPRenderer({style: styling})));
      const png = await readRaster(builder.render(QRCodePNGRenderer({style: styling})));
      expect(webp.width).toBe(png.width);
      expect(webp.data.equals(png.data)).toBe(true);
    },
  );

  test('keeps translucent colors and many-colored center images exactly', async () => {
    const width = 32;
    const pixels = Buffer.alloc(width * width * 4);
    for (let index = 0; index < width * width; index++) {
      pixels.set([index % 256, (index * 7) % 256, (index * 13) % 256, 255], index * 4);
    }
    const logo = await sharp(pixels, {raw: {width, height: width, channels: 4}})
      .png()
      .toBuffer();
    const options = {
      style: {moduleSize: 6, foreground: '#11223399', background: '#ffffff40'},
      centerImage: rasterCenterImage(logo, {size: 0.3}),
    } as const;
    const builder = qrcode('translucent').errorCorrection('H');
    const webp = await readRaster(builder.render(QRCodeWebPRenderer(options)));
    const png = await readRaster(builder.render(QRCodePNGRenderer(options)));
    expect(webp.data.equals(png.data)).toBe(true);
  });

  test('compresses repeated module rows', () => {
    const builder = qrcode('https://qrcodesdk.dev');
    const style = {moduleSize: 16};
    expect(builder.render(QRCodeWebPRenderer({style})).length).toBeLessThan(
      builder.render(QRCodePNGRenderer({style})).length,
    );
  });

  test('rejects output above the raster size limit', () => {
    expect(() =>
      qrcode('large').render(QRCodeWebPRenderer({style: {moduleSize: 1000}})),
    ).toThrowError(QRCodeError);
  });
});
