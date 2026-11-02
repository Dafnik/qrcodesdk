import {QRCodeError} from '../error';
import {ByteBuffer} from './byte-buffer';
import type {RGBAImage} from './types';

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
  let pixels: Uint32Array = new Uint32Array(width * height);
  let alphaIsUsed = false;
  for (let index = 0, offset = 0; index < pixels.length; index++, offset += 4) {
    const alpha = data[offset + 3]!;
    if (alpha !== 255) alphaIsUsed = true;
    pixels[index] =
      (alpha << 24) | (data[offset]! << 16) | (data[offset + 1]! << 8) | data[offset + 2]!;
  }

  const writer = new BitWriter();
  writer.write(0x2f, 8);
  writer.write(width - 1, 14);
  writer.write(height - 1, 14);
  writer.write(alphaIsUsed ? 1 : 0, 1);
  writer.write(0, 3);

  let xsize = width;
  const palette = collectPalette(pixels, 256);
  if (palette) {
    // Color-indexing transform. The color table is stored as differences between entries.
    writer.write(1, 1);
    writer.write(3, 2);
    writer.write(palette.length - 1, 8);
    const table = new Uint32Array(palette.length);
    for (let index = 0; index < palette.length; index++) {
      table[index] = subtractPixels(palette[index]!, index === 0 ? 0 : palette[index - 1]!);
    }
    writeEntropyCodedImage(writer, table, palette.length, false);
    // Up to 16 colors pack several indices into one pixel.
    const bits = palette.length <= 2 ? 3 : palette.length <= 4 ? 2 : palette.length <= 16 ? 1 : 0;
    xsize = (width + (1 << bits) - 1) >> bits;
    pixels = bundlePixels(pixels, width, height, palette, bits);
  } else {
    // Subtract-green transform.
    writer.write(1, 1);
    writer.write(2, 2);
    for (let index = 0; index < pixels.length; index++) {
      const pixel = pixels[index]!;
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
  const output = new ByteBuffer();
  output.pushASCII('RIFF');
  output.pushUint32LE(12 + bitstream.length + padding);
  output.pushASCII('WEBP');
  output.pushASCII('VP8L');
  output.pushUint32LE(bitstream.length);
  output.pushBytes(bitstream);
  if (padding) output.push(0);
  return output.toUint8Array();
}

function isDimension(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 1 && value <= MAX_DIMENSION;
}

function collectPalette(pixels: Uint32Array, limit: number): Uint32Array | undefined {
  const colors = new Set<number>();
  let previous = -1;
  for (const pixel of pixels) {
    if (pixel === previous) continue;
    previous = pixel;
    colors.add(pixel);
    if (colors.size > limit) return undefined;
  }
  return Uint32Array.from(colors).sort();
}

function subtractPixels(left: number, right: number): number {
  let result = 0;
  for (let shift = 0; shift < 32; shift += 8) {
    result |= ((((left >>> shift) & 0xff) - ((right >>> shift) & 0xff)) & 0xff) << shift;
  }
  return result >>> 0;
}

/** Replaces pixels with palette indices in the green channel, packing `8 >> bits` bits each. */
function bundlePixels(
  pixels: Uint32Array,
  width: number,
  height: number,
  palette: Uint32Array,
  bits: number,
): Uint32Array {
  const indices = new Map<number, number>();
  palette.forEach((color, index) => indices.set(color, index));
  const xsize = (width + (1 << bits) - 1) >> bits;
  const bitsPerPixel = 8 >> bits;
  const mask = (1 << bits) - 1;
  const bundled = new Uint32Array(xsize * height).fill(0xff000000);
  let previousColor = -1;
  let previousIndex = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = pixels[y * width + x]!;
      if (color !== previousColor) {
        previousColor = color;
        previousIndex = indices.get(color)!;
      }
      bundled[y * xsize + (x >> bits)]! |= previousIndex << (8 + bitsPerPixel * (x & mask));
    }
  }
  return bundled;
}

function writeEntropyCodedImage(
  writer: BitWriter,
  pixels: Uint32Array,
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
    const length = tokens.values[index]!;
    const value = tokens.values[index + 1]!;
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
    const length = tokens.values[index]!;
    const value = tokens.values[index + 1]!;
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
function findBackwardReferences(pixels: Uint32Array, xsize: number): TokenList {
  const count = pixels.length;
  const tokens = new TokenList();
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

/**
 * Builds Huffman code lengths of at most `limit` bits. Rare symbols are given larger weights until
 * the tree fits.
 */
function huffmanCodeLengths(histogram: Uint32Array, limit: number): Uint8Array {
  const lengths = new Uint8Array(histogram.length);
  const symbols: number[] = [];
  for (let symbol = 0; symbol < histogram.length; symbol++) {
    if (histogram[symbol]! > 0) symbols.push(symbol);
  }
  if (symbols.length <= 1) {
    if (symbols.length === 1) lengths[symbols[0]!] = 1;
    return lengths;
  }

  const leafCount = symbols.length;
  const nodeCount = 2 * leafCount - 1;
  for (let minimum = 1; ; minimum *= 2) {
    const weights = symbols.map((symbol) => Math.max(histogram[symbol]!, minimum));
    const order = symbols.map((_, index) => index);
    order.sort((left, right) => weights[left]! - weights[right]! || left - right);
    const nodeWeights = new Float64Array(nodeCount);
    order.forEach((leaf, index) => (nodeWeights[index] = weights[leaf]!));
    const parents = new Int32Array(nodeCount);
    // Leaves and merged nodes are each already sorted by weight, so two queues replace a heap.
    let nextLeaf = 0;
    let nextInternal = leafCount;
    let next = leafCount;
    const take = () =>
      nextLeaf < leafCount &&
      (nextInternal >= next || nodeWeights[nextLeaf]! <= nodeWeights[nextInternal]!)
        ? nextLeaf++
        : nextInternal++;
    for (; next < nodeCount; next++) {
      const left = take();
      const right = take();
      nodeWeights[next] = nodeWeights[left]! + nodeWeights[right]!;
      parents[left] = parents[right] = next;
    }
    const depths = new Uint16Array(nodeCount);
    let maximum = 0;
    for (let node = nodeCount - 2; node >= 0; node--) {
      depths[node] = depths[parents[node]!]! + 1;
      if (node < leafCount) maximum = Math.max(maximum, depths[node]!);
    }
    if (maximum <= limit) {
      for (let index = 0; index < leafCount; index++) {
        lengths[symbols[order[index]!]!] = depths[index]!;
      }
      return lengths;
    }
  }
}

/** Assigns canonical codes, bit-reversed because the bitstream is read least significant bit first. */
function createPrefixCode(lengths: Uint8Array): PrefixCode {
  const counts = new Uint16Array(MAX_CODE_LENGTH + 1);
  let used = 0;
  for (const length of lengths) {
    if (length === 0) continue;
    counts[length]!++;
    used++;
  }
  const nextCodes = new Uint16Array(MAX_CODE_LENGTH + 1);
  for (let bits = 1, code = 0; bits <= MAX_CODE_LENGTH; bits++) {
    code = (code + counts[bits - 1]!) << 1;
    nextCodes[bits] = code;
  }
  const codes = new Uint16Array(lengths.length);
  for (let symbol = 0; symbol < lengths.length; symbol++) {
    const length = lengths[symbol]!;
    if (length === 0) continue;
    const code = nextCodes[length]!++;
    let reversed = 0;
    for (let bit = 0; bit < length; bit++) reversed |= ((code >>> bit) & 1) << (length - 1 - bit);
    codes[symbol] = reversed;
  }
  // Decoders read a code with only one symbol without consuming bits.
  return {codes, lengths: used === 1 ? new Uint8Array(lengths.length) : lengths};
}

class TokenList {
  values = new Uint32Array(1024);
  length = 0;

  push(length: number, value: number): void {
    if (this.length + 2 > this.values.length) {
      const values = new Uint32Array(this.values.length * 2);
      values.set(this.values);
      this.values = values;
    }
    this.values[this.length++] = length;
    this.values[this.length++] = value;
  }
}

/** Writes bits least significant bit first. */
class BitWriter {
  private readonly buffer = new ByteBuffer();
  private bits = 0;
  private count = 0;

  write(value: number, count: number): void {
    this.bits |= value << this.count;
    this.count += count;
    while (this.count >= 8) {
      this.buffer.push(this.bits & 0xff);
      this.bits >>>= 8;
      this.count -= 8;
    }
  }

  finish(): Uint8Array {
    if (this.count > 0) this.buffer.push(this.bits & 0xff);
    return this.buffer.toUint8Array();
  }
}
