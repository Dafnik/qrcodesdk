import {QRCodeError} from '../error';
import {BitWriter, huffmanCodeLengths, reversedCanonicalCodes} from './huffman';
import {type RGBAImage, pixelWords} from './types';

const MAX_DIMENSION = 16_384;
const LITERAL_CODES = 256;
const LENGTH_CODES = 24;
const DISTANCE_CODES = 40;
const MAX_COPY_LENGTH = 4096;
// The 40 distance prefix codes reach 2^20, and the first 120 distance codes name nearby pixels.
const MAX_COPY_DISTANCE = (1 << 20) - 120;
const WINDOW_MASK = (1 << 20) - 1;
const MIN_COPY_LENGTH = 3;
const HASH_BITS = 16;
const MAX_CHAIN_LENGTH = 32;
const MAX_CODE_LENGTH = 15;
const MAX_CODE_LENGTH_CODE_LENGTH = 7;
const CODE_LENGTH_ORDER = [17, 18, 0, 1, 2, 3, 4, 5, 16, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

type PrefixCode = {readonly codes: Uint16Array; readonly lengths: Uint8Array};

/**
 * Encodes RGBA pixels as a lossless WebP (VP8L) image. Images with up to 256 colors use the
 * color-indexing transform, and repeated rows become backward references to the row above.
 */
export function encodeWebP({width, height, data}: RGBAImage): Uint8Array {
  if (!isDimension(width) || !isDimension(height)) {
    throw new QRCodeError(
      'RENDER_FAILED',
      `WebP output must be 1 to ${MAX_DIMENSION} pixels wide and high, received ${width} x ${height}`,
    );
  }
  const {bytes, words} = pixelWords({width, height, data});
  const [colors, alphaIsUsed] = collectColors(bytes, words);
  const writer = new BitWriter();
  writer.write(0x2f, 8);
  writer.write(width - 1, 14);
  writer.write(height - 1, 14);
  writer.write(alphaIsUsed ? 1 : 0, 1);
  writer.write(0, 3);

  let xsize = width;
  let pixels: Int32Array;
  if (colors) {
    const palette = new Int32Array(new Uint32Array(Array.from(colors)).sort().buffer);
    // Color-indexing transform. The color table is stored as differences between entries.
    writer.write(1, 1);
    writer.write(3, 2);
    writer.write(palette.length - 1, 8);
    const table = new Int32Array(palette.length);
    for (let index = 0; index < palette.length; index++) {
      table[index] = subtractPixels(palette[index]!, index === 0 ? 0 : palette[index - 1]!);
    }
    writeEntropyCodedImage(writer, table, palette.length, false);
    // Up to 16 colors pack several indices into one pixel.
    const bits = palette.length <= 2 ? 3 : palette.length <= 4 ? 2 : palette.length <= 16 ? 1 : 0;
    xsize = (width + (1 << bits) - 1) >> bits;
    pixels = bundlePixels(bytes, words, width, height, palette, bits);
  } else {
    // Subtract-green transform.
    writer.write(1, 1);
    writer.write(2, 2);
    pixels = new Int32Array(words.length);
    for (let index = 0; index < pixels.length; index++) {
      const pixel = colorAt(bytes, index);
      const green = (pixel >>> 8) & 0xff;
      pixels[index] =
        (pixel & 0xff00ff00) |
        (((((pixel >>> 16) & 0xff) - green) & 0xff) << 16) |
        ((pixel - green) & 0xff);
    }
  }
  writer.write(0, 1);
  writeEntropyCodedImage(writer, pixels, xsize, true);

  const bitstream = writer.finish();
  const padding = bitstream.length & 1;
  // A RIFF file with a `WEBP` form and one `VP8L` chunk, padded to an even length.
  const output = new Uint8Array(20 + bitstream.length + padding);
  const uint32 = (value: number) => [value, value >> 8, value >> 16, value >> 24];
  output.set([
    0x52,
    0x49,
    0x46,
    0x46,
    ...uint32(output.length - 8),
    0x57,
    0x45,
    0x42,
    0x50,
    0x56,
    0x50,
    0x38,
    0x4c,
    ...uint32(bitstream.length),
  ]);
  output.set(bitstream, 20);
  return output;
}

function isDimension(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 1 && value <= MAX_DIMENSION;
}

/**
 * Collects the colors unless there are more than 256, and checks for transparent pixels. The colors
 * are signed integers, which are small integers for opaque colors.
 */
function collectColors(
  bytes: RGBAImage['data'],
  words: Int32Array,
): [colors: Set<number> | undefined, alphaIsUsed: boolean] {
  let colors: Set<number> | undefined = new Set();
  let alphaIsUsed = false;
  for (let index = 0, previous = ~words[0]!; index < words.length; index++) {
    // Pixels repeat in runs, so each run is read once.
    if (words[index] === previous) continue;
    previous = words[index]!;
    const color = colorAt(bytes, index);
    alphaIsUsed ||= color >>> 24 !== 255;
    if (colors && colors.add(color).size > 256) colors = undefined;
  }
  return [colors, alphaIsUsed];
}

/** Returns the pixel at `index` with alpha in the top byte, as a signed integer. */
function colorAt(bytes: RGBAImage['data'], index: number): number {
  const offset = index * 4;
  return (
    (bytes[offset + 3]! << 24) |
    (bytes[offset]! << 16) |
    (bytes[offset + 1]! << 8) |
    bytes[offset + 2]!
  );
}

function subtractPixels(left: number, right: number): number {
  // Subtracts each byte modulo 256: the high bits are set on the left and cleared on the right, so
  // no byte borrows from the next one, and are fixed afterwards.
  return ((left | 0x80808080) - (right & 0x7f7f7f7f)) ^ ((left ^ ~right) & 0x80808080);
}

/** Replaces pixels with palette indices in the green channel, packing `8 >> bits` bits each. */
function bundlePixels(
  bytes: RGBAImage['data'],
  words: Int32Array,
  width: number,
  height: number,
  palette: Int32Array,
  bits: number,
): Int32Array {
  const indices = new Map<number, number>();
  palette.forEach((color, index) => indices.set(color, index));
  const xsize = (width + (1 << bits) - 1) >> bits;
  const bitsPerPixel = 8 >> bits;
  const bundled = new Int32Array(xsize * height);
  let previous = ~words[0]!;
  let previousIndex = 0;
  for (let source = 0, target = 0; target < bundled.length; source += width) {
    for (let x = 0; x < width; target++) {
      // Opaque black with the indices in the green channel.
      let packed = 0xff000000 | 0;
      for (let shift = 8; shift < 16 && x < width; shift += bitsPerPixel, x++) {
        if (words[source + x] !== previous) {
          previous = words[source + x]!;
          previousIndex = indices.get(colorAt(bytes, source + x))!;
        }
        packed |= previousIndex << shift;
      }
      bundled[target] = packed;
    }
  }
  return bundled;
}

function writeEntropyCodedImage(
  writer: BitWriter,
  pixels: Int32Array,
  xsize: number,
  isMainImage: boolean,
): void {
  // No color cache.
  writer.write(0, 1);
  // One prefix code group for the whole image.
  if (isMainImage) writer.write(0, 1);

  const tokens = findBackwardReferences(pixels, xsize);
  const green = new Uint32Array(LITERAL_CODES + LENGTH_CODES);
  const red = new Uint32Array(LITERAL_CODES);
  const blue = new Uint32Array(LITERAL_CODES);
  const alpha = new Uint32Array(LITERAL_CODES);
  const distance = new Uint32Array(DISTANCE_CODES);
  for (let index = 0; index < tokens.length; index += 2) {
    const length = tokens[index]!;
    const value = tokens[index + 1]!;
    if (length === 0) {
      green[(value >>> 8) & 0xff]!++;
      red[(value >>> 16) & 0xff]!++;
      blue[value & 0xff]!++;
      alpha[value >>> 24]!++;
    } else {
      green[LITERAL_CODES + prefixSymbol(length)]!++;
      distance[prefixSymbol(value)]!++;
    }
  }
  const greenCode = writePrefixCode(writer, green);
  const redCode = writePrefixCode(writer, red);
  const blueCode = writePrefixCode(writer, blue);
  const alphaCode = writePrefixCode(writer, alpha);
  const distanceCode = writePrefixCode(writer, distance);

  for (let index = 0; index < tokens.length; index += 2) {
    const length = tokens[index]!;
    const value = tokens[index + 1]!;
    if (length === 0) {
      writeSymbol(writer, greenCode, (value >>> 8) & 0xff);
      writeSymbol(writer, redCode, (value >>> 16) & 0xff);
      writeSymbol(writer, blueCode, value & 0xff);
      writeSymbol(writer, alphaCode, value >>> 24);
    } else {
      const lengthSymbol = prefixSymbol(length);
      writeSymbol(writer, greenCode, LITERAL_CODES + lengthSymbol);
      writePrefixExtraBits(writer, lengthSymbol, length);
      const distanceSymbol = prefixSymbol(value);
      writeSymbol(writer, distanceCode, distanceSymbol);
      writePrefixExtraBits(writer, distanceSymbol, value);
    }
  }
}

/**
 * Greedy LZ77 over the pixel stream. Tokens are `[0, pixel]` literals or `[length, distance
 * code]` copies.
 */
function findBackwardReferences(pixels: Int32Array, xsize: number): number[] {
  const count = pixels.length;
  const tokens: number[] = [];
  const head = new Int32Array(1 << HASH_BITS).fill(-1);
  const chain = new Int32Array(Math.min(count, WINDOW_MASK + 1));
  // Hashes two pixels; matches are verified pixel by pixel.
  const hashAt = (position: number) =>
    (Math.imul(pixels[position]!, 0x1e35a7bd) ^ Math.imul(pixels[position + 1]!, 0x5bd1e995)) >>>
    (32 - HASH_BITS);
  const insert = (position: number) => {
    if (position + 1 >= count) return;
    const hash = hashAt(position);
    chain[position & WINDOW_MASK] = head[hash]!;
    head[hash] = position;
  };

  for (let position = 0; position < count;) {
    const maxLength = Math.min(MAX_COPY_LENGTH, count - position);
    let bestLength = 0;
    let bestDistance = 0;
    const consider = (distance: number) => {
      const source = position - distance;
      // Only a longer match counts, which needs the pixel after the best length to match.
      if (pixels[source + bestLength] !== pixels[position + bestLength]) return;
      let length = 0;
      while (length < maxLength && pixels[source + length] === pixels[position + length]) length++;
      if (length > bestLength) {
        bestLength = length;
        bestDistance = distance;
      }
    };
    // Repeated rows and runs are the most common matches, and have the shortest distance codes.
    if (xsize <= position) consider(xsize);
    if (bestLength < maxLength && position > 0) consider(1);
    if (bestLength < maxLength && position + 1 < count) {
      let candidate = head[hashAt(position)]!;
      for (
        let steps = 0;
        candidate >= 0 && position - candidate <= MAX_COPY_DISTANCE && steps < MAX_CHAIN_LENGTH;
        steps++
      ) {
        consider(position - candidate);
        if (bestLength === maxLength) break;
        candidate = chain[candidate & WINDOW_MASK]!;
      }
    }

    if (bestLength >= MIN_COPY_LENGTH) {
      tokens.push(bestLength, toDistanceCode(bestDistance, xsize));
      for (let offset = 0; offset < bestLength; offset++) insert(position + offset);
      position += bestLength;
    } else {
      tokens.push(0, pixels[position]!);
      insert(position);
      position++;
    }
  }
  return tokens;
}

function toDistanceCode(distance: number, xsize: number): number {
  // Codes 1 and 2 name the pixel above and the pixel to the left.
  if (distance === xsize) return 1;
  if (distance === 1) return 2;
  return distance + 120;
}

function prefixSymbol(value: number): number {
  const offset = value - 1;
  if (offset < 4) return offset;
  const highestBit = 31 - Math.clz32(offset);
  return 2 * highestBit + ((offset >>> (highestBit - 1)) & 1);
}

function writePrefixExtraBits(writer: BitWriter, symbol: number, value: number): void {
  if (symbol < 4) return;
  const bits = (symbol - 2) >> 1;
  writer.write((value - 1) & ((1 << bits) - 1), bits);
}

function writeSymbol(writer: BitWriter, code: PrefixCode, symbol: number): void {
  writer.write(code.codes[symbol]!, code.lengths[symbol]!);
}

function writePrefixCode(writer: BitWriter, histogram: Uint32Array): PrefixCode {
  const symbols: number[] = [];
  for (let symbol = 0; symbol < histogram.length; symbol++) {
    if (histogram[symbol]! > 0) symbols.push(symbol);
  }

  if (symbols.length <= 2 && symbols.every((symbol) => symbol < LITERAL_CODES)) {
    // Simple code: one symbol takes no bits, two symbols take one bit each.
    const lengths = new Uint8Array(histogram.length);
    const first = symbols[0] ?? 0;
    writer.write(1, 1);
    writer.write(Math.max(symbols.length, 1) - 1, 1);
    if (first < 2) {
      writer.write(0, 1);
      writer.write(first, 1);
    } else {
      writer.write(1, 1);
      writer.write(first, 8);
    }
    if (symbols.length === 2) {
      writer.write(symbols[1]!, 8);
      lengths[first] = lengths[symbols[1]!] = 1;
    }
    return createPrefixCode(lengths);
  }

  const lengths = huffmanCodeLengths(histogram, MAX_CODE_LENGTH);
  writer.write(0, 1);
  writeCodeLengths(writer, lengths);
  return createPrefixCode(lengths);
}

/** Writes code lengths, run-length encoded with the code length code. */
function writeCodeLengths(writer: BitWriter, lengths: Uint8Array): void {
  const tokens: number[] = [];
  let previous = 8;
  for (let index = 0; index < lengths.length;) {
    const length = lengths[index]!;
    let run = 1;
    while (index + run < lengths.length && lengths[index + run] === length) run++;
    index += run;
    if (length === 0) {
      while (run > 0) {
        if (run < 3) {
          for (; run > 0; run--) tokens.push(0, 0);
        } else if (run <= 10) {
          tokens.push(17, run - 3);
          run = 0;
        } else {
          const repeat = Math.min(run, 138);
          tokens.push(18, repeat - 11);
          run -= repeat;
        }
      }
      continue;
    }
    if (length !== previous) {
      tokens.push(length, 0);
      previous = length;
      run--;
    }
    while (run > 0) {
      if (run < 3) {
        for (; run > 0; run--) tokens.push(length, 0);
      } else {
        const repeat = Math.min(run, 6);
        tokens.push(16, repeat - 3);
        run -= repeat;
      }
    }
  }

  const histogram = new Uint32Array(CODE_LENGTH_ORDER.length);
  for (let index = 0; index < tokens.length; index += 2) histogram[tokens[index]!]!++;
  const codeLengthLengths = huffmanCodeLengths(histogram, MAX_CODE_LENGTH_CODE_LENGTH);
  const code = createPrefixCode(codeLengthLengths);
  let count = CODE_LENGTH_ORDER.length;
  while (count > 4 && codeLengthLengths[CODE_LENGTH_ORDER[count - 1]!] === 0) count--;
  writer.write(count - 4, 4);
  for (let index = 0; index < count; index++) {
    writer.write(codeLengthLengths[CODE_LENGTH_ORDER[index]!]!, 3);
  }
  // The code lengths cover the whole alphabet.
  writer.write(0, 1);
  for (let index = 0; index < tokens.length; index += 2) {
    const symbol = tokens[index]!;
    writeSymbol(writer, code, symbol);
    if (symbol === 16) writer.write(tokens[index + 1]!, 2);
    else if (symbol === 17) writer.write(tokens[index + 1]!, 3);
    else if (symbol === 18) writer.write(tokens[index + 1]!, 7);
  }
}

function createPrefixCode(lengths: Uint8Array): PrefixCode {
  let used = 0;
  for (const length of lengths) if (length !== 0) used++;
  // Decoders read a code with only one symbol without consuming bits.
  return {
    codes: reversedCanonicalCodes(lengths),
    lengths: used === 1 ? new Uint8Array(lengths.length) : lengths,
  };
}
