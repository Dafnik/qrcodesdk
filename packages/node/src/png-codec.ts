import {deflateSync, inflateSync} from 'node:zlib';

export type PNGImage = {width: number; height: number; data: Buffer};

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

/** Encodes 8-bit RGBA pixels with adaptive per-row filtering. */
export function encodePNG({width, height, data}: PNGImage, level: number): Buffer {
  const byteWidth = width * 4;
  const filtered = Buffer.alloc((byteWidth + 1) * height);
  for (let y = 0, position = 0; y < height; y++, position += byteWidth) {
    let filter = 0;
    let minimum = Infinity;
    for (let type = 0; type < 5; type++) {
      let sum = 0;
      for (let x = 0; x < byteWidth; x++) {
        sum += Math.abs(filterDelta(type, data, position, x, byteWidth, 4, y > 0));
      }
      if (sum < minimum) {
        filter = type;
        minimum = sum;
      }
    }
    const row = y * (byteWidth + 1);
    filtered[row] = filter;
    for (let x = 0; x < byteWidth; x++) {
      filtered[row + 1 + x] = filterDelta(filter, data, position, x, byteWidth, 4, y > 0);
    }
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
export function decodePNG(source: Buffer): PNGImage {
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

function filterDelta(
  type: number,
  data: Buffer,
  position: number,
  x: number,
  byteWidth: number,
  bytesPerPixel: number,
  hasPrevious: boolean,
): number {
  const left = x >= bytesPerPixel ? data[position + x - bytesPerPixel]! : 0;
  const up = hasPrevious ? data[position + x - byteWidth]! : 0;
  const upLeft =
    hasPrevious && x >= bytesPerPixel ? data[position + x - byteWidth - bytesPerPixel]! : 0;
  return data[position + x]! - predict(type, left, up, upLeft);
}

function predict(type: number, left: number, up: number, upLeft: number): number {
  if (type === 1) return left;
  if (type === 2) return up;
  if (type === 3) return (left + up) >> 1;
  if (type !== 4) return 0;
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upLeftDistance = Math.abs(estimate - upLeft);
  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
  return upDistance <= upLeftDistance ? up : upLeft;
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
