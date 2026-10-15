import {crc32, deflateSync} from 'node:zlib';
import sharp from 'sharp';
import {describe, expect, test} from 'vitest';

import {decodePNG, encodePNG} from '../../src/png-codec';

const PASSES = [
  [0, 0, 8, 8],
  [4, 0, 8, 8],
  [0, 4, 4, 8],
  [2, 0, 4, 4],
  [0, 2, 2, 4],
  [1, 0, 2, 2],
  [0, 1, 1, 2],
] as const;
const CHANNELS: Record<number, number> = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4};

function randomBytes(length: number, seed: number): Buffer {
  const bytes = Buffer.alloc(length);
  for (let index = 0; index < length; index++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    bytes[index] = seed >> 16;
  }
  return bytes;
}

function chunk(type: string, data: Buffer): Buffer {
  const result = Buffer.alloc(data.length + 12);
  result.writeUInt32BE(data.length, 0);
  result.write(type, 4, 'latin1');
  data.copy(result, 8);
  result.writeUInt32BE(crc32(result.subarray(4, data.length + 8)), data.length + 8);
  return result;
}

function createPNG(options: {
  width: number;
  height: number;
  depth: number;
  colorType: number;
  interlaced: boolean;
  transparency?: Buffer;
  seed: number;
}): Buffer {
  const {width, height, depth, colorType, interlaced} = options;
  const bitsPerPixel = CHANNELS[colorType]! * depth;
  const passes = interlaced ? PASSES : ([[0, 0, 1, 1]] as const);
  const rows: Buffer[] = [];
  let seed = options.seed;
  for (const [startX, startY, stepX, stepY] of passes) {
    const passWidth = width > startX ? Math.ceil((width - startX) / stepX) : 0;
    const passHeight = height > startY ? Math.ceil((height - startY) / stepY) : 0;
    if (passWidth === 0) continue;
    for (let y = 0; y < passHeight; y++) {
      const row = randomBytes(((passWidth * bitsPerPixel + 7) >> 3) + 1, seed++);
      row[0] = row[0]! % 5;
      rows.push(row);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = depth;
  header[9] = colorType;
  header[12] = interlaced ? 1 : 0;
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    chunk('IHDR', header),
    ...(colorType === 3
      ? [chunk('PLTE', randomBytes(2 ** Math.min(depth, 8) * 3, options.seed))]
      : []),
    ...(options.transparency ? [chunk('tRNS', options.transparency)] : []),
    chunk('tEXt', Buffer.from('Comment\0ignored')),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const FORMATS = [
  ...[1, 2, 4, 8, 16].map((depth) => ({colorType: 0, depth})),
  ...[1, 2, 4, 8].map((depth) => ({colorType: 3, depth})),
  ...[8, 16].flatMap((depth) => [2, 4, 6].map((colorType) => ({colorType, depth}))),
];

async function decodeReference(source: Buffer): Promise<Buffer> {
  return sharp(source).toColourspace('srgb').ensureAlpha().raw().toBuffer();
}

// The reference decoder keeps the color of tRNS-keyed transparent pixels, which the codec
// clears, and truncates 16-bit samples, which the codec rounds.
function expectPixelsToMatchReference(actual: Buffer, expected: Buffer, depth: number): void {
  expect(actual.length).toBe(expected.length);
  for (let index = 0; index < actual.length; index += 4) {
    const actualPixel = [...actual.subarray(index, index + 4)];
    const expectedPixel = [...expected.subarray(index, index + 4)];
    if (expectedPixel[3] === 0 && actualPixel[3] === 0) continue;
    for (let channel = 0; channel < 4; channel++) {
      expect(Math.abs(actualPixel[channel]! - expectedPixel[channel]!)).toBeLessThanOrEqual(
        depth === 16 ? 1 : 0,
      );
    }
  }
}

describe('PNG codec', () => {
  test.each(
    FORMATS.flatMap((format) => [
      {...format, interlaced: false},
      {...format, interlaced: true},
    ]),
  )('decodes color type $colorType at $depth bits (interlaced: $interlaced)', async (format) => {
    for (const [width, height] of [
      [1, 1],
      [3, 7],
      [13, 9],
    ] as const) {
      const transparency =
        format.colorType === 3
          ? randomBytes(Math.min(100, 2 ** format.depth - 1), width)
          : format.colorType === 0
            ? Buffer.from([0, 1])
            : format.colorType === 2
              ? Buffer.from([0, 1, 0, 2, 0, 3])
              : undefined;
      const source = createPNG({...format, width, height, transparency, seed: width * height});
      const actual = decodePNG(source);
      expect(actual.width).toBe(width);
      expect(actual.height).toBe(height);
      expectPixelsToMatchReference(actual.data, await decodeReference(source), format.depth);
    }
  });

  test('applies grayscale and truecolor transparency keys', () => {
    const gray = createPNG({
      width: 1,
      height: 1,
      depth: 8,
      colorType: 0,
      interlaced: false,
      seed: 1,
    });
    const value = decodePNG(gray).data[0]!;
    const transparent = createPNG({
      width: 1,
      height: 1,
      depth: 8,
      colorType: 0,
      interlaced: false,
      transparency: Buffer.from([0, value]),
      seed: 1,
    });
    expect([...decodePNG(transparent).data]).toEqual([0, 0, 0, 0]);
  });

  test.each([0, 3, 6, 9])('encodes RGBA pixels losslessly at level %i', async (level) => {
    const image = {width: 17, height: 11, data: randomBytes(17 * 11 * 4, level + 1)};
    image.data.fill(255, 0, 200);
    const encoded = encodePNG(image, level);
    expect(decodePNG(encoded).data.equals(image.data)).toBe(true);
    expect((await decodeReference(encoded)).equals(image.data)).toBe(true);
  });

  test('keeps encoded output stable', () => {
    const image = {width: 3, height: 2, data: randomBytes(3 * 2 * 4, 42)};
    expect(encodePNG(image, 9).toString('base64')).toMatchInlineSnapshot(
      `"iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAYAAACddGYaAAAAI0lEQVR4AWPs7JTJv71t+v/HO0QNmFLTzBL+PRLhr2L7YAIAo94LsPxq/PcAAAAASUVORK5CYII="`,
    );
  });

  test('rejects malformed input', () => {
    const valid = createPNG({
      width: 4,
      height: 4,
      depth: 8,
      colorType: 6,
      interlaced: false,
      seed: 3,
    });
    const badChecksum = Buffer.from(valid);
    badChecksum[20] ^= 1;
    const badFilter = createPNG({
      width: 1,
      height: 1,
      depth: 8,
      colorType: 0,
      interlaced: false,
      seed: 3,
    });
    const missingPalette = Buffer.concat([
      valid.subarray(0, 8),
      chunk('IHDR', Buffer.from([0, 0, 0, 1, 0, 0, 0, 1, 8, 3, 0, 0, 0])),
      chunk('IDAT', deflateSync(Buffer.from([0, 0]))),
      chunk('IEND', Buffer.alloc(0)),
    ]);
    const unknownCritical = Buffer.concat([
      valid.subarray(0, 33),
      chunk('ABCD', Buffer.alloc(0)),
      valid.subarray(33),
    ]);
    const shortData = Buffer.concat([
      valid.subarray(0, 33),
      chunk('IDAT', deflateSync(Buffer.alloc(4))),
      chunk('IEND', Buffer.alloc(0)),
    ]);
    const badFilterData = Buffer.concat([
      badFilter.subarray(0, 33),
      chunk('IDAT', deflateSync(Buffer.from([5, 0]))),
      chunk('IEND', Buffer.alloc(0)),
    ]);
    for (const source of [
      Buffer.from('not a png'),
      badChecksum,
      valid.subarray(0, valid.length - 4),
      missingPalette,
      unknownCritical,
      shortData,
      badFilterData,
    ]) {
      expect(() => decodePNG(source)).toThrow();
    }
  });
});
