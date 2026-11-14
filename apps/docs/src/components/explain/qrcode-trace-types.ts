import type {
  QRCodeEncodingMode,
  QRCodeErrorCorrectionLevel,
  QRCodeMask,
  QRCodeMatrix,
  QRCodeMode,
  QRCodeVersion,
} from '@qrcodesdk/core';
import type {QRCodeMicroMask, QRCodeMicroVersion} from '@qrcodesdk/core/micro';

/*
 * Types of the docs-only encoding trace. They are not a published API.
 * All indexes are zero-based, and every bit range is half-open: `[bitOffset, bitOffset + bitLength)`.
 * Bit offsets count from the start of the data bit stream, before error correction.
 */

/** How the payload was split into segments. */
export type QRCodeTraceSegmentation =
  /** One segment in the requested or automatically resolved mode. */
  | 'single'
  /** The optional mixed-mode `automaticSegmenter`. */
  | 'automatic'
  /** A segmenter supplied by the caller. The trace reports its segments, not why it chose them. */
  | 'custom';

/**
 * What was requested. The trace compares it with what the matrix contains. It holds metadata only,
 * never the segmenter or the Kanji table.
 */
export interface QRCodeTraceRequest {
  readonly payload: string;
  readonly symbol: 'standard' | 'micro';
  readonly mode: QRCodeMode;
  readonly errorCorrectionLevel: QRCodeErrorCorrectionLevel;
  readonly version?: QRCodeVersion | QRCodeMicroVersion;
  readonly mask?: QRCodeMask | QRCodeMicroMask;
  /** Whether a Micro QR code may fall back to a standard QR code. */
  readonly fallback: boolean;
  readonly segmentation: QRCodeTraceSegmentation;
  readonly eci: boolean;
  /** Whether the Kanji table was passed to the encoder. */
  readonly kanji: boolean;
}

export type QRCodeTraceSelection = 'requested' | 'automatic';

export interface QRCodeTraceSymbolBase {
  readonly size: number;
  readonly versionSelection: QRCodeTraceSelection;
  readonly maskSelection: QRCodeTraceSelection;
}

export interface QRCodeStandardTraceSymbol extends QRCodeTraceSymbolBase {
  readonly version: QRCodeVersion;
  readonly errorCorrectionLevel: QRCodeErrorCorrectionLevel;
  readonly mask: QRCodeMask;
  /** Whether a Micro QR code was requested but did not fit, so a standard QR code was generated. */
  readonly microFallback: boolean;
}

export interface QRCodeMicroTraceSymbol extends QRCodeTraceSymbolBase {
  readonly version: QRCodeMicroVersion;
  /** `undefined` for M1, which only detects errors. */
  readonly errorCorrectionLevel: Exclude<QRCodeErrorCorrectionLevel, 'H'> | undefined;
  readonly mask: QRCodeMicroMask;
}

export type QRCodeTraceCountUnit = 'digits' | 'characters' | 'bytes' | 'Kanji characters';

export interface QRCodeTraceSegment {
  readonly index: number;
  readonly mode: QRCodeEncodingMode;
  /** The character count indicator value. Octet mode counts UTF-8 bytes, not string characters. */
  readonly count: number;
  readonly countUnit: QRCodeTraceCountUnit;
  /** The part of the payload this segment encodes. */
  readonly text: string;
  /** Offset of the mode indicator. */
  readonly bitOffset: number;
  readonly modeBits: number;
  readonly countBits: number;
  readonly payloadBits: number;
  readonly bitLength: number;
}

export interface QRCodeTraceECI {
  readonly assignment: number;
  readonly label: string;
  /** The segment that follows the ECI header. */
  readonly segmentIndex: number;
  readonly bitOffset: number;
  readonly bitLength: number;
}

/** The previous version, which automatic version selection rejected. */
export type QRCodeTraceSmallerVersion =
  | {
      readonly version: QRCodeVersion | QRCodeMicroVersion;
      readonly fits: false;
      readonly dataBits: number;
      readonly requiredBits: number;
    }
  | {
      readonly version: QRCodeVersion | QRCodeMicroVersion;
      readonly fits: false;
      readonly unsupported: 'mode' | 'level';
    };

export interface QRCodeTraceCapacity {
  /** Data capacity in bits, excluding error correction. */
  readonly dataBits: number;
  readonly dataCodewords: number;
  readonly errorCorrectionCodewords: number;
  readonly totalCodewords: number;
  /** Mode, character count, and ECI header bits. */
  readonly headerBits: number;
  readonly payloadBits: number;
  /** Header and payload bits. */
  readonly usedBits: number;
  /** Capacity left for the terminator and padding. */
  readonly remainingBits: number;
  /**
   * The next smaller version, when the version was selected automatically and the trace can tell why
   * it was rejected. Omitted when a segmenter could split the payload differently at that version.
   */
  readonly smallerVersion?: QRCodeTraceSmallerVersion;
}

export interface QRCodeTraceBitRange {
  readonly bitOffset: number;
  readonly bitLength: number;
}

export interface QRCodeTracePadding {
  /** Zero bits after the last segment. Shorter than the full terminator when capacity runs out. */
  readonly terminator: QRCodeTraceBitRange & {readonly fullBitLength: number};
  /** Zero bits that complete the last partly used codeword. */
  readonly alignment: QRCodeTraceBitRange;
  /** Data codeword indexes `[start, end)` filled with alternating 0xEC and 0x11 pad codewords. */
  readonly padCodewords: {readonly start: number; readonly end: number};
  /**
   * The final 4-bit data codeword of M1 and M3. Error correction counts its zero low nibble, but
   * placement omits it. `pad` when no data, terminator, or alignment bit reaches it.
   */
  readonly finalPartialCodeword?: {
    readonly codewordIndex: number;
    readonly dataBits: 4;
    readonly omittedBits: 4;
    readonly content: 'data' | 'pad';
  };
}

export interface QRCodeTraceBlock {
  readonly index: number;
  /** Index of the first data codeword of this block in the data codeword sequence. */
  readonly dataOffset: number;
  readonly dataCodewords: readonly number[];
  readonly errorCorrectionCodewords: readonly number[];
}

export interface QRCodeTraceCodeword {
  /** Position in placement order. */
  readonly position: number;
  readonly blockIndex: number;
  readonly kind: 'data' | 'ecc';
  readonly indexInBlock: number;
  readonly value: number;
  /** 4 for the final data codeword of M1 and M3, otherwise 8. */
  readonly placedBits: 4 | 8;
}

export interface QRCodeStandardTraceMaskCandidate {
  readonly mask: QRCodeMask;
  /** Total penalty of the four rules. Lower wins. */
  readonly score: number;
}

export interface QRCodeMicroTraceMaskCandidate {
  readonly mask: QRCodeMicroMask;
  /** Edge score. Higher wins. */
  readonly score: number;
  /** Dark modules in the right column and bottom row, excluding the timing patterns. */
  readonly rightEdge: number;
  readonly bottomEdge: number;
}

export interface QRCodeTraceMasks<TCandidate extends {readonly mask: number}> {
  readonly selected: TCandidate['mask'];
  readonly selection: QRCodeTraceSelection;
  /** Ties go to the lower mask number. */
  readonly winner: 'lower' | 'higher';
  readonly candidates: readonly TCandidate[];
}

interface QRCodeEncodingTraceBase {
  readonly segmentation: QRCodeTraceSegmentation;
  readonly segments: readonly QRCodeTraceSegment[];
  readonly eci: readonly QRCodeTraceECI[];
  readonly capacity: QRCodeTraceCapacity;
  readonly padding: QRCodeTracePadding;
  readonly blocks: readonly QRCodeTraceBlock[];
  readonly interleaving: readonly QRCodeTraceCodeword[];
  /** Placement bits after the last codeword, left zero. */
  readonly remainderBits: number;
}

export interface QRCodeStandardEncodingTrace extends QRCodeEncodingTraceBase {
  readonly family: 'standard';
  readonly symbol: QRCodeStandardTraceSymbol;
  readonly masks: QRCodeTraceMasks<QRCodeStandardTraceMaskCandidate>;
}

export interface QRCodeMicroEncodingTrace extends QRCodeEncodingTraceBase {
  readonly family: 'micro';
  readonly symbol: QRCodeMicroTraceSymbol;
  readonly masks: QRCodeTraceMasks<QRCodeMicroTraceMaskCandidate>;
}

export type QRCodeEncodingTrace = QRCodeStandardEncodingTrace | QRCodeMicroEncodingTrace;

export type QRCodeEncodingAnalyzer = (
  matrix: QRCodeMatrix,
  request: QRCodeTraceRequest,
) => QRCodeEncodingTrace;
