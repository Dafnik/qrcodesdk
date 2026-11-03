import {QRCodeError} from '../error';
import {throwInvalid} from '../options';
import {parseQRCodeColor, validateColor} from '../styling';
import type {QRCodeColor} from '../types';
import {ByteBuffer} from './byte-buffer';
import type {RGBAImage} from './types';

export type JPEGEncodeOptions = {
  /** Quality from 1 to 100. Defaults to 92. */
  readonly quality?: number;
  /** Opaque color that transparent pixels are blended onto. Defaults to `#ffffff`. */
  readonly matte?: QRCodeColor;
};

const MAX_DIMENSION = 65_535;
const DEFAULT_QUALITY = 92;
const DEFAULT_MATTE: QRCodeColor = '#ffffff';

// The zigzag scan order: the natural (row-major) index of each coefficient.
const ZIGZAG = new Uint8Array([
  0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20,
  13, 6, 7, 14, 21, 28, 35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52,
  45, 38, 31, 39, 46, 53, 60, 61, 54, 47, 55, 62, 63,
]);

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

// Fixed-point constants of libjpeg's integer ("islow") forward DCT, scaled by 2^13.
const CONST_BITS = 13;
const PASS1_BITS = 2;
const FIX_0_298631336 = 2446;
const FIX_0_390180644 = 3196;
const FIX_0_541196100 = 4433;
const FIX_0_765366865 = 6270;
const FIX_0_899976223 = 7373;
const FIX_1_175875602 = 9633;
const FIX_1_501321110 = 12_299;
const FIX_1_847759065 = 15_137;
const FIX_1_961570560 = 16_069;
const FIX_2_053119869 = 16_819;
const FIX_2_562915447 = 20_995;
const FIX_3_072711026 = 25_172;

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

/** Receives the Huffman symbols and extra bits of the entropy-coded data. */
type EntropyCoder = {
  symbol(table: HuffmanTable, symbol: number): void;
  write(value: number, length: number): void;
};

type Component = {
  readonly id: number;
  /** Quantization table index. */
  readonly table: number;
  readonly dc: HuffmanTable;
  readonly ac: HuffmanTable;
  /** Samples of one row of blocks, with the edges repeated to whole blocks. */
  readonly samples: Uint8Array;
  predictor: number;
};

/** Validates the JPEG quality and matte color and fills in their defaults. */
export function resolveJPEGOptions(options?: JPEGEncodeOptions): Required<JPEGEncodeOptions> {
  const quality = options?.quality ?? DEFAULT_QUALITY;
  if (!Number.isSafeInteger(quality) || quality < 1 || quality > 100) {
    throwInvalid('quality', 'an integer from 1 to 100', quality);
  }
  const matte = options?.matte ?? DEFAULT_MATTE;
  validateColor('transparency.matte', matte);
  if (parseQRCodeColor(matte)[3] !== 255) {
    throwInvalid('transparency.matte', 'an opaque color', matte);
  }
  return {quality, matte: matte.toLowerCase() as QRCodeColor};
}

/**
 * Encodes RGBA pixels as a baseline JPEG (JFIF) image without chroma subsampling. JPEG has no
 * alpha channel, so every pixel is blended onto the opaque matte color first. Images whose
 * pixels are all gray are written with a single grayscale channel. The Huffman tables are fitted to
 * the image, so the blocks are transformed twice: once to count symbols and once to write them.
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
  const [matteRed, matteGreen, matteBlue] = parseQRCodeColor(matte);
  const pixels = blend(data, width * height, matteRed, matteGreen, matteBlue);
  const grayscale = isGrayscale(pixels);

  const blockColumns = Math.ceil(width / 8);
  const blockRows = Math.ceil(height / 8);
  const rowLength = blockColumns * 8;
  const luminanceTable = scaleQuantizationTable(LUMINANCE_QUANTIZATION, quality);
  const tables = grayscale
    ? [luminanceTable]
    : [luminanceTable, scaleQuantizationTable(CHROMINANCE_QUANTIZATION, quality)];
  const component = (id: number, table: number, dc: HuffmanTable, ac: HuffmanTable) => ({
    id,
    table,
    dc,
    ac,
    samples: new Uint8Array(rowLength * 8),
    predictor: 0,
  });
  const components: Component[] = [component(1, 0, createHuffmanTable(), createHuffmanTable())];
  if (!grayscale) {
    // Both chroma components share one DC and one AC table.
    const dcChrominance = createHuffmanTable();
    const acChrominance = createHuffmanTable();
    components.push(
      component(2, 1, dcChrominance, acChrominance),
      component(3, 1, dcChrominance, acChrominance),
    );
  }

  const encodeScan = (coder: EntropyCoder) => {
    const block = new Int32Array(64);
    for (const current of components) current.predictor = 0;
    for (let blockRow = 0; blockRow < blockRows; blockRow++) {
      fillSamples(pixels, width, height, blockRow * 8, rowLength, components);
      for (let blockColumn = 0; blockColumn < blockColumns; blockColumn++) {
        // Components are interleaved block by block, because none of them is subsampled.
        for (const current of components) {
          if (loadBlock(current.samples, rowLength, blockColumn * 8, block)) forwardDCT(block);
          current.predictor = encodeBlock(
            coder,
            block,
            tables[current.table]!,
            current.predictor,
            current.dc,
            current.ac,
          );
        }
      }
    }
  };

  // The first pass only counts symbols. Transforming twice keeps memory flat, where storing the
  // coefficients would need 128 bytes per block and component.
  encodeScan({
    symbol: (table, symbol) => table.frequencies[symbol]!++,
    write: () => {},
  });
  for (const {dc, ac} of components) {
    assignOptimalCodes(dc);
    assignOptimalCodes(ac);
  }

  const output = new ByteBuffer();
  writeHeaders(output, width, height, tables, components);
  const writer = new BitWriter(output);
  encodeScan(writer);
  writer.flush();

  output.pushBytes([0xff, 0xd9]);
  return output.toUint8Array();
}

function isDimension(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 1 && value <= MAX_DIMENSION;
}

/** Blends every pixel onto the matte color and returns packed `0xRRGGBB` values. */
function blend(
  data: RGBAImage['data'],
  pixelCount: number,
  red: number,
  green: number,
  blue: number,
): Uint32Array {
  const matte = (red << 16) | (green << 8) | blue;
  const pixels = new Uint32Array(pixelCount);
  for (let index = 0, offset = 0; index < pixelCount; index++, offset += 4) {
    const alpha = data[offset + 3]!;
    if (alpha === 255) {
      pixels[index] = (data[offset]! << 16) | (data[offset + 1]! << 8) | data[offset + 2]!;
    } else if (alpha === 0) {
      pixels[index] = matte;
    } else {
      const inverse = 255 - alpha;
      pixels[index] =
        (mix(data[offset]!, red, alpha, inverse) << 16) |
        (mix(data[offset + 1]!, green, alpha, inverse) << 8) |
        mix(data[offset + 2]!, blue, alpha, inverse);
    }
  }
  return pixels;
}

function mix(value: number, matte: number, alpha: number, inverse: number): number {
  return ((value * alpha + matte * inverse + 127) / 255) | 0;
}

function isGrayscale(pixels: Uint32Array): boolean {
  for (const pixel of pixels) {
    const blue = pixel & 0xff;
    if (((pixel >>> 8) & 0xff) !== blue || pixel >>> 16 !== blue) return false;
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
 * the tables match libjpeg's optimized output. Tables shared by several components are built once.
 */
export function assignOptimalCodes(table: HuffmanTable): void {
  if (table.symbols.length > 0) return;
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
    for (let symbol = 0, minimum = Infinity; symbol <= 256; symbol++) {
      const frequency = frequencies[symbol]!;
      if (frequency > 0 && frequency <= minimum) {
        minimum = frequency;
        first = symbol;
      }
    }
    for (let symbol = 0, minimum = Infinity; symbol <= 256; symbol++) {
      const frequency = frequencies[symbol]!;
      if (frequency > 0 && frequency <= minimum && symbol !== first) {
        minimum = frequency;
        second = symbol;
      }
    }
    if (second < 0) break;

    frequencies[first]! += frequencies[second]!;
    frequencies[second] = 0;
    // Every symbol in both subtrees gets one bit longer, and the second chain joins the first.
    codeSizes[first]!++;
    while (others[first]! >= 0) {
      first = others[first]!;
      codeSizes[first]!++;
    }
    others[first] = second;
    codeSizes[second]!++;
    while (others[second]! >= 0) {
      second = others[second]!;
      codeSizes[second]!++;
    }
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
  components: readonly Component[],
): void {
  // Start of image, then a JFIF APP0 segment: version 1.01, 1:1 pixel aspect ratio, no thumbnail.
  output.pushBytes([0xff, 0xd8, 0xff, 0xe0]);
  output.pushUint16BE(16);
  output.pushASCII('JFIF\0');
  output.pushBytes([1, 1, 0, 0, 1, 0, 1, 0, 0]);

  // Quantization tables, 8-bit precision, in zigzag order.
  output.pushBytes([0xff, 0xdb]);
  output.pushUint16BE(2 + tables.length * 65);
  tables.forEach((table, index) => {
    output.push(index);
    for (const position of ZIGZAG) output.push(table[position]!);
  });

  // Baseline frame header. Every component uses 1 x 1 sampling.
  output.pushBytes([0xff, 0xc0]);
  output.pushUint16BE(8 + components.length * 3);
  output.push(8);
  output.pushUint16BE(height);
  output.pushUint16BE(width);
  output.push(components.length);
  for (const {id, table} of components) output.pushBytes([id, 0x11, table]);

  // Huffman tables: DC tables are class 0 and AC tables class 1.
  const huffmanTables: [number, HuffmanTable][] = [];
  for (const {table, dc, ac} of components) {
    if (!huffmanTables.some(([, existing]) => existing === dc)) {
      huffmanTables.push([table, dc], [0x10 | table, ac]);
    }
  }
  output.pushBytes([0xff, 0xc4]);
  output.pushUint16BE(
    2 + huffmanTables.reduce((sum, [, {symbols}]) => sum + 17 + symbols.length, 0),
  );
  for (const [classAndId, {counts, symbols}] of huffmanTables) {
    output.push(classAndId);
    output.pushBytes(counts);
    output.pushBytes(symbols);
  }

  // Start of scan with all components interleaved, covering coefficients 0 to 63.
  output.pushBytes([0xff, 0xda]);
  output.pushUint16BE(6 + components.length * 2);
  output.push(components.length);
  for (const {id, table} of components) output.pushBytes([id, (table << 4) | table]);
  output.pushBytes([0, 63, 0]);
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
  components: readonly Component[],
): void {
  const [luminance, blueDifference, redDifference] = components;
  for (let row = 0; row < 8; row++) {
    const source = Math.min(top + row, height - 1) * width;
    for (let column = 0; column < rowLength; column++) {
      const pixel = pixels[source + Math.min(column, width - 1)]!;
      const target = row * rowLength + column;
      const blue = pixel & 0xff;
      if (!blueDifference || !redDifference) {
        // Grayscale pixels have equal channels.
        luminance!.samples[target] = blue;
        continue;
      }
      const red = pixel >>> 16;
      const green = (pixel >>> 8) & 0xff;
      // libjpeg's integer RGB to YCbCr conversion, scaled by 2^16. The chroma terms add 128 and
      // round down from just below one half, so they stay within 0 to 255.
      luminance!.samples[target] = (19_595 * red + 38_470 * green + 7471 * blue + 32_768) >> 16;
      blueDifference.samples[target] =
        (-11_059 * red - 21_709 * green + 32_768 * blue + 8_421_375) >> 16;
      redDifference.samples[target] =
        (32_768 * red - 27_439 * green - 5329 * blue + 8_421_375) >> 16;
    }
  }
}

/**
 * Copies one 8 x 8 block and centers its samples around zero. Returns false for a flat block, which
 * it fills with its transform directly: QR codes consist mostly of flat blocks, and the integer DCT
 * of one repeated value is exactly that value scaled by 64 with no other coefficients.
 */
function loadBlock(
  samples: Uint8Array,
  rowLength: number,
  left: number,
  block: Int32Array,
): boolean {
  const first = samples[left]!;
  let flat = true;
  for (let row = 0; row < 8; row++) {
    const offset = row * rowLength + left;
    for (let column = 0; column < 8; column++) {
      const sample = samples[offset + column]!;
      flat &&= sample === first;
      block[row * 8 + column] = sample - 128;
    }
  }
  if (!flat) return true;
  block.fill(0);
  block[0] = (first - 128) * 64;
  return false;
}

/**
 * libjpeg's accurate integer forward DCT (`jpeg_fdct_islow`). The output is scaled up by 8, which
 * the quantization step divides out.
 */
function forwardDCT(block: Int32Array): void {
  // Rows first, keeping PASS1_BITS of extra precision, then columns, which remove it again.
  for (let row = 0; row < 64; row += 8) transformLine(block, row, 1, true);
  for (let column = 0; column < 8; column++) transformLine(block, column, 8, false);
}

function transformLine(block: Int32Array, start: number, step: number, rows: boolean): void {
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
  const shift = rows ? CONST_BITS - PASS1_BITS : CONST_BITS + PASS1_BITS;

  // Even part.
  const tmp10 = tmp0 + tmp3;
  const tmp13 = tmp0 - tmp3;
  const tmp11 = tmp1 + tmp2;
  const tmp12 = tmp1 - tmp2;
  if (rows) {
    block[i0] = (tmp10 + tmp11) << PASS1_BITS;
    block[i4] = (tmp10 - tmp11) << PASS1_BITS;
  } else {
    block[i0] = descale(tmp10 + tmp11, PASS1_BITS);
    block[i4] = descale(tmp10 - tmp11, PASS1_BITS);
  }
  const even = (tmp12 + tmp13) * FIX_0_541196100;
  block[i2] = descale(even + tmp13 * FIX_0_765366865, shift);
  block[i6] = descale(even - tmp12 * FIX_1_847759065, shift);

  // Odd part.
  let z1 = tmp4 + tmp7;
  let z2 = tmp5 + tmp6;
  let z3 = tmp4 + tmp6;
  let z4 = tmp5 + tmp7;
  const z5 = (z3 + z4) * FIX_1_175875602;
  tmp4 *= FIX_0_298631336;
  tmp5 *= FIX_2_053119869;
  tmp6 *= FIX_3_072711026;
  tmp7 *= FIX_1_501321110;
  z1 *= -FIX_0_899976223;
  z2 *= -FIX_2_562915447;
  z3 = z3 * -FIX_1_961570560 + z5;
  z4 = z4 * -FIX_0_390180644 + z5;
  block[i7] = descale(tmp4 + z1 + z3, shift);
  block[i5] = descale(tmp5 + z2 + z4, shift);
  block[i3] = descale(tmp6 + z2 + z3, shift);
  block[i1] = descale(tmp7 + z1 + z4, shift);
}

/** Divides by 2^shift, rounding half up. */
function descale(value: number, shift: number): number {
  return (value + (1 << (shift - 1))) >> shift;
}

/** Quantizes and Huffman codes one block, and returns its DC value for the next prediction. */
function encodeBlock(
  coder: EntropyCoder,
  block: Int32Array,
  table: Uint8Array,
  predictor: number,
  dc: HuffmanTable,
  ac: HuffmanTable,
): number {
  const value = quantize(block[0]!, table[0]!);
  writeCoefficient(coder, dc, 0, value - predictor);

  let zeros = 0;
  for (let index = 1; index < 64; index++) {
    const position = ZIGZAG[index]!;
    const coefficient = quantize(block[position]!, table[position]!);
    if (coefficient === 0) {
      zeros++;
      continue;
    }
    // A run of 16 zeros has its own symbol.
    for (; zeros > 15; zeros -= 16) coder.symbol(ac, 0xf0);
    writeCoefficient(coder, ac, zeros << 4, coefficient);
    zeros = 0;
  }
  // End of block.
  if (zeros > 0) coder.symbol(ac, 0);
  return value;
}

/** Divides a DCT output, which is scaled by 8, by its quantizer and rounds to nearest. */
function quantize(value: number, quantizer: number): number {
  const divisor = quantizer << 3;
  return value < 0
    ? -Math.floor((-value + (divisor >> 1)) / divisor)
    : Math.floor((value + (divisor >> 1)) / divisor);
}

/** Writes the symbol for a value's bit length, then the value's bits (one's complement if negative). */
function writeCoefficient(
  coder: EntropyCoder,
  table: HuffmanTable,
  run: number,
  value: number,
): void {
  const magnitude = value < 0 ? -value : value;
  const size = magnitude === 0 ? 0 : 32 - Math.clz32(magnitude);
  coder.symbol(table, run | size);
  if (size > 0) coder.write((value < 0 ? value - 1 : value) & ((1 << size) - 1), size);
}

/** Writes bits most significant first, and stuffs a zero byte after every `0xff` byte. */
class BitWriter implements EntropyCoder {
  private bits = 0;
  private count = 0;

  constructor(private readonly output: ByteBuffer) {}

  symbol(table: HuffmanTable, symbol: number): void {
    this.write(table.codes[symbol]!, table.lengths[symbol]!);
  }

  write(value: number, length: number): void {
    this.bits = (this.bits << length) | value;
    this.count += length;
    while (this.count >= 8) {
      this.count -= 8;
      const byte = (this.bits >>> this.count) & 0xff;
      this.output.push(byte);
      if (byte === 0xff) this.output.push(0);
    }
    this.bits &= (1 << this.count) - 1;
  }

  /** Pads the last byte with one bits. */
  flush(): void {
    if (this.count > 0) this.write((1 << (8 - this.count)) - 1, 8 - this.count);
  }
}
