import {type RGBAImage, pixelWords as viewPixelWords} from './types';

/** Compresses filtered PNG rows into a zlib stream. */
export type Deflate = (data: Uint8Array) => Uint8Array;
/** Decompresses a zlib stream, throwing when it would exceed `maxOutputLength` bytes. */
export type Inflate = (data: Uint8Array, maxOutputLength: number) => Uint8Array;

/** Decoded RGBA pixels, which callers may modify. */
export type DecodedImage = {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8Array;
};

export const MAX_PNG_PIXELS = 16_777_216;

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const BIT_DEPTHS_BY_COLOR_TYPE: Readonly<Partial<Record<number, readonly number[]>>> = {
  0: [1, 2, 4, 8, 16],
  2: [8, 16],
  3: [1, 2, 4, 8],
  4: [8, 16],
  6: [8, 16],
};
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
export function encodePNG(image: RGBAImage, deflate: Deflate): Uint8Array {
  const {width, height, data} = image;
  const byteWidth = width * 4;
  const {words} = viewPixelWords(image);
  // The row above the first row reads as zeros.
  const zeros = new Int32Array(width);
  // The row filtered with Sub, Up, Average, and Paeth.
  const rows = new Int32Array(width * 4);
  const rowBytes = new Uint8Array(rows.buffer);
  const filtered = new Uint8Array((byteWidth + 1) * height);
  for (let y = 0, position = 0; y < height; y++, position += byteWidth) {
    const row = y * (byteWidth + 1);
    // Module rows repeat for the module size. The Up filter turns a repeated row into zeros,
    // which `filtered` already holds.
    if (y > 0 && repeatsPreviousRow(data, position, byteWidth)) {
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
    if (filter === 0) filtered.set(data.subarray(position, position + byteWidth), row + 1);
    else filtered.set(rowBytes.subarray((filter - 1) * byteWidth, filter * byteWidth), row + 1);
  }
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header[8] = 8;
  header[9] = 6;
  return concat([
    Uint8Array.from(SIGNATURE),
    chunk('IHDR', header),
    chunk('IDAT', deflate(filtered)),
    chunk('IEND', new Uint8Array(0)),
  ]);
}

/** Decodes any standard PNG into 8-bit RGBA pixels. */
export function decodePNG(source: Uint8Array, inflate: Inflate): DecodedImage {
  if (!hasSignature(source)) throw new Error('Invalid PNG signature');
  let sawHeader = false;
  let width = 0;
  let height = 0;
  let depth = 0;
  let colorType = 0;
  let interlaced = false;
  let palette: Uint8Array | undefined;
  let transparency: Uint8Array | undefined;
  const compressed: Uint8Array[] = [];
  for (let offset = 8, type = ''; type !== 'IEND';) {
    const end = offset + 8 + readUint32(source, offset);
    type = String.fromCharCode(...readBytes(source, offset + 4, offset + 8));
    const data = source.subarray(offset + 8, end);
    if (crc32(source.subarray(offset + 4, end)) !== readUint32(source, end)) {
      throw new Error(`Invalid ${type} checksum`);
    }
    offset = end + 4;
    if (type === 'IHDR') {
      if (sawHeader || data.length !== 13) throw new Error('Invalid PNG IHDR');
      sawHeader = true;
      width = readUint32(data, 0);
      height = readUint32(data, 4);
      if (width === 0 || height === 0 || width * height > MAX_PNG_PIXELS) {
        throw new Error('Invalid PNG dimensions');
      }
      depth = data[8]!;
      colorType = data[9]!;
      interlaced = data[12] === 1;
      if (
        !BIT_DEPTHS_BY_COLOR_TYPE[colorType]?.includes(depth) ||
        data[10] !== 0 ||
        data[11] !== 0 ||
        data[12]! > 1
      ) {
        throw new Error('Unsupported PNG header');
      }
    } else if (!sawHeader) {
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
  const raw = inflate(concat(compressed), expectedLength || 1);
  if (raw.length !== expectedLength) throw new Error('Invalid PNG data length');

  const pixels = new Uint8Array(width * height * 4);
  const sample = (row: Uint8Array, index: number): number =>
    depth === 16
      ? readUint16(row, index * 2)
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
    let previous: Uint8Array | undefined;
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
            red === readUint16(transparency, 0) &&
            (!color ||
              (green === readUint16(transparency, 2) && blue === readUint16(transparency, 4)))
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

/** Reads the dimensions from a PNG header, or returns `undefined` when there is none. */
export function readPNGDimensions(
  source: Uint8Array,
): {readonly width: number; readonly height: number} | undefined {
  if (
    source.length < 24 ||
    !hasSignature(source) ||
    readUint32(source, 8) !== 13 ||
    String.fromCharCode(...source.subarray(12, 16)) !== 'IHDR'
  ) {
    return undefined;
  }
  return {width: readUint32(source, 16), height: readUint32(source, 20)};
}

function hasSignature(source: Uint8Array): boolean {
  return source.length >= 8 && SIGNATURE.every((value, index) => source[index] === value);
}

function repeatsPreviousRow(data: ArrayLike<number>, position: number, byteWidth: number): boolean {
  for (let x = 0; x < byteWidth; x++) {
    if (data[position + x] !== data[position + x - byteWidth]) return false;
  }
  return true;
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

function chunk(type: string, data: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length + 12);
  const view = new DataView(result.buffer);
  view.setUint32(0, data.length);
  for (let index = 0; index < 4; index++) result[4 + index] = type.charCodeAt(index);
  result.set(data, 8);
  view.setUint32(data.length + 8, crc32(result.subarray(4, data.length + 8)));
  return result;
}

function concat(parts: readonly Uint8Array[]): Uint8Array {
  let length = 0;
  for (const part of parts) length += part.length;
  const result = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

/** Reads bytes, throwing when the range ends past the source. */
function readBytes(source: Uint8Array, start: number, end: number): Uint8Array {
  if (end > source.length) throw new RangeError('PNG data ends unexpectedly');
  return source.subarray(start, end);
}

function readUint16(source: Uint8Array, offset: number): number {
  const [high, low] = readBytes(source, offset, offset + 2);
  return (high! << 8) | low!;
}

function readUint32(source: Uint8Array, offset: number): number {
  const [first, second, third, fourth] = readBytes(source, offset, offset + 4);
  return ((first! << 24) | (second! << 16) | (third! << 8) | fourth!) >>> 0;
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
