import {deflateSync, inflateSync} from 'node:zlib';

import type {RGBAImage} from './pixels';

const SIGNATURE = '89504e470d0a1a0a';
// Adam7 passes as [x start, y start, x step, y step].
const PASSES: readonly (readonly [number, number, number, number])[] = [
  [0, 0, 8, 8],
  [4, 0, 8, 8],
  [0, 4, 4, 8],
  [2, 0, 4, 4],
  [0, 2, 2, 4],
  [1, 0, 2, 2],
  [0, 1, 1, 2],
];
let crcTable: Int32Array | undefined;

// Filter results of one pixel, which depend only on the pixel and its left, upper, and upper-left
// neighbors. QR codes have few colors, so few such pixel combinations repeat across the image.
const CACHE_BITS = 10;
// Per 16-word entry: the pixel and neighbor words, the absolute differences for None, Sub, Up,
// Average, and Paeth, then the Sub, Up, Average, and Paeth bytes as words. Zeros are a valid entry.
const cache = new Int32Array(16 << CACHE_BITS);
const pixelWords = new Int32Array(8);
const pixelBytes = new Uint8Array(pixelWords.buffer);

/** Encodes 8-bit RGBA pixels with adaptive per-row filtering. */
export function encodePNG({width, height, data}: RGBAImage, level: number): Buffer {
  const byteWidth = width * 4;
  // Pixels are compared as 32-bit words. The renderer allocates them aligned.
  const words = new Int32Array(data.buffer, data.byteOffset, width * height);
  // The row above the first row reads as zeros.
  const zeros = new Int32Array(width);
  // The row filtered with Sub, Up, Average, and Paeth.
  const rows = new Int32Array(width * 4);
  const rowBytes = new Uint8Array(rows.buffer);
  const filtered = Buffer.alloc((byteWidth + 1) * height);
  for (let y = 0, position = 0; y < height; y++, position += byteWidth) {
    const row = y * (byteWidth + 1);
    // Module rows repeat for the module size. The Up filter turns a repeated row into zeros,
    // which `filtered` already holds.
    if (
      y > 0 &&
      data.compare(data, position - byteWidth, position, position, position + byteWidth) === 0
    ) {
      filtered[row] = 2;
      continue;
    }
    const filter = filterRow(
      words,
      y * width,
      y > 0 ? words : zeros,
      y > 0 ? (y - 1) * width : 0,
      width,
      rows,
    );
    filtered[row] = filter;
    if (filter === 0) data.copy(filtered, row + 1, position, position + byteWidth);
    else filtered.set(rowBytes.subarray((filter - 1) * byteWidth, filter * byteWidth), row + 1);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from(SIGNATURE, 'hex'),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(filtered, {chunkSize: 32 * 1024, level, strategy: 3})),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Decodes any standard PNG into 8-bit RGBA pixels. */
export function decodePNG(source: Buffer): RGBAImage {
  if (source.toString('hex', 0, 8) !== SIGNATURE) throw new Error('Invalid PNG signature');
  let width = 0;
  let height = 0;
  let depth = 0;
  let colorType = 0;
  let interlaced = false;
  let palette: Buffer | undefined;
  let transparency: Buffer | undefined;
  const compressed: Buffer[] = [];
  for (let offset = 8, type = ''; type !== 'IEND';) {
    const end = offset + 8 + source.readUInt32BE(offset);
    type = source.toString('latin1', offset + 4, offset + 8);
    const data = source.subarray(offset + 8, end);
    if (crc32(source.subarray(offset + 4, end)) !== source.readUInt32BE(end)) {
      throw new Error(`Invalid ${type} checksum`);
    }
    offset = end + 4;
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      depth = data[8]!;
      colorType = data[9]!;
      interlaced = data[12] === 1;
      if (
        ![1, 2, 4, 8, 16].includes(depth) ||
        ![0, 2, 3, 4, 6].includes(colorType) ||
        data[10] !== 0 ||
        data[11] !== 0 ||
        data[12]! > 1
      ) {
        throw new Error('Unsupported PNG header');
      }
    } else if (width === 0) {
      throw new Error('Expected IHDR');
    } else if (type === 'PLTE') {
      palette = data;
    } else if (type === 'tRNS') {
      transparency = data;
    } else if (type === 'IDAT') {
      compressed.push(data);
    } else if (!(type.charCodeAt(0) & 0x20) && type !== 'IEND') {
      throw new Error(`Unsupported critical chunk ${type}`);
    }
  }
  if (colorType === 3 && !palette) throw new Error('Missing PNG palette');

  const channels = [1, 0, 3, 1, 2, 0, 4][colorType]!;
  const bitsPerPixel = channels * depth;
  const filterWidth = Math.max(1, bitsPerPixel >> 3);
  const maximum = 2 ** depth - 1;
  const passes = interlaced ? PASSES : ([[0, 0, 1, 1]] as const);
  const passSize = (size: number, start: number, step: number) =>
    size > start ? Math.ceil((size - start) / step) : 0;
  let expectedLength = 0;
  for (const [startX, startY, stepX, stepY] of passes) {
    const passWidth = passSize(width, startX, stepX);
    if (passWidth > 0) {
      expectedLength +=
        passSize(height, startY, stepY) * (((passWidth * bitsPerPixel + 7) >> 3) + 1);
    }
  }
  const raw = inflateSync(Buffer.concat(compressed), {maxOutputLength: expectedLength || 1});
  if (raw.length !== expectedLength) throw new Error('Invalid PNG data length');

  const pixels = Buffer.alloc(width * height * 4);
  const sample = (row: Buffer, index: number): number =>
    depth === 16
      ? row.readUInt16BE(index * 2)
      : depth === 8
        ? row[index]!
        : (row[(index * depth) >> 3]! >> (8 - depth - ((index * depth) & 7))) & maximum;
  const scale = (value: number) =>
    depth === 8 ? value : Math.floor((value * 255) / maximum + 0.5);
  let position = 0;
  for (const [startX, startY, stepX, stepY] of passes) {
    const passWidth = passSize(width, startX, stepX);
    const passHeight = passWidth > 0 ? passSize(height, startY, stepY) : 0;
    const byteWidth = (passWidth * bitsPerPixel + 7) >> 3;
    let previous: Buffer | undefined;
    for (let y = 0; y < passHeight; y++) {
      const filter = raw[position]!;
      if (filter > 4) throw new Error('Invalid PNG filter');
      const row = raw.subarray(position + 1, position + 1 + byteWidth);
      for (let x = 0; x < byteWidth; x++) {
        const left = x >= filterWidth ? row[x - filterWidth]! : 0;
        const up = previous ? previous[x]! : 0;
        const upLeft = previous && x >= filterWidth ? previous[x - filterWidth]! : 0;
        row[x] = row[x]! + predict(filter, left, up, upLeft);
      }
      for (let x = 0; x < passWidth; x++) {
        const target = ((startY + y * stepY) * width + startX + x * stepX) * 4;
        let red: number;
        let green: number;
        let blue: number;
        let alpha: number;
        if (colorType === 3) {
          const index = sample(row, x);
          if (index * 3 + 3 > palette!.length) throw new Error('Invalid PNG palette index');
          red = palette![index * 3]!;
          green = palette![index * 3 + 1]!;
          blue = palette![index * 3 + 2]!;
          alpha = transparency?.[index] ?? 255;
        } else {
          const color = colorType & 2;
          red = sample(row, x * channels);
          green = color ? sample(row, x * channels + 1) : red;
          blue = color ? sample(row, x * channels + 2) : red;
          alpha = colorType & 4 ? sample(row, x * channels + (color ? 3 : 1)) : maximum;
          if (
            transparency &&
            red === transparency.readUInt16BE(0) &&
            (!color ||
              (green === transparency.readUInt16BE(2) && blue === transparency.readUInt16BE(4)))
          ) {
            red = green = blue = alpha = 0;
          }
          red = scale(red);
          green = scale(green);
          blue = scale(blue);
          alpha = scale(alpha);
        }
        pixels[target] = red;
        pixels[target + 1] = green;
        pixels[target + 2] = blue;
        pixels[target + 3] = alpha;
      }
      previous = row;
      position += byteWidth + 1;
    }
  }
  return {width, height, data: pixels};
}

/**
 * Filters one row with every filter except None into `rows` and returns the filter with the
 * smallest sum of absolute signed differences, preferring the lower filter type on ties.
 */
function filterRow(
  words: Int32Array,
  start: number,
  previous: Int32Array,
  above: number,
  width: number,
  rows: Int32Array,
): number {
  let none = 0;
  let sub = 0;
  let up = 0;
  let average = 0;
  let paeth = 0;
  let left = 0;
  let upLeft = 0;
  for (let pixel = 0; pixel < width;) {
    const value = words[start + pixel]!;
    const upper = previous[above + pixel]!;
    let end = pixel + 1;
    while (end < width && words[start + end] === value && previous[above + end] === upper) end++;
    // In a run of equal pixels below equal pixels, only the first pixel has other neighbors.
    let entry = cacheEntry(value, left, upper, upLeft);
    none += cache[entry + 4]!;
    sub += cache[entry + 5]!;
    up += cache[entry + 6]!;
    average += cache[entry + 7]!;
    paeth += cache[entry + 8]!;
    rows[pixel] = cache[entry + 9]!;
    rows[width + pixel] = cache[entry + 10]!;
    rows[width * 2 + pixel] = cache[entry + 11]!;
    rows[width * 3 + pixel] = cache[entry + 12]!;
    pixel++;
    const count = end - pixel;
    let filteredSub = 0;
    let filteredUp = 0;
    let filteredAverage = 0;
    let filteredPaeth = 0;
    if (count > 0 && value === upper) {
      // Every filter except None turns the pixel into zeros.
      none +=
        ((value & 255) + ((value >> 8) & 255) + ((value >> 16) & 255) + (value >>> 24)) * count;
    } else if (count > 0) {
      entry = cacheEntry(value, value, upper, upper);
      none += cache[entry + 4]! * count;
      sub += cache[entry + 5]! * count;
      up += cache[entry + 6]! * count;
      average += cache[entry + 7]! * count;
      paeth += cache[entry + 8]! * count;
      filteredSub = cache[entry + 9]!;
      filteredUp = cache[entry + 10]!;
      filteredAverage = cache[entry + 11]!;
      filteredPaeth = cache[entry + 12]!;
    }
    for (; pixel < end; pixel++) {
      rows[pixel] = filteredSub;
      rows[width + pixel] = filteredUp;
      rows[width * 2 + pixel] = filteredAverage;
      rows[width * 3 + pixel] = filteredPaeth;
    }
    left = value;
    upLeft = upper;
  }
  let filter = 0;
  let minimum = none;
  if (sub < minimum) {
    filter = 1;
    minimum = sub;
  }
  if (up < minimum) {
    filter = 2;
    minimum = up;
  }
  if (average < minimum) {
    filter = 3;
    minimum = average;
  }
  return paeth < minimum ? 4 : filter;
}

/** Returns the cache offset of a pixel's filter results, computing them on a miss. */
function cacheEntry(value: number, left: number, up: number, upLeft: number): number {
  let hash =
    Math.imul(value, -1640531535) ^
    Math.imul(left, -2048144777) ^
    Math.imul(up, -1028477379) ^
    Math.imul(upLeft, 668265263);
  hash = Math.imul(hash ^ (hash >>> 15), 739982445);
  const entry = (hash >>> (32 - CACHE_BITS)) << 4;
  if (
    value === cache[entry] &&
    left === cache[entry + 1] &&
    up === cache[entry + 2] &&
    upLeft === cache[entry + 3]
  ) {
    return entry;
  }
  return computeEntry(entry, value, left, up, upLeft);
}

function computeEntry(
  entry: number,
  value: number,
  left: number,
  up: number,
  upLeft: number,
): number {
  pixelWords[0] = value;
  pixelWords[1] = left;
  pixelWords[2] = up;
  pixelWords[3] = upLeft;
  let none = 0;
  let sub = 0;
  let upSum = 0;
  let average = 0;
  let paeth = 0;
  for (let channel = 0; channel < 4; channel++) {
    const x = pixelBytes[channel]!;
    const a = pixelBytes[4 + channel]!;
    const b = pixelBytes[8 + channel]!;
    const c = pixelBytes[12 + channel]!;
    const prediction = paethPredictor(a, b, c);
    none += x;
    sub += Math.abs(x - a);
    upSum += Math.abs(x - b);
    average += Math.abs(x - ((a + b) >> 1));
    paeth += Math.abs(x - prediction);
    pixelBytes[16 + channel] = x - a;
    pixelBytes[20 + channel] = x - b;
    pixelBytes[24 + channel] = x - ((a + b) >> 1);
    pixelBytes[28 + channel] = x - prediction;
  }
  pixelWords[0] = none;
  pixelWords[1] = sub;
  pixelWords[2] = upSum;
  pixelWords[3] = average;
  cache.set(pixelWords.subarray(0, 4), entry + 4);
  cache[entry + 8] = paeth;
  cache.set(pixelWords.subarray(4), entry + 9);
  cache[entry] = value;
  cache[entry + 1] = left;
  cache[entry + 2] = up;
  cache[entry + 3] = upLeft;
  return entry;
}

function paethPredictor(left: number, up: number, upLeft: number): number {
  const leftDistance = up > upLeft ? up - upLeft : upLeft - up;
  const upDistance = left > upLeft ? left - upLeft : upLeft - left;
  const estimate = left + up - upLeft - upLeft;
  const upLeftDistance = estimate < 0 ? -estimate : estimate;
  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
  return upDistance <= upLeftDistance ? up : upLeft;
}

function predict(type: number, left: number, up: number, upLeft: number): number {
  if (type === 1) return left;
  if (type === 2) return up;
  if (type === 3) return (left + up) >> 1;
  return type === 4 ? paethPredictor(left, up, upLeft) : 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const result = Buffer.alloc(data.length + 12);
  result.writeUInt32BE(data.length, 0);
  result.write(type, 4, 'latin1');
  data.copy(result, 8);
  result.writeUInt32BE(crc32(result.subarray(4, data.length + 8)), data.length + 8);
  return result;
}

function crc32(data: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Int32Array(256);
    for (let index = 0; index < 256; index++) {
      let value = index;
      for (let bit = 0; bit < 8; bit++)
        value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      crcTable[index] = value;
    }
  }
  let crc = -1;
  for (let index = 0; index < data.length; index++) {
    crc = crcTable[(crc ^ data[index]!) & 255]! ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}
