import {QR_CODE_STYLING_ROUNDTRIP_FIXTURES} from '@repo/core-testing';
import sharp from 'sharp';
import {describe, expect, test} from 'vitest';

import {type QRCodeColor, QRCodeError, qrcode} from '@qrcodesdk/core';
import {circle} from '@qrcodesdk/core/style';

import {QRCodeJPEGRenderer, QRCodePNGRenderer} from '../../src';
import {type DecodedRaster, getRasterPixel, readRaster} from '../raster-helpers';

function maximumDifference(left: DecodedRaster, right: DecodedRaster): number {
  let maximum = 0;
  for (let index = 0; index < left.data.length; index++) {
    maximum = Math.max(maximum, Math.abs(left.data[index]! - right.data[index]!));
  }
  return maximum;
}

function meanDifference(left: DecodedRaster, right: DecodedRaster): number {
  let total = 0;
  for (let index = 0; index < left.data.length; index++) {
    total += Math.abs(left.data[index]! - right.data[index]!);
  }
  return total / left.data.length;
}

describe('QRCodeJPEGRenderer', () => {
  test('returns a baseline JFIF Buffer with the output dimensions', () => {
    const jpeg = qrcode('jpeg').render(QRCodeJPEGRenderer({style: {moduleSize: 3, quietZone: 2}}));
    expect(Buffer.isBuffer(jpeg)).toBe(true);
    expect([...jpeg.subarray(0, 4)]).toEqual([0xff, 0xd8, 0xff, 0xe0]);
    expect(jpeg.toString('latin1', 6, 11)).toBe('JFIF\0');
    const frame = jpeg.indexOf(Buffer.from([0xff, 0xc0]));
    expect(jpeg.readUInt16BE(frame + 5)).toBe(25 * 3);
    expect(jpeg.readUInt16BE(frame + 7)).toBe(25 * 3);
    expect([...jpeg.subarray(-2)]).toEqual([0xff, 0xd9]);
  });

  test('writes gray QR codes as grayscale and colored ones as color', async () => {
    const builder = qrcode('channels');
    await expect(sharp(builder.render(QRCodeJPEGRenderer())).metadata()).resolves.toMatchObject({
      channels: 1,
    });
    await expect(
      sharp(builder.render(QRCodeJPEGRenderer({style: {foreground: '#1d4ed8'}}))).metadata(),
    ).resolves.toMatchObject({channels: 3});
  });

  test('keeps square modules on whole blocks exact', async () => {
    const builder = qrcode('exact');
    const style = {moduleSize: 8, quietZone: 4};
    const jpeg = await readRaster(builder.render(QRCodeJPEGRenderer({style})));
    const png = await readRaster(builder.render(QRCodePNGRenderer({style})));
    expect(maximumDifference(jpeg, png)).toBeLessThanOrEqual(1);
  });

  test.each(QR_CODE_STYLING_ROUNDTRIP_FIXTURES.slice(0, 6))(
    'stays close to the PNG pixels of the $name styling fixture',
    async ({payload, matrixOptions, styling}) => {
      const builder = qrcode(payload).options(matrixOptions);
      const jpeg = await readRaster(builder.render(QRCodeJPEGRenderer({style: styling})));
      const png = await readRaster(
        await sharp(builder.render(QRCodePNGRenderer({style: styling})))
          .flatten({background: '#ffffff'})
          .png()
          .toBuffer(),
      );
      expect(jpeg.width).toBe(png.width);
      expect(meanDifference(jpeg, png)).toBeLessThan(4);
    },
  );

  test('blends transparent pixels onto the matte color', async () => {
    const style = {
      moduleSize: 8,
      quietZone: 1,
      background: '#ffffff00',
      modules: circle(),
    } as const;
    const builder = qrcode('transparent');
    const white = await readRaster(builder.render(QRCodeJPEGRenderer({style})));
    expect(getRasterPixel(white, 0, 0)).toEqual({red: 255, green: 255, blue: 255, alpha: 255});
    expect(getRasterPixel(white, 12, 12)).toEqual({red: 0, green: 0, blue: 0, alpha: 255});

    const matte = await readRaster(
      builder.render(QRCodeJPEGRenderer({style, transparency: {matte: '#336699'}})),
    );
    const {red, green, blue} = getRasterPixel(matte, 0, 0);
    expect(Math.abs(red! - 0x33)).toBeLessThanOrEqual(1);
    expect(Math.abs(green! - 0x66)).toBeLessThanOrEqual(1);
    expect(Math.abs(blue! - 0x99)).toBeLessThanOrEqual(1);
  });

  test('trades detail for size at lower quality', () => {
    const builder = qrcode('https://qrcodesdk.dev/quality').errorCorrection('H');
    const style = {moduleSize: 5, modules: circle(), foreground: '#7c3aed'} as const;
    const sizes = [20, 50, 92, 100].map(
      (quality) => builder.render(QRCodeJPEGRenderer({style, quality})).length,
    );
    expect(sizes).toEqual([...sizes].sort((left, right) => left - right));
  });

  test.each([0, 101, 92.5, Number.NaN])('rejects quality %s', (quality) => {
    expect(() => QRCodeJPEGRenderer({quality})).toThrowError(
      expect.objectContaining({
        code: 'INVALID_OPTIONS',
        details: {field: 'quality', value: quality},
      }) as QRCodeError,
    );
  });

  test.each(['#ffffff00', '#fff', 'red'])('rejects matte %s', (matte) => {
    expect(() => QRCodeJPEGRenderer({transparency: {matte: matte as QRCodeColor}})).toThrowError(
      expect.objectContaining({
        code: 'INVALID_OPTIONS',
        details: {field: 'transparency.matte', value: matte},
      }) as QRCodeError,
    );
  });

  test('rejects output above the raster size limit', () => {
    expect(() =>
      qrcode('large').render(QRCodeJPEGRenderer({style: {moduleSize: 1000}})),
    ).toThrowError(QRCodeError);
  });
});
