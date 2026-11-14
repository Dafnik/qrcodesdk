/*
 * Framework-independent state and wording for the encoding trace panel. This module is part of the
 * initial explanation code, so it imports trace types only; the analysis itself loads on demand.
 */
import type {QRCodeExplainModule, QRCodeExplanation} from './qrcode-analyzer.ts';
import type {
  QRCodeEncodingAnalyzer,
  QRCodeEncodingTrace,
  QRCodeTraceCodeword,
} from './qrcode-trace-types.ts';

export type QRCodeTraceState =
  | {readonly status: 'off'}
  | {readonly status: 'loading'}
  | {readonly status: 'ready'; readonly trace: QRCodeEncodingTrace}
  | {readonly status: 'error'; readonly message: string};

export interface QRCodeTraceInputs {
  readonly enabled: boolean;
  /** `undefined` when the matrix could not be generated. */
  readonly explanation: QRCodeExplanation | undefined;
  readonly analyzer: QRCodeEncodingAnalyzer | undefined;
  readonly loadError: unknown;
}

const OFF: QRCodeTraceState = {status: 'off'};
const LOADING: QRCodeTraceState = {status: 'loading'};

/**
 * Derives the trace from the current explanation, so a trace always belongs to the current inputs
 * and no result of an outdated input can be shown. A disabled trace retains no arrays.
 */
export function resolveTraceState({
  enabled,
  explanation,
  analyzer,
  loadError,
}: QRCodeTraceInputs): QRCodeTraceState {
  if (!enabled || explanation === undefined) return OFF;
  if (loadError !== undefined) {
    return {
      status: 'error',
      message: `The encoding trace could not be loaded: ${errorMessage(loadError)}`,
    };
  }
  if (analyzer === undefined) return LOADING;
  try {
    return {status: 'ready', trace: analyzer(explanation.matrix, explanation.traceRequest)};
  } catch (error) {
    return {status: 'error', message: errorMessage(error)};
  }
}

/**
 * Returns a loader that imports the trace module once. A failed import is not cached, so a later
 * call retries.
 */
export function createTraceLoader<
  TModule extends {readonly analyzeQRCodeEncoding: QRCodeEncodingAnalyzer},
>(importer: () => Promise<TModule>): () => Promise<TModule> {
  let loading: Promise<TModule> | undefined;
  return () =>
    (loading ??= importer().catch((error: unknown) => {
      loading = undefined;
      throw error;
    }));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export const TRACE_PAGE_SIZE = 64;

export interface QRCodeTracePage<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly pageCount: number;
  /** Index of the first item on the page. */
  readonly start: number;
  /** Index after the last item on the page. */
  readonly end: number;
}

/** Returns one page of items, clamping the page to the available pages. */
export function tracePage<T>(
  items: readonly T[],
  page: number,
  pageSize = TRACE_PAGE_SIZE,
): QRCodeTracePage<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const clamped = Math.min(Math.max(0, Math.trunc(page)), pageCount - 1);
  const start = clamped * pageSize;
  const end = Math.min(items.length, start + pageSize);
  return {items: items.slice(start, end), page: clamped, pageCount, start, end};
}

/** Formats a codeword in hexadecimal. A 4-bit codeword shows only its placed high nibble. */
export function formatCodeword(value: number, placedBits: 4 | 8 = 8): string {
  return placedBits === 4
    ? (value >> 4).toString(16).toUpperCase()
    : value.toString(16).toUpperCase().padStart(2, '0');
}

export function formatCodewords(values: readonly number[]): string {
  return values.map((value) => formatCodeword(value)).join(' ');
}

export function formatVersion(version: QRCodeEncodingTrace['symbol']['version']): string {
  return typeof version === 'number' ? `version ${String(version)}` : version;
}

/** For example: "Payload and headers use 142 of 152 data bits." */
export function describeCapacity({capacity}: QRCodeEncodingTrace): string {
  return `Payload and headers use ${String(capacity.usedBits)} of ${String(capacity.dataBits)} data bits.`;
}

export function describeVersionSelection(trace: QRCodeEncodingTrace): string {
  const {symbol, capacity} = trace;
  const version = capitalize(formatVersion(symbol.version));
  const level =
    symbol.errorCorrectionLevel === undefined
      ? 'error detection only'
      : `error correction level ${symbol.errorCorrectionLevel}`;
  if (symbol.versionSelection === 'requested') {
    return `${version} was requested, so it can be larger than these bits need.`;
  }
  const fallback =
    trace.family === 'standard' && trace.symbol.microFallback
      ? 'No Micro QR code holds these bits, so a standard QR code was generated. '
      : '';
  const smaller = capacity.smallerVersion;
  if (smaller === undefined) {
    return `${fallback}${version} is the smallest version that holds these bits at ${level}.`;
  }
  const smallerVersion = formatVersion(smaller.version);
  const reason =
    'unsupported' in smaller
      ? smaller.unsupported === 'mode'
        ? `${smallerVersion} does not support ${trace.segments[0]!.mode} mode`
        : `${smallerVersion} does not support ${level}`
      : `${smallerVersion} holds only ${String(smaller.dataBits)} data bits, but these segments need ${String(smaller.requiredBits)} there`;
  return `${fallback}${version} was selected automatically: ${reason}.`;
}

export function describeMaskSelection({masks}: QRCodeEncodingTrace): string {
  const order = masks.winner === 'lower' ? 'lowest penalty' : 'highest edge score';
  if (masks.selection === 'requested') {
    return `Mask ${String(masks.selected)} was requested. The scores show what automatic selection would compare.`;
  }
  return `Mask ${String(masks.selected)} has the ${order}; ties go to the lower mask number.`;
}

export function describeCodeword(codeword: QRCodeTraceCodeword): string {
  const kind = codeword.kind === 'data' ? 'data' : 'error correction';
  return `block ${String(codeword.blockIndex)} ${kind} codeword ${String(codeword.indexInBlock)}`;
}

/**
 * Names the part of the data bit stream a bit belongs to: a segment field, an ECI header, or
 * padding.
 */
export function describeDataStreamBit(trace: QRCodeEncodingTrace, bit: number): string {
  for (const header of trace.eci) {
    if (bit >= header.bitOffset && bit < header.bitOffset + header.bitLength) {
      return `${header.label} ECI header`;
    }
  }
  for (const segment of trace.segments) {
    const offset = bit - segment.bitOffset;
    if (offset < 0 || offset >= segment.bitLength) continue;
    const field =
      offset < segment.modeBits
        ? 'mode indicator'
        : offset < segment.modeBits + segment.countBits
          ? 'character count'
          : `${segment.mode} payload`;
    return `segment ${String(segment.index)} ${field}`;
  }
  const {terminator, alignment, padCodewords, finalPartialCodeword} = trace.padding;
  if (bit >= terminator.bitOffset && bit < terminator.bitOffset + terminator.bitLength) {
    return 'terminator';
  }
  if (bit >= alignment.bitOffset && bit < alignment.bitOffset + alignment.bitLength) {
    return 'alignment zeros';
  }
  const codeword = bit >> 3;
  if (codeword >= padCodewords.start && codeword < padCodewords.end) return 'pad codeword';
  if (finalPartialCodeword?.codewordIndex === codeword) return 'final 4-bit pad codeword';
  return 'data';
}

/**
 * Describes where an encoded module comes from, for example
 * "block 1 data codeword 3 · segment 0 numeric payload".
 */
export function describeModuleProvenance(
  module: QRCodeExplainModule,
  trace: QRCodeEncodingTrace,
): string | undefined {
  if (module.codewordIndex === undefined) return undefined;
  const codeword = trace.interleaving[module.codewordIndex];
  if (codeword === undefined) return undefined;
  const label = describeCodeword(codeword);
  if (codeword.kind === 'ecc') return label;
  const block = trace.blocks[codeword.blockIndex]!;
  const bit = (block.dataOffset + codeword.indexInBlock) * 8 + (module.codewordBitIndex ?? 0);
  return `${label} · ${describeDataStreamBit(trace, bit)}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
