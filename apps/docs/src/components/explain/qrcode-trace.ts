import type {QRCodeEncodingMode, QRCodeMask, QRCodeMatrix, QRCodeVersion} from '@qrcodesdk/core';
import type {QRCodeMicroMask} from '@qrcodesdk/core/micro';

import {
  ECI_UTF8_ASSIGNMENT,
  ECI_UTF8_BIT_LENGTH,
  MODES_MAP,
  MODE_ECI,
  type QRCodeMicroLevel,
  type QRCodeMicroVersionNumber,
  type QRCodeSupportedModeIndicator,
  applyMaskToMatrix,
  augmentECCs,
  calculateECC,
  evaluateMatrix,
  evaluateMicroMatrix,
  fillFormatInformationInMatrix,
  fillMicroFormatInformation,
  getCharacterCountBits,
  getErrorCorrectionBlockCount,
  getErrorCorrectionCodewordsPerBlock,
  getGF256GeneratorPolynomial,
  getMicroCharacterCountBits,
  getMicroDataBits,
  getMicroDataCodewords,
  getMicroErrorCorrectionCodewords,
  getMicroSegmentBitLength,
  getMicroSymbolNumber,
  getNumberOfAvailableBitsForData,
  getPayloadBitLength,
  supportsMicroMode,
} from './qrcode-core-source.ts';
import {
  MICRO_STANDARD_MASKS,
  MICRO_VERSIONS,
  type QRCodeMicroSymbolFormat,
  type QRCodeStandardSymbolFormat,
  createCodewordBitMapper,
  createPlacements,
  matrixRoles,
  readSymbolFormat,
  unmaskModules,
} from './qrcode-symbol.ts';
import type {
  QRCodeEncodingAnalyzer,
  QRCodeMicroEncodingTrace,
  QRCodeMicroTraceMaskCandidate,
  QRCodeStandardEncodingTrace,
  QRCodeStandardTraceMaskCandidate,
  QRCodeTraceBlock,
  QRCodeTraceCapacity,
  QRCodeTraceCodeword,
  QRCodeTraceCountUnit,
  QRCodeTraceECI,
  QRCodeTracePadding,
  QRCodeTraceRequest,
  QRCodeTraceSegment,
  QRCodeTraceSelection,
  QRCodeTraceSmallerVersion,
} from './qrcode-trace-types.ts';

const MODE_NAMES = Object.fromEntries(
  Object.entries(MODES_MAP).map(([name, indicator]) => [indicator, name]),
) as Partial<Record<number, QRCodeEncodingMode>>;
const COUNT_UNITS = {
  numeric: 'digits',
  alphanumeric: 'characters',
  octet: 'bytes',
  kanji: 'Kanji characters',
} as const satisfies Record<QRCodeEncodingMode, QRCodeTraceCountUnit>;
const PAD_CODEWORDS = [0xec, 0x11] as const;
// Micro QR level indexes: 0 L, 1 M, and 2 Q.
const MICRO_LEVELS = ['L', 'M', 'Q'] as const;
const STANDARD_TERMINATOR_BITS = 4;
const STANDARD_MODE_BITS = 4;

/**
 * Explains how the encoder produced a matrix: its segments, padding, error-correction blocks,
 * codeword placement, and mask scores. It reads the encoded result from the matrix and checks it
 * with the encoder's own helpers instead of encoding the payload again, so it never calls a
 * segmenter or needs the Kanji table.
 *
 * @throws When the matrix does not match the request or fails a consistency check.
 */
export const analyzeQRCodeEncoding: QRCodeEncodingAnalyzer = (matrix, request) => {
  const format = readSymbolFormat(matrix);
  return format.family === 'micro'
    ? analyzeMicro(matrix, request, format)
    : analyzeStandard(matrix, request, format);
};

function analyzeStandard(
  matrix: QRCodeMatrix,
  request: QRCodeTraceRequest,
  format: QRCodeStandardSymbolFormat,
): QRCodeStandardEncodingTrace {
  const microFallback = request.symbol === 'micro';
  if (microFallback && !request.fallback) mismatch('a Micro QR code was requested');
  const versionSelection = selection(microFallback ? undefined : request.version);
  const maskSelection = selection(microFallback ? undefined : request.mask);
  if (versionSelection === 'requested' && request.version !== format.version) {
    mismatch('the version differs from the requested version');
  }

  const {version, levelValue, size} = format;
  const unmasked = unmaskModules(matrix, format);
  const placements = createPlacements(matrix, false);
  const blockCount = getErrorCorrectionBlockCount(version, levelValue);
  const errorCorrectionPerBlock = getErrorCorrectionCodewordsPerBlock(version, levelValue);
  const dataBits = getNumberOfAvailableBitsForData(version, levelValue);
  const dataCodewordCount = dataBits >> 3;
  const totalCodewords = dataCodewordCount + blockCount * errorCorrectionPerBlock;
  if (placements.length >> 3 !== totalCodewords) {
    throw new Error('Encoding trace: The data region does not match the codeword count');
  }

  const placed = readPlacedCodewords(unmasked, placements, totalCodewords * 8, (bit) => bit);
  const {blocks, interleaving} = splitIntoBlocks(
    placed,
    dataCodewordCount,
    blockCount,
    errorCorrectionPerBlock,
  );
  const dataCodewords = blocks.flatMap((block) => block.dataCodewords);
  const generator = getGF256GeneratorPolynomial(errorCorrectionPerBlock);
  checkErrorCorrection(blocks, generator);
  // The encoder's own interleaving function must produce the placed codeword sequence from the data.
  if (!sameValues(augmentECCs(dataCodewords, blockCount, generator), placed)) {
    throw new Error('Encoding trace: The codewords are not interleaved as the encoder does');
  }

  const stream = parseStandardStream(dataCodewords, version, request.payload);
  const padding = analyzePadding(dataCodewords, stream, dataBits, STANDARD_TERMINATOR_BITS);
  const segmentation = microFallback ? 'single' : request.segmentation;
  const capacity = createCapacity(
    stream,
    dataBits,
    dataCodewordCount,
    totalCodewords,
    versionSelection === 'automatic' && version > 1
      ? standardSmallerVersion(stream, version, levelValue, segmentation === 'single')
      : undefined,
  );

  const roles = matrixRoles(matrix);
  const candidates = Array.from({length: 8}, (_, index): QRCodeStandardTraceMaskCandidate => {
    const mask = index as QRCodeMask;
    const candidate = applyMaskToMatrix(unmasked.slice(), roles, size, mask);
    fillFormatInformationInMatrix(candidate, size, levelValue, mask);
    if (mask === format.mask) checkReconstruction(candidate, matrix);
    // Without a score limit the evaluator returns the exact score instead of exiting early.
    return {mask, score: evaluateMatrix(candidate, size)};
  });
  checkMaskSelection(maskSelection, request, candidates, format.mask, 'lower');

  return {
    family: 'standard',
    symbol: {
      size,
      version,
      errorCorrectionLevel: format.errorCorrectionLevel,
      mask: format.mask,
      microFallback,
      versionSelection,
      maskSelection,
    },
    segmentation,
    segments: stream.segments,
    eci: stream.eci,
    capacity,
    padding,
    blocks,
    interleaving,
    remainderBits: placements.length - totalCodewords * 8,
    masks: {selected: format.mask, selection: maskSelection, winner: 'lower', candidates},
  };
}

function analyzeMicro(
  matrix: QRCodeMatrix,
  request: QRCodeTraceRequest,
  format: QRCodeMicroSymbolFormat,
): QRCodeMicroEncodingTrace {
  if (request.symbol !== 'micro') mismatch('a standard QR code was requested');
  const versionSelection = selection(request.version);
  const maskSelection = selection(request.mask);
  if (versionSelection === 'requested' && request.version !== format.version) {
    mismatch('the version differs from the requested version');
  }

  const {versionNumber, symbolNumber, dataBits, size} = format;
  const unmasked = unmaskModules(matrix, format);
  const placements = createPlacements(matrix, true);
  const dataCodewordCount = getMicroDataCodewords(versionNumber, symbolNumber);
  const errorCorrectionCount = getMicroErrorCorrectionCodewords(symbolNumber);
  const totalCodewords = dataCodewordCount + errorCorrectionCount;
  const placedBits = totalCodewords * 8 - (dataCodewordCount * 8 - dataBits);
  if (placements.length !== placedBits) {
    throw new Error('Encoding trace: The data region does not match the codeword count');
  }

  // The omitted low nibble of a final 4-bit data codeword stays zero.
  const codewords = readPlacedCodewords(
    unmasked,
    placements,
    totalCodewords * 8,
    createCodewordBitMapper(format),
  );
  const dataCodewords = codewords.slice(0, dataCodewordCount);
  const block: QRCodeTraceBlock = {
    index: 0,
    dataOffset: 0,
    dataCodewords,
    errorCorrectionCodewords: codewords.slice(dataCodewordCount),
  };
  checkErrorCorrection([block], getGF256GeneratorPolynomial(errorCorrectionCount));
  const interleaving = codewords.map((value, position): QRCodeTraceCodeword => ({
    position,
    blockIndex: 0,
    kind: position < dataCodewordCount ? 'data' : 'ecc',
    indexInBlock: position < dataCodewordCount ? position : position - dataCodewordCount,
    value,
    placedBits: position === dataBits >> 3 && dataBits % 8 ? 4 : 8,
  }));

  const stream = parseMicroStream(dataCodewords, dataBits, versionNumber, request.payload);
  const padding = analyzePadding(dataCodewords, stream, dataBits, versionNumber * 2 + 1);
  const capacity = createCapacity(
    stream,
    dataBits,
    dataCodewordCount,
    totalCodewords,
    // Automatic selection starts at M2: M1 only detects errors, so it is used only when requested.
    versionSelection === 'automatic' && versionNumber > 2
      ? microSmallerVersion(stream.segments[0]!, versionNumber, format)
      : undefined,
  );

  const roles = matrixRoles(matrix);
  const candidates = MICRO_STANDARD_MASKS.map(
    (standardMask, index): QRCodeMicroTraceMaskCandidate => {
      const mask = index as QRCodeMicroMask;
      const candidate = applyMaskToMatrix(unmasked.slice(), roles, size, standardMask);
      // The encoder scores the candidates before it writes the format information.
      const score = evaluateMicroMatrix(candidate, size);
      if (mask === format.mask) {
        checkReconstruction(
          fillMicroFormatInformation(candidate, size, symbolNumber, mask),
          matrix,
        );
      }
      let rightEdge = 0;
      let bottomEdge = 0;
      for (let i = 1; i < size; i++) {
        rightEdge += candidate[i * size + size - 1]!;
        bottomEdge += candidate[(size - 1) * size + i]!;
      }
      return {mask, score, rightEdge, bottomEdge};
    },
  );
  checkMaskSelection(maskSelection, request, candidates, format.mask, 'higher');

  return {
    family: 'micro',
    symbol: {
      size,
      version: format.version,
      errorCorrectionLevel: format.errorCorrectionLevel,
      mask: format.mask,
      versionSelection,
      maskSelection,
    },
    segmentation: 'single',
    segments: stream.segments,
    eci: [],
    capacity,
    padding,
    blocks: [block],
    interleaving,
    remainderBits: 0,
    masks: {selected: format.mask, selection: maskSelection, winner: 'higher', candidates},
  };
}

function selection(requested: unknown): QRCodeTraceSelection {
  return requested === undefined ? 'automatic' : 'requested';
}

function mismatch(reason: string): never {
  throw new Error(`Encoding trace: The matrix does not match the request: ${reason}`);
}

/** Reads the placed codewords; `codewordBit` maps a placement bit to its codeword bit. */
function readPlacedCodewords(
  unmasked: Uint8Array,
  placements: readonly number[],
  codewordBitCount: number,
  codewordBit: (placementBit: number) => number,
): number[] {
  const codewords = new Array<number>(codewordBitCount >> 3).fill(0);
  const placedBitCount = Math.min(placements.length, codewordBitCount);
  for (let placementBit = 0; placementBit < placedBitCount; placementBit++) {
    const bit = codewordBit(placementBit);
    codewords[bit >> 3]! |= unmasked[placements[placementBit]!]! << (~bit & 7);
  }
  return codewords;
}

/**
 * Splits the placed codewords into blocks. Data codewords are interleaved first, one from each block
 * in turn, then the extra codeword of each longer block, then the error-correction codewords
 * (ISO/IEC 18004:2015 7.6).
 */
function splitIntoBlocks(
  placed: readonly number[],
  dataCodewordCount: number,
  blockCount: number,
  errorCorrectionPerBlock: number,
): {blocks: QRCodeTraceBlock[]; interleaving: QRCodeTraceCodeword[]} {
  const shortLength = Math.floor(dataCodewordCount / blockCount);
  // Blocks before the pivot hold `shortLength` data codewords, the others one more.
  const pivot = blockCount - (dataCodewordCount % blockCount);
  const data = Array.from({length: blockCount}, (): number[] => []);
  const errorCorrection = Array.from({length: blockCount}, (): number[] => []);
  const interleaving: QRCodeTraceCodeword[] = [];
  const take = (blockIndex: number, kind: QRCodeTraceCodeword['kind']) => {
    const target = (kind === 'data' ? data : errorCorrection)[blockIndex]!;
    const position = interleaving.length;
    const value = placed[position]!;
    interleaving.push({
      position,
      blockIndex,
      kind,
      indexInBlock: target.length,
      value,
      placedBits: 8,
    });
    target.push(value);
  };

  for (let index = 0; index < shortLength; index++) {
    for (let block = 0; block < blockCount; block++) take(block, 'data');
  }
  for (let block = pivot; block < blockCount; block++) take(block, 'data');
  for (let index = 0; index < errorCorrectionPerBlock; index++) {
    for (let block = 0; block < blockCount; block++) take(block, 'ecc');
  }

  let dataOffset = 0;
  const blocks = data.map((dataCodewords, index): QRCodeTraceBlock => {
    const block = {
      index,
      dataOffset,
      dataCodewords,
      errorCorrectionCodewords: errorCorrection[index]!,
    };
    dataOffset += dataCodewords.length;
    return block;
  });
  return {blocks, interleaving};
}

function checkErrorCorrection(blocks: readonly QRCodeTraceBlock[], generator: number[]): void {
  for (const block of blocks) {
    if (
      !sameValues(calculateECC([...block.dataCodewords], generator), block.errorCorrectionCodewords)
    ) {
      throw new Error(
        `Encoding trace: Block ${block.index} error-correction codewords do not match its data`,
      );
    }
  }
}

function checkReconstruction(candidate: Uint8Array, matrix: QRCodeMatrix): void {
  if (!sameValues(candidate, matrix.modules)) {
    throw new Error('Encoding trace: The selected mask does not reproduce the matrix');
  }
}

function checkMaskSelection(
  maskSelection: QRCodeTraceSelection,
  request: QRCodeTraceRequest,
  candidates: readonly {readonly mask: number; readonly score: number}[],
  selected: number,
  winner: 'lower' | 'higher',
): void {
  if (maskSelection === 'requested') {
    if (request.mask !== selected) mismatch('the mask differs from the requested mask');
    return;
  }
  // Like the encoder, keep the first candidate unless a later one is strictly better.
  let best = candidates[0]!;
  for (const candidate of candidates) {
    if (winner === 'lower' ? candidate.score < best.score : candidate.score > best.score) {
      best = candidate;
    }
  }
  if (best.mask !== selected) {
    throw new Error('Encoding trace: The automatic mask choice differs from the encoder');
  }
}

function sameValues(first: ArrayLike<number>, second: ArrayLike<number>): boolean {
  if (first.length !== second.length) return false;
  for (let index = 0; index < first.length; index++) {
    if (first[index] !== second[index]) return false;
  }
  return true;
}

/** Reads bits from the data codewords, most significant bit first. */
class BitReader {
  position = 0;

  constructor(
    private readonly codewords: readonly number[],
    readonly capacity: number,
  ) {}

  get remaining(): number {
    return this.capacity - this.position;
  }

  read(bitCount: number): number {
    if (bitCount > this.remaining) {
      throw new Error('Encoding trace: A segment runs past the data capacity');
    }
    let value = 0;
    for (let index = 0; index < bitCount; index++, this.position++) {
      value = value * 2 + ((this.codewords[this.position >> 3]! >> (~this.position & 7)) & 1);
    }
    return value;
  }

  skip(bitCount: number): void {
    if (bitCount > this.remaining) {
      throw new Error('Encoding trace: A segment runs past the data capacity');
    }
    this.position += bitCount;
  }

  isZero(bitOffset: number, bitLength: number): boolean {
    for (let bit = bitOffset; bit < bitOffset + bitLength; bit++) {
      if ((this.codewords[bit >> 3]! >> (~bit & 7)) & 1) return false;
    }
    return true;
  }
}

/** Takes the payload text of each segment in turn, to label the segments. */
class PayloadCursor {
  private offset = 0;

  constructor(private readonly payload: string) {}

  /** Octet counts are UTF-8 bytes; the other modes count UTF-16 code units, as the encoder does. */
  take(mode: QRCodeEncodingMode, count: number): string {
    const start = this.offset;
    if (mode === 'octet') {
      let bytes = 0;
      while (bytes < count) {
        const codePoint = this.payload.codePointAt(this.offset);
        if (codePoint === undefined) break;
        // A lone surrogate is encoded as the 3-byte replacement character.
        bytes += codePoint < 0x80 ? 1 : codePoint < 0x800 ? 2 : codePoint < 0x10000 ? 3 : 4;
        this.offset += codePoint > 0xffff ? 2 : 1;
      }
      if (bytes !== count) mismatch('the segments do not match the payload');
    } else {
      this.offset += count;
      if (this.offset > this.payload.length) mismatch('the segments do not match the payload');
    }
    return this.payload.slice(start, this.offset);
  }

  finish(): void {
    if (this.offset !== this.payload.length) mismatch('the segments do not cover the payload');
  }
}

type ParsedStream = {
  readonly segments: QRCodeTraceSegment[];
  readonly eci: QRCodeTraceECI[];
  /** Data stream bit offset after the terminator. */
  readonly end: number;
  readonly terminatorOffset: number;
  readonly mode: (segment: QRCodeTraceSegment) => QRCodeSupportedModeIndicator;
};

function createSegment(
  index: number,
  mode: QRCodeEncodingMode,
  count: number,
  text: string,
  bitOffset: number,
  modeBits: number,
  countBits: number,
  payloadBits: number,
): QRCodeTraceSegment {
  return {
    index,
    mode,
    count,
    countUnit: COUNT_UNITS[mode],
    text,
    bitOffset,
    modeBits,
    countBits,
    payloadBits,
    bitLength: modeBits + countBits + payloadBits,
  };
}

function parseStandardStream(
  dataCodewords: readonly number[],
  version: QRCodeVersion,
  payload: string,
): ParsedStream {
  const reader = new BitReader(dataCodewords, dataCodewords.length * 8);
  const cursor = new PayloadCursor(payload);
  const segments: QRCodeTraceSegment[] = [];
  const eci: QRCodeTraceECI[] = [];
  let terminatorOffset: number | undefined;

  // A terminator shorter than 4 bits means the capacity ran out (ISO/IEC 18004:2015 7.4.9).
  while (reader.remaining >= STANDARD_MODE_BITS) {
    const bitOffset = reader.position;
    const indicator = reader.read(STANDARD_MODE_BITS);
    if (indicator === 0) {
      terminatorOffset = bitOffset;
      break;
    }
    if (indicator === MODE_ECI) {
      const assignment = reader.read(ECI_UTF8_BIT_LENGTH - STANDARD_MODE_BITS);
      eci.push({
        assignment,
        label: assignment === ECI_UTF8_ASSIGNMENT ? 'UTF-8' : `Assignment ${String(assignment)}`,
        segmentIndex: segments.length,
        bitOffset,
        bitLength: ECI_UTF8_BIT_LENGTH,
      });
      continue;
    }
    const mode = MODE_NAMES[indicator];
    if (mode === undefined) throw new Error('Encoding trace: Unknown mode indicator');
    const modeIndicator = indicator as QRCodeSupportedModeIndicator;
    const countBits = getCharacterCountBits(modeIndicator, version);
    const count = reader.read(countBits);
    const payloadBits = getPayloadBitLength(modeIndicator, count);
    reader.skip(payloadBits);
    segments.push(
      createSegment(
        segments.length,
        mode,
        count,
        cursor.take(mode, count),
        bitOffset,
        STANDARD_MODE_BITS,
        countBits,
        payloadBits,
      ),
    );
  }
  cursor.finish();

  terminatorOffset ??= reader.position;
  const terminatorBits = Math.min(STANDARD_TERMINATOR_BITS, reader.capacity - terminatorOffset);
  if (!reader.isZero(terminatorOffset, terminatorBits)) {
    throw new Error('Encoding trace: The terminator is not zero');
  }
  return {
    segments,
    eci,
    end: terminatorOffset + terminatorBits,
    terminatorOffset,
    mode: (segment) => MODES_MAP[segment.mode],
  };
}

function parseMicroStream(
  dataCodewords: readonly number[],
  dataBits: number,
  version: QRCodeMicroVersionNumber,
  payload: string,
): ParsedStream {
  const reader = new BitReader(dataCodewords, dataBits);
  const cursor = new PayloadCursor(payload);
  // Micro QR codes hold one segment. M1 only has numeric mode and no mode indicator; the others
  // use `version - 1` bits for the bit position of the standard indicator.
  const modeBits = version - 1;
  const modeIndicator = (1 << reader.read(modeBits)) as QRCodeSupportedModeIndicator;
  const mode = MODE_NAMES[modeIndicator];
  if (mode === undefined) throw new Error('Encoding trace: Unknown mode indicator');
  const countBits = getMicroCharacterCountBits(version, modeIndicator);
  const count = reader.read(countBits);
  const payloadBits = getPayloadBitLength(modeIndicator, count);
  reader.skip(payloadBits);
  const segment = createSegment(
    0,
    mode,
    count,
    cursor.take(mode, count),
    0,
    modeBits,
    countBits,
    payloadBits,
  );
  cursor.finish();

  const terminatorOffset = reader.position;
  const terminatorBits = Math.min(version * 2 + 1, reader.remaining);
  if (!reader.isZero(terminatorOffset, terminatorBits)) {
    throw new Error('Encoding trace: The terminator is not zero');
  }
  return {
    segments: [segment],
    eci: [],
    end: terminatorOffset + terminatorBits,
    terminatorOffset,
    mode: () => modeIndicator,
  };
}

function analyzePadding(
  dataCodewords: readonly number[],
  {terminatorOffset, end}: ParsedStream,
  dataBits: number,
  fullTerminatorBits: number,
): QRCodeTracePadding {
  const reader = new BitReader(dataCodewords, dataBits);
  const fullCodewords = dataBits >> 3;
  const alignmentEnd = Math.min((end + 7) & ~7, dataBits);
  if (!reader.isZero(end, alignmentEnd - end)) {
    throw new Error('Encoding trace: The alignment bits are not zero');
  }
  const padStart = Math.min((end + 7) >> 3, fullCodewords);
  for (let index = padStart; index < fullCodewords; index++) {
    if (dataCodewords[index] !== PAD_CODEWORDS[(index - padStart) % 2]) {
      throw new Error('Encoding trace: The pad codewords do not alternate 0xEC and 0x11');
    }
  }

  const padding: QRCodeTracePadding = {
    terminator: {
      bitOffset: terminatorOffset,
      bitLength: end - terminatorOffset,
      fullBitLength: fullTerminatorBits,
    },
    alignment: {bitOffset: end, bitLength: alignmentEnd - end},
    padCodewords: {start: padStart, end: fullCodewords},
  };
  if (dataBits % 8 === 0) return padding;

  const codewordIndex = fullCodewords;
  const content = end > codewordIndex * 8 ? 'data' : 'pad';
  if (content === 'pad' && dataCodewords[codewordIndex] !== 0) {
    throw new Error('Encoding trace: The final 4-bit data codeword is not zero');
  }
  return {
    ...padding,
    finalPartialCodeword: {codewordIndex, dataBits: 4, omittedBits: 4, content},
  };
}

function createCapacity(
  stream: ParsedStream,
  dataBits: number,
  dataCodewords: number,
  totalCodewords: number,
  smallerVersion: QRCodeTraceSmallerVersion | undefined,
): QRCodeTraceCapacity {
  let headerBits = 0;
  let payloadBits = 0;
  for (const segment of stream.segments) {
    headerBits += segment.modeBits + segment.countBits;
    payloadBits += segment.payloadBits;
  }
  for (const header of stream.eci) headerBits += header.bitLength;
  const usedBits = headerBits + payloadBits;
  return {
    dataBits,
    dataCodewords,
    errorCorrectionCodewords: totalCodewords - dataCodewords,
    totalCodewords,
    headerBits,
    payloadBits,
    usedBits,
    remainingBits: dataBits - usedBits,
    ...(smallerVersion ? {smallerVersion} : {}),
  };
}

function countWidthGroup(version: QRCodeVersion): number {
  return version < 10 ? 0 : version < 27 ? 1 : 2;
}

/**
 * Bits the same segments need at the next smaller version. A segmenter is called once per character
 * count width group, so across a group boundary it could have split the payload differently.
 */
function standardSmallerVersion(
  stream: ParsedStream,
  version: QRCodeVersion,
  levelValue: QRCodeStandardSymbolFormat['levelValue'],
  singleSegment: boolean,
): QRCodeTraceSmallerVersion | undefined {
  const smaller = (version - 1) as QRCodeVersion;
  if (!singleSegment && countWidthGroup(smaller) !== countWidthGroup(version)) return undefined;
  let requiredBits = 0;
  for (const segment of stream.segments) {
    const mode = stream.mode(segment);
    requiredBits += STANDARD_MODE_BITS + getCharacterCountBits(mode, smaller) + segment.payloadBits;
  }
  for (const header of stream.eci) requiredBits += header.bitLength;
  const dataBits = getNumberOfAvailableBitsForData(smaller, levelValue);
  return requiredBits > dataBits
    ? {version: smaller, fits: false, dataBits, requiredBits}
    : undefined;
}

function microSmallerVersion(
  segment: QRCodeTraceSegment,
  version: QRCodeMicroVersionNumber,
  format: QRCodeMicroSymbolFormat,
): QRCodeTraceSmallerVersion | undefined {
  const smaller = (version - 1) as QRCodeMicroVersionNumber;
  const label = MICRO_VERSIONS[smaller - 1];
  const level = MICRO_LEVELS.indexOf(format.errorCorrectionLevel!) as QRCodeMicroLevel;
  const symbolNumber = getMicroSymbolNumber(smaller, level, false);
  if (symbolNumber < 0) return {version: label, fits: false, unsupported: 'level'};
  const mode = MODES_MAP[segment.mode];
  if (!supportsMicroMode(smaller, mode)) {
    return {version: label, fits: false, unsupported: 'mode'};
  }
  const dataBits = getMicroDataBits(smaller, symbolNumber);
  const requiredBits = getMicroSegmentBitLength(smaller, {
    mode,
    payload: new Array<number>(segment.count).fill(0),
  });
  return requiredBits > dataBits
    ? {version: label, fits: false, dataBits, requiredBits}
    : undefined;
}
