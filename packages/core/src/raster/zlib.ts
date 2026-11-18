import {BitWriter, huffmanCodeLengths, reversedCanonicalCodes} from './huffman';

const LENGTH_BASES = [
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131,
  163, 195, 227, 258,
];
const LENGTH_EXTRA_BITS = [
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0,
];
const DISTANCE_BASES = [
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049,
  3073, 4097, 6145, 8193, 12289, 16385, 24577,
];
const DISTANCE_EXTRA_BITS = [
  0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13,
];
const CODE_LENGTH_ORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
const END_OF_BLOCK = 256;
const MAX_MATCH = 258;
const MAX_STORED_LENGTH = 65_535;
// Blocks restart their Huffman codes, so long inputs adapt to local statistics.
const MAX_BLOCK_SYMBOLS = 1 << 16;
const MODULO = 65_521;
// The largest byte count whose Adler-32 sums cannot overflow before the modulo.
const ADLER_CHUNK = 5552;

let fixedLiteralLengths: Uint8Array | undefined;
let fixedDistanceLengths: Uint8Array | undefined;
let fixedDecoders: readonly [Decoder, Decoder] | undefined;

/**
 * Compresses bytes into a zlib stream. Like zlib's run-length strategy, it only matches runs of the
 * previous byte, which suits filtered PNG rows of solid colors. Each block takes the smallest of
 * dynamic Huffman, fixed Huffman, and stored encoding.
 */
export function zlibDeflate(data: Uint8Array): Uint8Array {
  const writer = new BitWriter();
  // Deflate with a 32 KB window, default compression level.
  writer.write(0x78, 8);
  writer.write(0x9c, 8);
  // Literals are byte values. Matches are 256 plus their length, always at distance 1.
  const tokens = new Uint16Array(MAX_BLOCK_SYMBOLS);
  let position = 0;
  do {
    const start = position;
    let count = 0;
    while (position < data.length && count < MAX_BLOCK_SYMBOLS) {
      if (position > 0) {
        const previous = data[position - 1]!;
        const limit = Math.min(MAX_MATCH, data.length - position);
        let run = 0;
        while (run < limit && data[position + run] === previous) run++;
        if (run >= 3) {
          tokens[count++] = 256 + run;
          position += run;
          continue;
        }
      }
      tokens[count++] = data[position++]!;
    }
    writeBlock(
      writer,
      data.subarray(start, position),
      tokens.subarray(0, count),
      position === data.length,
    );
  } while (position < data.length);

  const checksum = adler32(data);
  writer.writeBytes([
    checksum >>> 24,
    (checksum >>> 16) & 0xff,
    (checksum >>> 8) & 0xff,
    checksum & 0xff,
  ]);
  return writer.finish();
}

function writeBlock(writer: BitWriter, raw: Uint8Array, tokens: Uint16Array, final: boolean): void {
  const literalFrequencies = new Uint32Array(286);
  const distanceFrequencies = new Uint32Array(30);
  let extraBits = 0;
  for (const token of tokens) {
    if (token < 256) {
      literalFrequencies[token]!++;
    } else {
      const code = lengthCode(token - 256);
      literalFrequencies[257 + code]!++;
      distanceFrequencies[0]!++;
      extraBits += LENGTH_EXTRA_BITS[code]!;
    }
  }
  literalFrequencies[END_OF_BLOCK] = 1;

  // Codes with a single symbol are incomplete, which some decoders reject, so codes get at least
  // two symbols. The costs only count the symbols that are written.
  const literalLengths = huffmanCodeLengths(withTwoSymbols(literalFrequencies), 15);
  const distanceLengths = huffmanCodeLengths(withTwoSymbols(distanceFrequencies), 15);
  const header = dynamicHeader(literalLengths, distanceLengths);
  const dynamicCost =
    3 +
    header.bits +
    symbolBits(literalFrequencies, literalLengths) +
    symbolBits(distanceFrequencies, distanceLengths) +
    extraBits;

  const [fixedLiterals, fixedDistances] = fixedLengths();
  const fixedCost =
    3 +
    symbolBits(literalFrequencies, fixedLiterals) +
    symbolBits(distanceFrequencies, fixedDistances) +
    extraBits;

  const storedBlocks = Math.max(1, Math.ceil(raw.length / MAX_STORED_LENGTH));
  const storedCost = raw.length * 8 + storedBlocks * (3 + 7 + 32);

  if (storedCost <= dynamicCost && storedCost <= fixedCost) {
    writeStored(writer, raw, final);
  } else if (fixedCost <= dynamicCost) {
    writer.write(final ? 1 : 0, 1);
    writer.write(1, 2);
    writeTokens(writer, tokens, fixedLiterals, fixedDistances);
  } else {
    writer.write(final ? 1 : 0, 1);
    writer.write(2, 2);
    header.write(writer);
    writeTokens(writer, tokens, literalLengths, distanceLengths);
  }
}

function writeStored(writer: BitWriter, raw: Uint8Array, final: boolean): void {
  let offset = 0;
  do {
    const length = Math.min(MAX_STORED_LENGTH, raw.length - offset);
    const last = offset + length === raw.length;
    writer.write(final && last ? 1 : 0, 1);
    writer.write(0, 2);
    writer.writeBytes([length & 0xff, length >>> 8, ~length & 0xff, (~length >>> 8) & 0xff]);
    writer.writeBytes(raw.subarray(offset, offset + length));
    offset += length;
  } while (offset < raw.length);
}

function writeTokens(
  writer: BitWriter,
  tokens: Uint16Array,
  literalLengths: Uint8Array,
  distanceLengths: Uint8Array,
): void {
  const literalCodes = reversedCanonicalCodes(literalLengths);
  const distanceCodes = reversedCanonicalCodes(distanceLengths);
  for (const token of tokens) {
    if (token < 256) {
      writer.write(literalCodes[token]!, literalLengths[token]!);
      continue;
    }
    const length = token - 256;
    const code = lengthCode(length);
    writer.write(literalCodes[257 + code]!, literalLengths[257 + code]!);
    writer.write(length - LENGTH_BASES[code]!, LENGTH_EXTRA_BITS[code]!);
    writer.write(distanceCodes[0]!, distanceLengths[0]!);
  }
  writer.write(literalCodes[END_OF_BLOCK]!, literalLengths[END_OF_BLOCK]!);
}

/** Run-length encodes both code length sequences with the code length alphabet. */
function dynamicHeader(
  literalLengths: Uint8Array,
  distanceLengths: Uint8Array,
): {readonly bits: number; write(writer: BitWriter): void} {
  const literalCount = Math.max(257, lastUsed(literalLengths) + 1);
  const distanceCount = Math.max(1, lastUsed(distanceLengths) + 1);
  const lengths = new Uint8Array(literalCount + distanceCount);
  lengths.set(literalLengths.subarray(0, literalCount));
  lengths.set(distanceLengths.subarray(0, distanceCount), literalCount);

  // Pairs of code length symbol and repeat count.
  const tokens: number[] = [];
  for (let index = 0; index < lengths.length;) {
    const length = lengths[index]!;
    let run = 1;
    while (index + run < lengths.length && lengths[index + run] === length) run++;
    index += run;
    if (length === 0) {
      while (run >= 11) {
        const repeat = Math.min(run, 138);
        tokens.push(18, repeat - 11);
        run -= repeat;
      }
      if (run >= 3) {
        tokens.push(17, run - 3);
        run = 0;
      }
    } else {
      tokens.push(length, 0);
      run--;
      while (run >= 3) {
        const repeat = Math.min(run, 6);
        tokens.push(16, repeat - 3);
        run -= repeat;
      }
    }
    for (; run > 0; run--) tokens.push(length, 0);
  }

  const frequencies = new Uint32Array(19);
  for (let index = 0; index < tokens.length; index += 2) frequencies[tokens[index]!]!++;
  const codeLengths = huffmanCodeLengths(withTwoSymbols(frequencies), 7);
  const codes = reversedCanonicalCodes(codeLengths);
  let codeLengthCount = CODE_LENGTH_ORDER.length;
  while (codeLengthCount > 4 && codeLengths[CODE_LENGTH_ORDER[codeLengthCount - 1]!] === 0) {
    codeLengthCount--;
  }

  let bits = 5 + 5 + 4 + 3 * codeLengthCount;
  for (let index = 0; index < tokens.length; index += 2) {
    const symbol = tokens[index]!;
    bits += codeLengths[symbol]! + repeatBits(symbol);
  }
  return {
    bits,
    write(writer) {
      writer.write(literalCount - 257, 5);
      writer.write(distanceCount - 1, 5);
      writer.write(codeLengthCount - 4, 4);
      for (let index = 0; index < codeLengthCount; index++) {
        writer.write(codeLengths[CODE_LENGTH_ORDER[index]!]!, 3);
      }
      for (let index = 0; index < tokens.length; index += 2) {
        const symbol = tokens[index]!;
        writer.write(codes[symbol]!, codeLengths[symbol]!);
        writer.write(tokens[index + 1]!, repeatBits(symbol));
      }
    },
  };
}

function repeatBits(symbol: number): number {
  return symbol === 16 ? 2 : symbol === 17 ? 3 : symbol === 18 ? 7 : 0;
}

function lengthCode(length: number): number {
  let code = 0;
  while (code < 28 && LENGTH_BASES[code + 1]! <= length) code++;
  return code;
}

function lastUsed(lengths: Uint8Array): number {
  let index = lengths.length - 1;
  while (index >= 0 && lengths[index] === 0) index--;
  return index;
}

function withTwoSymbols(frequencies: Uint32Array): Uint32Array {
  const result = Uint32Array.from(frequencies);
  let used = 0;
  for (const frequency of result) if (frequency > 0) used++;
  for (let symbol = 0; used < 2; symbol++) {
    if (result[symbol] === 0) {
      result[symbol] = 1;
      used++;
    }
  }
  return result;
}

function symbolBits(frequencies: Uint32Array, lengths: Uint8Array): number {
  let bits = 0;
  for (let symbol = 0; symbol < frequencies.length; symbol++) {
    bits += frequencies[symbol]! * lengths[symbol]!;
  }
  return bits;
}

function fixedLengths(): readonly [Uint8Array, Uint8Array] {
  if (!fixedLiteralLengths || !fixedDistanceLengths) {
    fixedLiteralLengths = new Uint8Array(288);
    fixedLiteralLengths.fill(8, 0, 144);
    fixedLiteralLengths.fill(9, 144, 256);
    fixedLiteralLengths.fill(7, 256, 280);
    fixedLiteralLengths.fill(8, 280, 288);
    fixedDistanceLengths = new Uint8Array(32).fill(5);
  }
  return [fixedLiteralLengths, fixedDistanceLengths];
}

function adler32(data: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (let offset = 0; offset < data.length; offset += ADLER_CHUNK) {
    const end = Math.min(offset + ADLER_CHUNK, data.length);
    for (let index = offset; index < end; index++) {
      a += data[index]!;
      b += a;
    }
    a %= MODULO;
    b %= MODULO;
  }
  return ((b << 16) | a) >>> 0;
}

/** Looks up the next `bits` input bits. Entries hold the symbol above the code length. */
type Decoder = {readonly table: Uint32Array; readonly bits: number};

/**
 * Decompresses a zlib stream. Throws when the stream is invalid, truncated, or would produce more
 * than `maxOutputLength` bytes.
 */
export function zlibInflate(data: Uint8Array, maxOutputLength: number): Uint8Array {
  if (
    data.length < 2 ||
    (data[0]! & 0x0f) !== 8 ||
    data[0]! >> 4 > 7 ||
    ((data[0]! << 8) | data[1]!) % 31 !== 0 ||
    data[1]! & 0x20
  ) {
    throw new Error('Invalid zlib header');
  }

  let position = 2;
  let bitBuffer = 0;
  let bitCount = 0;
  const fill = (count: number) => {
    while (bitCount < count && position < data.length) {
      bitBuffer |= data[position++]! << bitCount;
      bitCount += 8;
    }
  };
  const read = (count: number): number => {
    if (count === 0) return 0;
    fill(count);
    if (bitCount < count) throw new Error('Unexpected end of zlib data');
    const value = bitBuffer & ((1 << count) - 1);
    bitBuffer >>>= count;
    bitCount -= count;
    return value;
  };
  const decode = ({table, bits}: Decoder): number => {
    fill(bits);
    const entry = table[bitBuffer & ((1 << bits) - 1)]!;
    const length = entry & 15;
    if (length === 0) throw new Error('Invalid zlib code');
    if (length > bitCount) throw new Error('Unexpected end of zlib data');
    bitBuffer >>>= length;
    bitCount -= length;
    return entry >>> 4;
  };
  /** Returns whole bytes that were read ahead to the input. */
  const alignToByte = () => {
    position -= bitCount >> 3;
    bitBuffer = 0;
    bitCount = 0;
  };

  let output = new Uint8Array(Math.min(maxOutputLength, Math.max(1024, data.length * 4)));
  let outputLength = 0;
  const reserve = (count: number) => {
    const required = outputLength + count;
    if (required > maxOutputLength) throw new RangeError('zlib output exceeds the maximum length');
    if (required <= output.length) return;
    const grown = new Uint8Array(Math.min(maxOutputLength, Math.max(required, output.length * 2)));
    grown.set(output.subarray(0, outputLength));
    output = grown;
  };

  for (let final = 0; !final;) {
    final = read(1);
    const type = read(2);
    if (type === 0) {
      alignToByte();
      if (position + 4 > data.length) throw new Error('Unexpected end of zlib data');
      const length = data[position]! | (data[position + 1]! << 8);
      const inverse = data[position + 2]! | (data[position + 3]! << 8);
      position += 4;
      if (length !== (~inverse & 0xffff)) throw new Error('Invalid stored block length');
      if (position + length > data.length) throw new Error('Unexpected end of zlib data');
      reserve(length);
      output.set(data.subarray(position, position + length), outputLength);
      outputLength += length;
      position += length;
      continue;
    }
    if (type === 3) throw new Error('Invalid zlib block type');
    const [literals, distances] =
      type === 1 ? fixedHuffmanDecoders() : readDynamicCodes(read, decode);
    for (;;) {
      const symbol = decode(literals);
      if (symbol < 256) {
        reserve(1);
        output[outputLength++] = symbol;
        continue;
      }
      if (symbol === END_OF_BLOCK) break;
      const code = symbol - 257;
      if (code >= 29) throw new Error('Invalid zlib length code');
      const length = LENGTH_BASES[code]! + read(LENGTH_EXTRA_BITS[code]!);
      const distanceCode = decode(distances);
      if (distanceCode >= 30) throw new Error('Invalid zlib distance code');
      const distance = DISTANCE_BASES[distanceCode]! + read(DISTANCE_EXTRA_BITS[distanceCode]!);
      if (distance > outputLength) throw new Error('Invalid zlib distance');
      reserve(length);
      // Copies byte by byte, because a match may overlap the bytes it produces.
      for (let index = 0; index < length; index++, outputLength++) {
        output[outputLength] = output[outputLength - distance]!;
      }
    }
  }

  alignToByte();
  if (position + 4 > data.length) throw new Error('Unexpected end of zlib data');
  const result = output.subarray(0, outputLength);
  const expected =
    ((data[position]! << 24) |
      (data[position + 1]! << 16) |
      (data[position + 2]! << 8) |
      data[position + 3]!) >>>
    0;
  if (adler32(result) !== expected) throw new Error('Invalid zlib checksum');
  return result;
}

function readDynamicCodes(
  read: (count: number) => number,
  decode: (decoder: Decoder) => number,
): readonly [Decoder, Decoder] {
  const literalCount = read(5) + 257;
  const distanceCount = read(5) + 1;
  const codeLengthCount = read(4) + 4;
  if (literalCount > 286 || distanceCount > 30) throw new Error('Invalid zlib code counts');
  const codeLengthLengths = new Uint8Array(19);
  for (let index = 0; index < codeLengthCount; index++) {
    codeLengthLengths[CODE_LENGTH_ORDER[index]!] = read(3);
  }
  const codeLengthDecoder = createDecoder(codeLengthLengths, false);

  const lengths = new Uint8Array(literalCount + distanceCount);
  for (let index = 0; index < lengths.length;) {
    const symbol = decode(codeLengthDecoder);
    if (symbol < 16) {
      lengths[index++] = symbol;
      continue;
    }
    let value = 0;
    let repeat: number;
    if (symbol === 16) {
      if (index === 0) throw new Error('Invalid zlib code length repeat');
      value = lengths[index - 1]!;
      repeat = 3 + read(2);
    } else if (symbol === 17) {
      repeat = 3 + read(3);
    } else {
      repeat = 11 + read(7);
    }
    if (index + repeat > lengths.length) throw new Error('Invalid zlib code length repeat');
    lengths.fill(value, index, index + repeat);
    index += repeat;
  }
  if (lengths[END_OF_BLOCK] === 0) throw new Error('Missing zlib end-of-block code');
  return [
    createDecoder(lengths.subarray(0, literalCount), true),
    createDecoder(lengths.subarray(literalCount), true),
  ];
}

function fixedHuffmanDecoders(): readonly [Decoder, Decoder] {
  if (!fixedDecoders) {
    const [literals, distances] = fixedLengths();
    fixedDecoders = [createDecoder(literals, false), createDecoder(distances, false)];
  }
  return fixedDecoders;
}

/**
 * Builds a lookup table for canonical code lengths. Over-subscribed codes are invalid. Incomplete
 * codes are only valid with a single one-bit code, or with no codes for unused distances.
 */
function createDecoder(lengths: Uint8Array, allowSingleCode: boolean): Decoder {
  const counts = new Uint16Array(16);
  let maximum = 0;
  for (const length of lengths) {
    if (length === 0) continue;
    counts[length]!++;
    maximum = Math.max(maximum, length);
  }
  let left = 1;
  for (let bits = 1; bits <= 15; bits++) {
    left = left * 2 - counts[bits]!;
    if (left < 0) throw new Error('Over-subscribed zlib code');
  }
  if (left > 0 && !(allowSingleCode && maximum <= 1)) {
    throw new Error('Incomplete zlib code');
  }
  const bits = Math.max(1, maximum);
  const table = new Uint32Array(1 << bits);
  const codes = reversedCanonicalCodes(lengths);
  for (let symbol = 0; symbol < lengths.length; symbol++) {
    const length = lengths[symbol]!;
    if (length === 0) continue;
    for (let index = codes[symbol]!; index < table.length; index += 1 << length) {
      table[index] = (symbol << 4) | length;
    }
  }
  return {table, bits};
}
