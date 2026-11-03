import sharp, {type Sharp} from 'sharp';
import {describe, expect, test} from 'vitest';

import {QRCodeError} from '../../src/error';
import {encodeGIF, resolveGIFTransparencyThreshold} from '../../src/raster/gif';
import {
  assignOptimalCodes,
  createHuffmanTable,
  encodeJPEG,
  resolveJPEGOptions,
} from '../../src/raster/jpeg';
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

describe('encodeJPEG', () => {
  /** Returns the decoded RGB channels and the number of channels stored in the file. */
  async function decodeJPEG(bytes: Uint8Array) {
    const {channels} = await sharp(bytes).metadata();
    return {...(await decode(bytes)), channels};
  }

  function measureError(image: RGBAImage, decoded: RGBAImage) {
    let squared = 0;
    let maximum = 0;
    let count = 0;
    for (let index = 0; index < image.data.length; index++) {
      if (index % 4 === 3) continue;
      const difference = decoded.data[index]! - image.data[index]!;
      squared += difference * difference;
      maximum = Math.max(maximum, Math.abs(difference));
      count++;
    }
    const psnr = squared === 0 ? Infinity : 10 * Math.log10((255 * 255 * count) / squared);
    return {maximum, psnr};
  }

  function createGrayImage(width: number, height: number, block: number): RGBAImage {
    const image = createImage(width, height, 4, {block});
    for (let offset = 0; offset < image.data.length; offset += 4) {
      image.data.fill(image.data[offset]!, offset, offset + 3);
    }
    return image;
  }

  test.each(SIZES)('keeps the dimensions of %i x %i pixels', async (width, height) => {
    for (const image of [createImage(width, height, 16), createGrayImage(width, height, 0)]) {
      const decoded = await decodeJPEG(encodeJPEG(image));
      expect(decoded.width).toBe(width);
      expect(decoded.height).toBe(height);
    }
  });

  test('writes one channel when every pixel is gray', async () => {
    await expect(decodeJPEG(encodeJPEG(createGrayImage(33, 17, 4)))).resolves.toMatchObject({
      channels: 1,
    });
    await expect(
      decodeJPEG(encodeJPEG(createImage(33, 17, 16, {block: 4}))),
    ).resolves.toMatchObject({channels: 3});
  });

  test('writes the baseline JFIF segments in order', () => {
    const markers = (bytes: Uint8Array) => {
      const found: number[] = [];
      for (let offset = 2; bytes[offset] === 0xff && bytes[offset + 1] !== 0xda;) {
        found.push(bytes[offset + 1]!);
        offset += 2 + ((bytes[offset + 2]! << 8) | bytes[offset + 3]!);
      }
      return found;
    };
    const color = Buffer.from(encodeJPEG(createImage(9, 9, 3)));
    expect([...color.subarray(0, 2)]).toEqual([0xff, 0xd8]);
    expect(color.toString('latin1', 6, 11)).toBe('JFIF\0');
    expect(markers(color)).toEqual([0xe0, 0xdb, 0xc0, 0xc4]);
    expect([...color.subarray(-2)]).toEqual([0xff, 0xd9]);
    // Color images store two quantization tables, grayscale images one.
    expect(color.readUInt16BE(color.indexOf(Buffer.from([0xff, 0xdb])) + 2)).toBe(132);
    const gray = Buffer.from(encodeJPEG(createGrayImage(9, 9, 0)));
    expect(gray.readUInt16BE(gray.indexOf(Buffer.from([0xff, 0xdb])) + 2)).toBe(67);
  });

  // libjpeg-turbo uses the same integer transform, color conversion, quantization tables, and
  // optimal Huffman table construction.
  test.each([50, 92, 100])(
    'writes the same tables and scan data as libjpeg-turbo at quality %i',
    async (quality) => {
      const scan = (bytes: Uint8Array) =>
        Buffer.from(bytes).subarray(Buffer.from(bytes).indexOf(Buffer.from([0xff, 0xda])));
      // Collects every Huffman table by class and id, whether written in one segment or several.
      const huffmanTables = (bytes: Uint8Array) => {
        const tables: Record<number, string> = {};
        for (let offset = 2; bytes[offset + 1] !== 0xda;) {
          const end = offset + 2 + ((bytes[offset + 2]! << 8) | bytes[offset + 3]!);
          for (let table = offset + 4; bytes[offset + 1] === 0xc4 && table < end;) {
            const count = bytes.subarray(table + 1, table + 17).reduce((sum, value) => sum + value);
            tables[bytes[table]!] = Buffer.from(
              bytes.subarray(table + 1, table + 17 + count),
            ).toString('hex');
            table += 17 + count;
          }
          offset = end;
        }
        return tables;
      };
      const expectLibjpeg = (actual: Uint8Array, expected: Uint8Array) => {
        expect(huffmanTables(actual)).toEqual(huffmanTables(expected));
        expect(scan(actual).equals(scan(expected))).toBe(true);
      };
      const jpeg = (input: Sharp) =>
        input.jpeg({quality, chromaSubsampling: '4:4:4', optimizeCoding: true}).toBuffer();
      for (const image of [createImage(37, 21, 5000), createImage(64, 40, 7, {block: 3})]) {
        const raw = {raw: {width: image.width, height: image.height, channels: 4}} as const;
        const expected = await jpeg(sharp(image.data, raw).removeAlpha());
        expectLibjpeg(encodeJPEG(image, {quality}), expected);
      }
      const gray = createGrayImage(37, 21, 3);
      const raw = {raw: {width: gray.width, height: gray.height, channels: 4}} as const;
      const expected = await jpeg(sharp(gray.data, raw).extractChannel(0).toColourspace('b-w'));
      expectLibjpeg(encodeJPEG(gray, {quality}), expected);
    },
  );

  test('limits Huffman codes to 16 bits without an all-ones code', () => {
    // Fibonacci frequencies make the unlimited Huffman tree as deep as possible.
    const table = createHuffmanTable();
    for (let symbol = 0, previous = 1, current = 1; symbol < 40; symbol++) {
      table.frequencies[symbol] = current;
      [previous, current] = [current, previous + current];
    }
    assignOptimalCodes(table);

    expect(table.counts).toHaveLength(16);
    expect(table.counts.reduce((sum, count) => sum + count)).toBe(40);
    expect(new Set(table.symbols).size).toBe(40);
    // The Kraft sum stays below 1, because one code of the longest length is left unused.
    const kraft = table.counts.reduce((sum, count, index) => sum + count / 2 ** (index + 1), 0);
    expect(kraft).toBeLessThan(1);
    for (const symbol of table.symbols) {
      const length = table.lengths[symbol]!;
      expect(length).toBeLessThanOrEqual(16);
      expect(table.codes[symbol]).not.toBe(2 ** length - 1);
    }
    // More frequent symbols never get longer codes.
    for (let symbol = 1; symbol < 40; symbol++) {
      expect(table.lengths[symbol]).toBeLessThanOrEqual(table.lengths[symbol - 1]!);
    }
  });

  test('writes 16 code length counts for a table with short codes', () => {
    const table = createHuffmanTable();
    table.frequencies[0] = 5;
    assignOptimalCodes(table);
    expect(table.counts).toEqual([1, ...Array.from({length: 15}, () => 0)]);
    expect(table.symbols).toEqual([0]);
  });

  test('stores flat blocks almost exactly at high quality', async () => {
    for (const image of [createImage(64, 48, 5, {block: 8}), createGrayImage(64, 48, 8)]) {
      for (const quality of [90, 100]) {
        const {maximum} = measureError(image, await decode(encodeJPEG(image, {quality})));
        expect(maximum).toBeLessThanOrEqual(2);
      }
    }
  });

  test.each([
    [100, 45],
    [92, 30],
    [50, 15],
  ])('keeps noisy images above a PSNR threshold at quality %i', async (quality, threshold) => {
    const image = createImage(128, 128, 5000);
    const {psnr} = measureError(image, await decode(encodeJPEG(image, {quality})));
    expect(psnr).toBeGreaterThan(threshold);
  });

  test('loses more detail at lower quality', () => {
    const image = createImage(128, 128, 5000);
    const sizes = [10, 50, 92, 100].map((quality) => encodeJPEG(image, {quality}).length);
    expect(sizes).toEqual([...sizes].sort((left, right) => left - right));
  });

  test('blends transparent pixels onto the matte color', async () => {
    const data = new Uint8Array(8 * 8 * 4);
    const image = {width: 8, height: 8, data};
    const firstPixel = async (options?: Parameters<typeof encodeJPEG>[1]) => [
      ...(await decode(encodeJPEG(image, options))).data.subarray(0, 3),
    ];

    await expect(firstPixel()).resolves.toEqual([255, 255, 255]);
    // The YCbCr conversion rounds each channel by up to 1.
    for (const matte of ['#204060', '#204060FF'] as const) {
      const pixel = await firstPixel({matte});
      pixel.forEach((value, index) =>
        expect(Math.abs(value - [32, 64, 96][index]!)).toBeLessThanOrEqual(1),
      );
    }
    // Half-transparent black on white becomes mid gray.
    for (let offset = 3; offset < data.length; offset += 4) data[offset] = 128;
    const [gray] = await firstPixel();
    expect(Math.abs(gray! - 127)).toBeLessThanOrEqual(1);
  });

  test('produces identical bytes on every run', () => {
    const image = createImage(57, 31, 300, {alpha: true});
    expect(Buffer.from(encodeJPEG(image)).equals(Buffer.from(encodeJPEG(image)))).toBe(true);
  });

  test('fills in the default options', () => {
    expect(resolveJPEGOptions()).toEqual({quality: 92, matte: '#ffffff'});
    expect(resolveJPEGOptions({quality: 1, matte: '#ABCDEF'})).toEqual({
      quality: 1,
      matte: '#abcdef',
    });
  });

  test.each([0, 101, 50.5, Number.NaN])('rejects quality %s', (quality) => {
    expect(() => resolveJPEGOptions({quality})).toThrow(
      expect.objectContaining({
        code: 'INVALID_OPTIONS',
        details: {field: 'quality', value: quality},
      }),
    );
  });

  test.each(['#fff', 'white', '#ffffff80', '#00000000'])('rejects matte %s', (matte) => {
    expect(() => resolveJPEGOptions({matte: matte as `#${string}`})).toThrow(
      expect.objectContaining({
        code: 'INVALID_OPTIONS',
        details: {field: 'transparency.matte', value: matte},
      }),
    );
  });

  test.each([
    [0, 1],
    [65_536, 1],
  ])('rejects %i x %i images', (width, height) => {
    expect(() => encodeJPEG({width, height, data: new Uint8Array(0)})).toThrow(
      expect.objectContaining({code: 'RENDER_FAILED'}),
    );
  });
});
