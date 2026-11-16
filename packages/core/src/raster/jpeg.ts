import {QRCodeError} from '../error';
import {throwInvalid} from '../options';
import {parseQRCodeColor, resolveColor} from '../styling';
import type {QRCodeColor} from '../types';
import {ByteBuffer} from './byte-buffer';
import {type RGBAImage, pixelWords} from './types';

export type JPEGEncodeOptions = {
  /** Quality from 1 to 100. Defaults to 92. */
  readonly quality?: number;
  /** Opaque color that transparent pixels are blended onto. Defaults to `#ffffff`. */
  readonly matte?: QRCodeColor;
};

const MAX_DIMENSION = 65_535;
const DEFAULT_QUALITY = 92;
const DEFAULT_MATTE: QRCodeColor = '#ffffff';
// A pattern holds 16 sample words, its quantized DC value, its first and end token, and its number
// of blocks.
const PATTERN_SIZE = 20;

// The zigzag scan order: the natural (row-major) index of each coefficient. It runs along the
// anti-diagonals, alternately up and down.
const ZIGZAG = new Uint8Array(64);
for (let sum = 0, index = 0; sum < 15; sum++) {
  for (let step = 0; step <= sum; step++) {
    const row = sum & 1 ? step : sum - step;
    if (row < 8 && sum - row < 8) ZIGZAG[index++] = row * 8 + sum - row;
  }
}

// The example quantization tables from ITU T.81 Annex K, in natural order.
const LUMINANCE_QUANTIZATION = [
  16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56,
  14, 17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113,
  92, 49, 64, 78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99,
];
const CHROMINANCE_QUANTIZATION = [
  17, 18, 24, 47, 99, 99, 99, 99, 18, 21, 26, 66, 99, 99, 99, 99, 24, 26, 56, 99, 99, 99, 99, 99,
  47, 66, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
  99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
];

// libjpeg's integer RGB to YCbCr conversion, scaled by 2^16: the red, green, and blue factors and
// the offset of Y, Cb, and Cr. The chroma terms add 128 and round down from just below one half, so
// they stay within 0 to 255. The luminance factors add up to 2^16, so gray pixels keep their value.
const CONVERSION = [
  19_595, 38_470, 7471, 32_768, -11_059, -21_709, 32_768, 8_421_375, 32_768, -27_439, -5329,
  8_421_375,
];

/** A Huffman table fitted to the symbol frequencies of one image. */
export type HuffmanTable = {
  /** How often each symbol occurs. Index 256 is a placeholder that keeps codes from being all ones. */
  readonly frequencies: Float64Array;
  /** The number of codes of each length from 1 to 16. */
  counts: number[];
  /** The symbols in code order. */
  symbols: number[];
  /** Code and code length of each symbol. */
  readonly codes: Uint16Array;
  readonly lengths: Uint8Array;
};

/** Validates the JPEG quality and matte color and fills in their defaults. */
export function resolveJPEGOptions(options?: JPEGEncodeOptions): Required<JPEGEncodeOptions> {
  const quality = options?.quality ?? DEFAULT_QUALITY;
  if (!Number.isSafeInteger(quality) || quality < 1 || quality > 100) {
    throwInvalid('quality', 'an integer from 1 to 100', quality);
  }
  const matte = resolveColor('transparency.matte', options?.matte ?? DEFAULT_MATTE);
  if (parseQRCodeColor(matte)[3] !== 255) {
    throwInvalid('transparency.matte', 'an opaque color', matte);
  }
  return {quality, matte};
}

/**
 * Encodes RGBA pixels as a baseline JPEG (JFIF) image without chroma subsampling. JPEG has no
 * alpha channel, so every pixel is blended onto the opaque matte color first. Images whose
 * pixels are all gray are written with a single grayscale channel. The Huffman tables are fitted to
 * the image, so the blocks are first turned into tokens, which are written once the symbols are
 * counted.
 *
 * Blocks with the same samples share a pattern, which is transformed and tokenized once: QR codes
 * repeat a few block patterns. A token is `table << 24 | symbol << 16 | extra bits`, and the low
 * nibble of the symbol is the number of extra bits. Huffman tables 0 and 1 code the luminance DC
 * and AC values, tables 2 and 3 the chrominance ones.
 *
 * The encoder uses integer arithmetic only, so it produces identical bytes in every JavaScript
 * engine.
 */
export function encodeJPEG(
  {width, height, data}: RGBAImage,
  options?: JPEGEncodeOptions,
): Uint8Array {
  if (!isDimension(width) || !isDimension(height)) {
    throw new QRCodeError(
      'RENDER_FAILED',
      `JPEG output must be 1 to ${MAX_DIMENSION} pixels wide and high, received ${width} x ${height}`,
    );
  }
  const {quality, matte} = resolveJPEGOptions(options);
  const pixels = blend({width, height, data}, parseQRCodeColor(matte));
  const tables = (
    isGrayscale(pixels)
      ? [LUMINANCE_QUANTIZATION]
      : [LUMINANCE_QUANTIZATION, CHROMINANCE_QUANTIZATION]
  ).map((base) => scaleQuantizationTable(base, quality));
  const {blocks, patterns, tokens, frequencies} = scan(pixels, width, height, tables);

  // Luminance DC and AC, then chrominance DC and AC, which both chroma components share.
  const huffman = tables.flatMap(() => [createHuffmanTable(), createHuffmanTable()]);
  // Codes as `code << 5 | length`, by table and symbol.
  const codes = new Int32Array(1024);
  huffman.forEach((table, index) => {
    table.frequencies.set(frequencies.subarray(index << 8, (index + 1) << 8));
    assignOptimalCodes(table);
    for (let symbol = 0; symbol < 256; symbol++) {
      codes[(index << 8) | symbol] = (table.codes[symbol]! << 5) | table.lengths[symbol]!;
    }
  });

  const output = new ByteBuffer();
  writeHeaders(output, width, height, tables, huffman);
  const writer = new BitWriter(output, codes);
  writeBlocks(writer, blocks, patterns, tokens);
  // Pads the last byte with one bits.
  writer.put(0x7f, 7);

  output.pushBytes([0xff, 0xd9]);
  return output.toUint8Array();
}

/**
 * Turns every block into its DC token and a pattern, and counts the Huffman symbols. The patterns
 * are stored in `patterns`, and their AC tokens in `tokens`.
 */
function scan(
  pixels: Uint32Array,
  width: number,
  height: number,
  tables: readonly Uint8Array[],
): {blocks: Int32Array; patterns: number[]; tokens: number[]; frequencies: Uint32Array} {
  const rowLength = Math.ceil(width / 8) * 8;
  // Samples of one row of blocks per component, with the edges repeated to whole blocks.
  const samples = Array.from({length: tables.length * 2 - 1}, () => new Uint8Array(rowLength * 8));
  const words = samples.map(({buffer}) => new Int32Array(buffer));
  const blockCount = (rowLength / 8) * Math.ceil(height / 8) * samples.length;
  // The DC token and the pattern of every block.
  const blocks = new Int32Array(blockCount * 2);
  const patterns: number[] = [];
  const tokens: number[] = [];
  // The last pattern of each hash, per quantization table.
  const known = tables.map(() => new Map<number, number>());
  const frequencies = new Uint32Array(1024);
  const predictors = [0, 0, 0];
  for (let top = 0, length = 0; top < height; top += 8) {
    fillSamples(pixels, width, height, top, rowLength, samples);
    for (let left = 0; left < rowLength; left += 8) {
      // Components are interleaved block by block, because none of them is subsampled.
      for (let component = 0; component < samples.length; component++) {
        const table = component && 1;
        const hash = compareBlock(words[component]!, left, rowLength);
        let pattern = known[table]!.get(hash) ?? -1;
        if (pattern < 0 || compareBlock(words[component]!, left, rowLength, patterns, pattern)) {
          known[table]!.set(hash, (pattern = patterns.length));
          addPattern(samples[component]!, rowLength, left, tables[table]!, table, patterns, tokens);
        }
        patterns[pattern + 19]!++;
        const token = createToken(table * 2, 0, patterns[pattern + 16]! - predictors[component]!);
        predictors[component] = patterns[pattern + 16]!;
        frequencies[token >>> 16]!++;
        blocks[length++] = token;
        blocks[length++] = pattern;
      }
    }
  }
  // The tokens of a pattern count once for every block that uses it.
  for (let pattern = 0; pattern < patterns.length; pattern += PATTERN_SIZE) {
    for (let token = patterns[pattern + 17]!; token < patterns[pattern + 18]!; token++) {
      frequencies[tokens[token]! >>> 16]! += patterns[pattern + 19]!;
    }
  }
  return {blocks, patterns, tokens, frequencies};
}

function writeBlocks(
  writer: BitWriter,
  blocks: Int32Array,
  patterns: readonly number[],
  tokens: readonly number[],
): void {
  for (let index = 0; index < blocks.length; index += 2) {
    writer.write(blocks[index]!);
    const pattern = blocks[index + 1]!;
    for (let token = patterns[pattern + 17]!; token < patterns[pattern + 18]!; token++) {
      writer.write(tokens[token]!);
    }
  }
}

function isDimension(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 1 && value <= MAX_DIMENSION;
}

/** Blends every pixel onto the matte color and returns packed `0xRRGGBB` values. */
function blend(image: RGBAImage, matte: readonly number[]): Uint32Array {
  const {bytes, words} = pixelWords(image);
  const pixels = new Uint32Array(words.length);
  for (let index = 0; index < words.length; index++) {
    // Pixels repeat in runs, so each run is blended once.
    if (index > 0 && words[index] === words[index - 1]) {
      pixels[index] = pixels[index - 1]!;
      continue;
    }
    const alpha = bytes[index * 4 + 3]!;
    for (let channel = 0; channel < 3; channel++) {
      const value = bytes[index * 4 + channel]!;
      pixels[index] =
        (pixels[index]! << 8) |
        (alpha < 255 ? (value * alpha + matte[channel]! * (255 - alpha) + 127) / 255 : value);
    }
  }
  return pixels;
}

function isGrayscale(pixels: Uint32Array): boolean {
  for (let index = 0; index < pixels.length; index++) {
    if (pixels[index] !== (pixels[index]! & 0xff) * 0x10101) return false;
  }
  return true;
}

/** Scales a quality 50 table like libjpeg, and limits it to 8-bit baseline values. */
function scaleQuantizationTable(base: readonly number[], quality: number): Uint8Array {
  const scale = quality < 50 ? Math.floor(5000 / quality) : 200 - quality * 2;
  return Uint8Array.from(base, (value) =>
    Math.min(255, Math.max(1, Math.floor((value * scale + 50) / 100))),
  );
}

export function createHuffmanTable(): HuffmanTable {
  return {
    frequencies: new Float64Array(257),
    counts: [],
    symbols: [],
    codes: new Uint16Array(256),
    lengths: new Uint8Array(256),
  };
}

/**
 * Builds the optimal Huffman code for the counted frequencies with at most 16 bits per code, ITU
 * T.81 Annex K.2. This follows libjpeg's `jpeg_gen_optimal_table`, including its tie-breaking, so
 * the tables match libjpeg's optimized output.
 */
export function assignOptimalCodes(table: HuffmanTable): void {
  const frequencies = Float64Array.from(table.frequencies);
  const codeSizes = new Int32Array(257);
  const others = new Int32Array(257).fill(-1);
  // The placeholder symbol 256 takes the last code of the longest length, so no real code is all
  // ones.
  frequencies[256] = 1;

  for (;;) {
    // Merge the two least frequent subtrees. Ties pick the larger symbol.
    let first = -1;
    let second = -1;
    for (let symbol = 0; symbol <= 256; symbol++) {
      const frequency = frequencies[symbol]!;
      if (!frequency) continue;
      if (first < 0 || frequency <= frequencies[first]!) {
        second = first;
        first = symbol;
      } else if (second < 0 || frequency <= frequencies[second]!) {
        second = symbol;
      }
    }
    if (second < 0) break;

    frequencies[first]! += frequencies[second]!;
    frequencies[second] = 0;
    // The second chain joins the first, and every symbol in both subtrees gets one bit longer.
    let end = first;
    while (others[end]! >= 0) end = others[end]!;
    others[end] = second;
    for (let symbol = first; symbol >= 0; symbol = others[symbol]!) codeSizes[symbol]!++;
  }

  // libjpeg stops at 32 bits, which needs billions of symbols. Any depth is handled here.
  const maxLength = Math.max(...codeSizes);
  // Index 0 is unused, and the header needs a count for every length from 1 to 16.
  const counts = new Array<number>(Math.max(maxLength, 16) + 1).fill(0);
  for (const size of codeSizes) if (size > 0) counts[size]!++;
  // Shorten codes above 16 bits: two symbols of the longest length move up, using a shorter code
  // as their prefix.
  let length = maxLength;
  for (; length > 16; length--) {
    while (counts[length]! > 0) {
      let prefix = length - 2;
      while (counts[prefix] === 0) prefix--;
      counts[length]! -= 2;
      counts[length - 1]!++;
      counts[prefix + 1]! += 2;
      counts[prefix]!--;
    }
  }
  // Remove the placeholder from the longest length in use.
  while (counts[length] === 0) length--;
  counts[length]!--;

  const symbols: number[] = [];
  for (let size = 1; size <= maxLength; size++) {
    for (let symbol = 0; symbol < 256; symbol++) {
      if (codeSizes[symbol] === size) symbols.push(symbol);
    }
  }
  table.counts = counts.slice(1, 17);
  table.symbols = symbols;

  // Canonical codes in symbol order, ITU T.81 Annex C.
  let code = 0;
  let index = 0;
  for (let size = 1; size <= 16; size++) {
    for (let count = 0; count < table.counts[size - 1]!; count++) {
      table.codes[symbols[index]!] = code++;
      table.lengths[symbols[index++]!] = size;
    }
    code <<= 1;
  }
}

function writeHeaders(
  output: ByteBuffer,
  width: number,
  height: number,
  tables: readonly Uint8Array[],
  huffman: readonly HuffmanTable[],
): void {
  // Component ids. The chroma components share the second quantization and Huffman tables.
  const components = [1, 2, 3].slice(0, tables.length * 2 - 1);
  // DC tables are class 0 and AC tables class 1.
  const huffmanTables = huffman.flatMap(({counts, symbols}, index) => [
    ((index & 1) << 4) | (index >> 1),
    ...counts,
    ...symbols,
  ]);
  // Values above 255 are pushed modulo 256, which leaves their low byte.
  output.pushBytes([
    // Start of image, then a JFIF APP0 segment: version 1.01, 1:1 pixel aspect ratio, no thumbnail.
    0xff,
    0xd8,
    0xff,
    0xe0,
    0,
    16,
    0x4a,
    0x46,
    0x49,
    0x46,
    0,
    1,
    1,
    0,
    0,
    1,
    0,
    1,
    0,
    0,
    // Quantization tables, 8-bit precision, in zigzag order.
    0xff,
    0xdb,
    0,
    2 + tables.length * 65,
    ...tables.flatMap((table, index) => [
      index,
      ...Array.from(ZIGZAG, (position) => table[position]!),
    ]),
    // Baseline frame header with 1 x 1 sampling.
    0xff,
    0xc0,
    0,
    8 + components.length * 3,
    8,
    height >> 8,
    height,
    width >> 8,
    width,
    components.length,
    ...components.flatMap((id) => [id, 0x11, +(id > 1)]),
    // Huffman tables.
    0xff,
    0xc4,
    (huffmanTables.length + 2) >> 8,
    huffmanTables.length + 2,
    ...huffmanTables,
    // Start of scan with all components interleaved, covering coefficients 0 to 63.
    0xff,
    0xda,
    0,
    6 + components.length * 2,
    components.length,
    ...components.flatMap((id) => [id, id > 1 ? 0x11 : 0]),
    0,
    63,
    0,
  ]);
}

/**
 * Hashes the block at `left`, or with `patterns`, returns whether it differs from the pattern at
 * `pattern`.
 */
function compareBlock(
  words: Int32Array,
  left: number,
  rowLength: number,
  patterns?: readonly number[],
  pattern = 0,
): number {
  let hash = 0;
  for (let offset = left >> 2; offset < rowLength * 2; offset += rowLength >> 2) {
    if (patterns) {
      if (patterns[pattern++] !== words[offset] || patterns[pattern++] !== words[offset + 1]) {
        return 1;
      }
    } else {
      hash = Math.imul(
        Math.imul(hash ^ words[offset]!, 0x9e3779b1) ^ words[offset + 1]!,
        0x85ebca6b,
      );
    }
  }
  return hash;
}

/**
 * Converts the 8 pixel rows starting at `top` to the component samples. Rows and columns beyond
 * the image repeat the last pixel, which keeps the partial blocks smooth.
 */
function fillSamples(
  pixels: Uint32Array,
  width: number,
  height: number,
  top: number,
  rowLength: number,
  samples: readonly Uint8Array[],
): void {
  for (let row = 0, target = 0; row < 8; row++, target += rowLength) {
    const source = Math.min(top + row, height - 1) * width;
    // Pixels repeat in runs, so each run is converted once.
    for (let column = 0; column < width;) {
      const pixel = pixels[source + column]!;
      let end = column + 1;
      while (end < width && pixels[source + end] === pixel) end++;
      // The last run extends to whole blocks.
      if (end === width) end = rowLength;
      for (let component = 0, factor = 0; component < samples.length; component++, factor += 4) {
        const value =
          (CONVERSION[factor]! * (pixel >>> 16) +
            CONVERSION[factor + 1]! * ((pixel >>> 8) & 0xff) +
            CONVERSION[factor + 2]! * (pixel & 0xff) +
            CONVERSION[factor + 3]!) >>
          16;
        for (let index = target + column; index < target + end; index++) {
          samples[component]![index] = value;
        }
      }
      column = end;
    }
  }
}

/**
 * Transforms and quantizes the block at `left` into a new pattern, and adds the tokens of its AC
 * values.
 */
function addPattern(
  samples: Uint8Array,
  rowLength: number,
  left: number,
  quantization: Uint8Array,
  table: number,
  patterns: number[],
  tokens: number[],
): void {
  const words = new Int32Array(samples.buffer);
  const block = new Int32Array(64);
  for (let row = 0; row < 8; row++) {
    patterns.push(
      words[(row * rowLength + left) >> 2]!,
      words[((row * rowLength + left) >> 2) + 1]!,
    );
    // Center the samples around zero.
    for (let column = 0; column < 8; column++) {
      block[row * 8 + column] = samples[row * rowLength + left + column]! - 128;
    }
  }
  forwardDCT(block);
  patterns.push(quantize(block[0]!, quantization[0]!), tokens.length);
  let zeros = 0;
  for (let index = 1; index < 64; index++) {
    const value = quantize(block[ZIGZAG[index]!]!, quantization[ZIGZAG[index]!]!);
    if (value === 0) {
      zeros++;
      continue;
    }
    // A run of 16 zeros has its own symbol.
    for (; zeros > 15; zeros -= 16) tokens.push(createToken(table * 2 + 1, 0xf0, 0));
    tokens.push(createToken(table * 2 + 1, zeros << 4, value));
    zeros = 0;
  }
  // End of block.
  if (zeros > 0) tokens.push(createToken(table * 2 + 1, 0, 0));
  patterns.push(tokens.length, 0);
}

/**
 * Codes a value after a run of zeros: the symbol is the run and the bit length of the value, and
 * its bits follow (one's complement if negative).
 */
function createToken(table: number, run: number, value: number): number {
  const magnitude = value < 0 ? -value : value;
  const size = magnitude && 32 - Math.clz32(magnitude);
  return (
    (table << 24) | ((run | size) << 16) | ((value < 0 ? value - 1 : value) & ((1 << size) - 1))
  );
}

/**
 * libjpeg's accurate integer forward DCT (`jpeg_fdct_islow`) with its fixed-point constants, scaled
 * by 2^13. The output is scaled up by 8, which the quantization step divides out.
 */
function forwardDCT(block: Int32Array): void {
  // Rows first, keeping 2 bits of extra precision, then columns, which remove them again.
  for (let row = 0; row < 64; row += 8) transformLine(block, row, 1, 11);
  for (let column = 0; column < 8; column++) transformLine(block, column, 8, 15);
}

function transformLine(block: Int32Array, start: number, step: number, shift: number): void {
  const i0 = start;
  const i1 = start + step;
  const i2 = start + step * 2;
  const i3 = start + step * 3;
  const i4 = start + step * 4;
  const i5 = start + step * 5;
  const i6 = start + step * 6;
  const i7 = start + step * 7;
  const tmp0 = block[i0]! + block[i7]!;
  let tmp7 = block[i0]! - block[i7]!;
  const tmp1 = block[i1]! + block[i6]!;
  let tmp6 = block[i1]! - block[i6]!;
  const tmp2 = block[i2]! + block[i5]!;
  let tmp5 = block[i2]! - block[i5]!;
  const tmp3 = block[i3]! + block[i4]!;
  let tmp4 = block[i3]! - block[i4]!;

  // Even part. Rows scale the DC and middle terms up by 2 bits, and columns back down.
  const tmp10 = tmp0 + tmp3;
  const tmp13 = tmp0 - tmp3;
  const tmp11 = tmp1 + tmp2;
  const tmp12 = tmp1 - tmp2;
  block[i0] = shift < 15 ? (tmp10 + tmp11) << 2 : descale(tmp10 + tmp11, 2);
  block[i4] = shift < 15 ? (tmp10 - tmp11) << 2 : descale(tmp10 - tmp11, 2);
  const even = (tmp12 + tmp13) * 4433; // FIX_0_541196100
  block[i2] = descale(even + tmp13 * 6270, shift); // FIX_0_765366865
  block[i6] = descale(even - tmp12 * 15_137, shift); // FIX_1_847759065

  // Odd part.
  let z1 = tmp4 + tmp7;
  let z2 = tmp5 + tmp6;
  let z3 = tmp4 + tmp6;
  let z4 = tmp5 + tmp7;
  const z5 = (z3 + z4) * 9633; // FIX_1_175875602
  tmp4 *= 2446; // FIX_0_298631336
  tmp5 *= 16_819; // FIX_2_053119869
  tmp6 *= 25_172; // FIX_3_072711026
  tmp7 *= 12_299; // FIX_1_501321110
  z1 *= -7373; // FIX_0_899976223
  z2 *= -20_995; // FIX_2_562915447
  z3 = z3 * -16_069 + z5; // FIX_1_961570560
  z4 = z4 * -3196 + z5; // FIX_0_390180644
  block[i7] = descale(tmp4 + z1 + z3, shift);
  block[i5] = descale(tmp5 + z2 + z4, shift);
  block[i3] = descale(tmp6 + z2 + z3, shift);
  block[i1] = descale(tmp7 + z1 + z4, shift);
}

/** Divides by 2^shift, rounding half up. */
function descale(value: number, shift: number): number {
  return (value + (1 << (shift - 1))) >> shift;
}

/** Divides a DCT output, which is scaled by 8, by its quantizer and rounds to nearest. */
function quantize(value: number, quantizer: number): number {
  const quantized = (((value < 0 ? -value : value) + quantizer * 4) / (quantizer * 8)) | 0;
  return value < 0 ? -quantized : quantized;
}

/** Writes bits most significant first, and stuffs a zero byte after every `0xff` byte. */
class BitWriter {
  // Bits above `count` are never read again, so they are not cleared.
  private bits = 0;
  private count = 0;

  constructor(
    private readonly output: ByteBuffer,
    private readonly codes: Int32Array,
  ) {}

  /** Writes up to 24 bits. */
  put(value: number, length: number): void {
    this.bits = (this.bits << length) | value;
    for (this.count += length; this.count >= 8;) {
      const byte = (this.bits >>> (this.count -= 8)) & 0xff;
      this.output.push(byte);
      if (byte === 0xff) this.output.push(0);
    }
  }

  /** Writes a token's Huffman code, then its extra bits. */
  write(token: number): void {
    const code = this.codes[token >>> 16]!;
    this.put(code >>> 5, code & 31);
    this.put(token & 0xffff, (token >>> 16) & 15);
  }
}
