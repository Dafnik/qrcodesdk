import sharp from 'sharp';
import {describe, expect, test} from 'vitest';

import {QRCodeError} from '../../src/error';
import {encodeGIF, resolveGIFTransparencyThreshold} from '../../src/raster/gif';
import type {RGBAImage} from '../../src/raster/types';
import {encodeWebP} from '../../src/raster/webp';

// Decodes with libwebp and giflib so the encoders are verified independently.
async function decode(bytes: Uint8Array): Promise<RGBAImage> {
  const {data, info} = await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  return {width: info.width, height: info.height, data};
}

/** Creates an image from a seeded palette, in noisy or blocky regions. */
function createImage(
  width: number,
  height: number,
  colorCount: number,
  {alpha = false, block = 0}: {alpha?: boolean; block?: number} = {},
): RGBAImage {
  let seed = width * 31 + height * 17 + colorCount;
  const random = () => (seed = (Math.imul(seed, 1_103_515_245) + 12_345) >>> 0) / 2 ** 32;
  const byte = () => Math.floor(random() * 256);
  const palette = Array.from({length: colorCount}, () => [
    byte(),
    byte(),
    byte(),
    alpha ? byte() : 255,
  ]);
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = block
        ? (Math.floor(x / block) * 7 + Math.floor(y / block) * 13) % colorCount
        : Math.floor(random() * colorCount);
      data.set(palette[index]!, (y * width + x) * 4);
    }
  }
  return {width, height, data};
}

const SIZES = [
  [1, 1],
  [2, 1],
  [1, 5],
  [7, 3],
  [33, 17],
  [257, 3],
  [128, 128],
] as const;
const COLOR_COUNTS = [1, 2, 3, 4, 5, 16, 17, 255, 256, 257, 5000];
const CASES = SIZES.flatMap(([width, height]) =>
  COLOR_COUNTS.flatMap((colors) => [0, 4].map((block) => ({width, height, colors, block}))),
);

describe('encodeWebP', () => {
  test.each(CASES)(
    'round-trips $width x $height pixels with $colors colors (block $block) losslessly',
    async ({width, height, colors, block}) => {
      for (const alpha of [false, true]) {
        const image = createImage(width, height, colors, {alpha, block});
        const decoded = await decode(encodeWebP(image));
        expect(decoded.width).toBe(width);
        expect(decoded.height).toBe(height);
        expect(Buffer.from(decoded.data).equals(Buffer.from(image.data))).toBe(true);
      }
    },
  );

  test('writes a RIFF container with an even-sized VP8L chunk', () => {
    const bytes = Buffer.from(encodeWebP(createImage(3, 3, 2)));
    expect(bytes.toString('latin1', 0, 4)).toBe('RIFF');
    expect(bytes.readUInt32LE(4)).toBe(bytes.length - 8);
    expect(bytes.toString('latin1', 8, 16)).toBe('WEBPVP8L');
    expect(bytes[20]).toBe(0x2f);
    expect(bytes.length % 2).toBe(0);
  });

  test('turns repeated rows into short backward references', () => {
    const repeated = createImage(512, 512, 2, {block: 64});
    expect(encodeWebP(repeated).length).toBeLessThan(200);
  });

  test.each([
    [0, 1],
    [16_385, 1],
  ])('rejects %i x %i images', (width, height) => {
    expect(() => encodeWebP({width, height, data: new Uint8Array(width * height * 4)})).toThrow(
      QRCodeError,
    );
  });
});

describe('encodeGIF', () => {
  test.each(CASES.filter(({colors}) => colors <= 256))(
    'round-trips $width x $height opaque pixels with $colors colors (block $block)',
    async ({width, height, colors, block}) => {
      const image = createImage(width, height, colors, {block});
      const decoded = await decode(encodeGIF(image));
      expect(decoded.width).toBe(width);
      expect(decoded.height).toBe(height);
      expect(Buffer.from(decoded.data).equals(Buffer.from(image.data))).toBe(true);
    },
  );

  test('keeps the most frequent colors exact when reducing colors', async () => {
    const image = createImage(128, 128, 5000);
    // Two dominant colors, like a QR code background and its modules.
    for (let index = 0; index < 128 * 64; index++) {
      image.data.set(index % 2 ? [255, 255, 255, 255] : [12, 34, 56, 255], index * 4);
    }
    const decoded = await decode(encodeGIF(image));
    expect([...decoded.data.subarray(0, 8)]).toEqual([12, 34, 56, 255, 255, 255, 255, 255]);
    // Reduced colors stay close to the source.
    let error = 0;
    for (let index = 0; index < decoded.data.length; index++) {
      error += Math.abs(decoded.data[index]! - image.data[index]!);
    }
    expect(error / decoded.data.length).toBeLessThan(8);
  });

  test('writes pixels below the transparency threshold as transparent', async () => {
    const data = new Uint8Array([
      ...[10, 20, 30, 255],
      ...[10, 20, 30, 127],
      ...[10, 20, 30, 128],
      ...[0, 0, 0, 0],
    ]);
    const image = {width: 4, height: 1, data};
    const alpha = async (options?: Parameters<typeof encodeGIF>[1]) =>
      [...(await decode(encodeGIF(image, options))).data].filter((_, index) => index % 4 === 3);

    await expect(alpha()).resolves.toEqual([255, 0, 255, 0]);
    await expect(alpha({transparencyThreshold: 0})).resolves.toEqual([255, 255, 255, 255]);
    await expect(alpha({transparencyThreshold: 256})).resolves.toEqual([0, 0, 0, 0]);
  });

  test('resets the LZW table for long noisy streams', async () => {
    const image = createImage(300, 300, 256);
    const decoded = await decode(encodeGIF(image));
    expect(Buffer.from(decoded.data).equals(Buffer.from(image.data))).toBe(true);
  });

  test.each([-1, 0.5, 257, Number.NaN])('rejects transparency threshold %s', (value) => {
    expect(() => resolveGIFTransparencyThreshold(value)).toThrow(
      expect.objectContaining({code: 'INVALID_OPTIONS'}),
    );
  });

  test('rejects images larger than 65535 pixels per side', () => {
    expect(() => encodeGIF({width: 65_536, height: 1, data: new Uint8Array(0)})).toThrow(
      QRCodeError,
    );
  });
});
