import {
  type QRCodeEncodingMode,
  type QRCodeErrorCorrectionLevel,
  type QRCodeMask,
  type QRCodeMatrix,
  type QRCodeMatrixOptions,
  type QRCodeSegment,
  type QRCodeSegmenter,
  type QRCodeStandardMatrixOptions,
  QRCodeTextRenderer,
  type QRCodeTextStyle,
  type QRCodeVersion,
  qrcode,
} from '@qrcodesdk/core';
import {type QRCodeMicroMask, type QRCodeMicroVersion, microQR} from '@qrcodesdk/core/micro';
import {automaticSegmenter} from '@qrcodesdk/core/segmenter';

import {MODES_MAP, MODE_ECI} from './qrcode-core-source.ts';
import {
  type QRCodeSymbolFormat,
  createCodewordBitMapper,
  createPlacements,
  readSymbolFormat,
  unmaskModules,
} from './qrcode-symbol.ts';
import type {QRCodeTraceRequest, QRCodeTraceSegmentation} from './qrcode-trace-types.ts';

/** `1` for a dark module and `0` for a light module. */
export type QRCodeExplainModuleValue = 0 | 1;

export type QRCodeExplainRole = 'functional' | 'encoded' | 'remainder';

export interface QRCodeExplainOptions extends QRCodeStandardMatrixOptions, QRCodeTextStyle {
  payload: string;
  optimizeSegments?: boolean;
  /**
   * Generates a Micro QR code with `microQR()`. The standard `version`, `mask`, `eci`,
   * `segmenter`, and `optimizeSegments` options are ignored then, as in the playground.
   */
  micro?: boolean;
  microVersion?: QRCodeMicroVersion;
  microMask?: QRCodeMicroMask;
  microFallback?: boolean;
}

export interface QRCodeExplainModule {
  readonly key: string;
  readonly row: number;
  readonly column: number;
  readonly value: QRCodeExplainModuleValue;
  readonly sourceValue?: QRCodeExplainModuleValue;
  readonly role: QRCodeExplainRole;
  readonly groupId: string;
  readonly placementBitIndex?: number;
  /** Position of the codeword in placement order. */
  readonly codewordIndex?: number;
  /** Bit of the codeword, from 0 for the most significant bit. */
  readonly codewordBitIndex?: number;
}

export interface QRCodeExplainGroup {
  readonly id: string;
  readonly role: QRCodeExplainRole | 'quiet-zone';
  readonly label: string;
  readonly description: string;
  readonly modules: readonly QRCodeExplainModule[];
}

export interface QRCodeExplanation {
  readonly matrix: QRCodeMatrix;
  readonly modules: readonly QRCodeExplainModule[];
  readonly moduleGrid: readonly (readonly QRCodeExplainModule[])[];
  readonly groups: ReadonlyMap<string, QRCodeExplainGroup>;
  readonly symbol: 'standard' | 'micro';
  readonly version: QRCodeVersion | QRCodeMicroVersion;
  readonly mode: QRCodeEncodingMode | 'mixed';
  /** `undefined` for an M1 Micro QR code, which only detects errors. */
  readonly errorCorrectionLevel: QRCodeErrorCorrectionLevel | undefined;
  readonly mask: QRCodeMask | QRCodeMicroMask;
  /** Whether a Micro QR code was requested but did not fit, so a standard QR code was generated. */
  readonly microFallback: boolean;
  readonly moduleSize: number;
  readonly quietZone: number;
  readonly viewSize: number;
  /** What was requested, for the optional encoding trace. */
  readonly traceRequest: QRCodeTraceRequest;
}

export const QR_CODE_EXPLAIN_ROLE_ORDER = [
  'functional',
  'encoded',
  'remainder',
] as const satisfies readonly QRCodeExplainRole[];

export const QR_CODE_EXPLAIN_ROLE_DETAILS = {
  functional: {
    label: 'Functional modules',
    description:
      'Reserved modules used to locate, orient, and configure the QR code during scanning.',
  },
  encoded: {
    label: 'Encoded modules',
    description: 'Placed codeword bits containing headers, payload, padding, and error correction.',
  },
  remainder: {
    label: 'Remainder bits',
    description: 'Unused zero modules that complete the matrix placement path.',
  },
} as const satisfies Record<QRCodeExplainRole, {label: string; description: string}>;

const MODE_NAMES = Object.fromEntries(
  Object.entries(MODES_MAP).map(([name, indicator]) => [indicator, name]),
) as Record<number, QRCodeEncodingMode>;
const MICRO_MODE_NAMES = ['numeric', 'alphanumeric', 'octet', 'kanji'] as const;

type SegmenterCall = {
  readonly version: QRCodeVersion;
  readonly segments: readonly QRCodeSegment[];
};

export function explainQRCode(options: QRCodeExplainOptions): QRCodeExplanation {
  const segmentation = resolveSegmentation(options);
  const segmenterCalls: SegmenterCall[] = [];
  const matrix = qrcode(options.payload)
    .options(createMatrixOptions(options, segmentation, segmenterCalls))
    .matrix();
  const format = readSymbolFormat(matrix);
  // The text renderer validates the shared dimensions without drawing anything.
  QRCodeTextRenderer({style: {moduleSize: options.moduleSize, quietZone: options.quietZone}});
  const moduleSize = options.moduleSize ?? 5;
  const quietZone = options.quietZone ?? 4;

  const {width: size} = matrix;
  const placements = createPlacements(matrix, format.family === 'micro');
  // Micro QR codes have no remainder bits: their placed bits exclude the omitted low nibble.
  const codewordBitCount =
    format.family === 'micro' ? placements.length : Math.floor(placements.length / 8) * 8;
  const unmasked = unmaskModules(matrix, format);
  const toCodewordBit = createCodewordBitMapper(format);
  const placementByIndex = new Int32Array(size * size).fill(-1);
  for (let placementBitIndex = 0; placementBitIndex < placements.length; placementBitIndex++) {
    placementByIndex[placements[placementBitIndex]!] = placementBitIndex;
  }
  const values = matrix.modules;
  const moduleGrid: QRCodeExplainModule[][] = [];
  const modules: QRCodeExplainModule[] = [];
  const modulesByRole: Record<QRCodeExplainRole, QRCodeExplainModule[]> = {
    functional: [],
    encoded: [],
    remainder: [],
  };
  // The literals keep one property order per role, so every module of a role shares one shape.
  for (let row = 0; row < size; row++) {
    const gridRow: QRCodeExplainModule[] = [];
    const keyPrefix = `${String(row)}:`;
    for (let column = 0; column < size; column++) {
      const index = row * size + column;
      const key = keyPrefix + String(column);
      const value = values[index] as QRCodeExplainModuleValue;
      const placementBitIndex = placementByIndex[index]!;
      let module: QRCodeExplainModule;
      if (placementBitIndex < 0) {
        module = {key, row, column, value, role: 'functional', groupId: 'functional'};
        modulesByRole.functional.push(module);
      } else if (placementBitIndex >= codewordBitCount) {
        module = {
          key,
          row,
          column,
          value,
          role: 'remainder',
          groupId: 'remainder',
          placementBitIndex,
        };
        modulesByRole.remainder.push(module);
      } else {
        const codewordBit = toCodewordBit(placementBitIndex);
        module = {
          key,
          row,
          column,
          value,
          role: 'encoded',
          groupId: 'encoded',
          sourceValue: unmasked[index] as QRCodeExplainModuleValue,
          placementBitIndex,
          codewordIndex: codewordBit >> 3,
          codewordBitIndex: codewordBit & 7,
        };
        modulesByRole.encoded.push(module);
      }
      gridRow.push(module);
      modules.push(module);
    }
    moduleGrid.push(gridRow);
  }
  return {
    matrix,
    modules,
    moduleGrid,
    groups: createGroups(modulesByRole),
    symbol: format.family,
    version: format.version,
    mode: resolveMode(options, format, segmenterCalls, (bitCount) =>
      readLeadingBits(unmasked, placements, bitCount),
    ),
    errorCorrectionLevel: format.errorCorrectionLevel,
    mask: format.mask,
    microFallback: options.micro === true && format.family === 'standard',
    moduleSize,
    quietZone,
    viewSize: size + 2 * quietZone,
    traceRequest: createTraceRequest(options, segmentation),
  };
}

function resolveSegmentation(options: QRCodeExplainOptions): QRCodeTraceSegmentation {
  // An explicit mode bypasses any segmenter, and Micro QR codes always hold one segment.
  if (options.micro || (options.mode !== undefined && options.mode !== 'auto')) return 'single';
  if (options.optimizeSegments) return 'automatic';
  return options.segmenter ? 'custom' : 'single';
}

function createMatrixOptions(
  options: QRCodeExplainOptions,
  segmentation: QRCodeTraceSegmentation,
  segmenterCalls: SegmenterCall[],
): QRCodeMatrixOptions {
  const {mode, errorCorrectionLevel, kanji} = options;
  if (options.micro) {
    return {
      symbol: microQR({
        version: options.microVersion,
        mask: options.microMask,
        fallback: options.microFallback,
      }),
      mode,
      kanji,
      errorCorrectionLevel,
    };
  }
  const segmenter = segmentation === 'automatic' ? automaticSegmenter : options.segmenter;
  return {
    mode,
    version: options.version,
    errorCorrectionLevel,
    mask: options.mask,
    eci: options.eci,
    kanji,
    segmenter: segmenter && captureSegmenterCalls(segmenter, segmenterCalls),
  };
}

/**
 * Records the segments of each call the encoder makes, so the mode label needs no extra segmenter
 * calls. The encoder calls a segmenter once per character count width group, or once for a
 * requested version.
 */
function captureSegmenterCalls(
  segmenter: QRCodeSegmenter,
  calls: SegmenterCall[],
): QRCodeSegmenter {
  return (payload, segmenterOptions) => {
    const segments = segmenter(payload, segmenterOptions);
    if (Array.isArray(segments)) calls.push({version: segmenterOptions.version, segments});
    return segments;
  };
}

/** Reads the first data stream bits, which lead the first data codeword in every symbol. */
function readLeadingBits(
  unmasked: Uint8Array,
  placements: readonly number[],
  bitCount: number,
): number {
  let value = 0;
  for (let index = 0; index < bitCount; index++) {
    value = (value << 1) | unmasked[placements[index]!]!;
  }
  return value;
}

/** Reports the mode in the emitted segment headers. */
function resolveMode(
  options: QRCodeExplainOptions,
  format: QRCodeSymbolFormat,
  segmenterCalls: readonly SegmenterCall[],
  readBits: (bitCount: number) => number,
): QRCodeEncodingMode | 'mixed' {
  if (options.mode !== undefined && options.mode !== 'auto') return options.mode;
  if (format.family === 'micro') {
    // M1 only has numeric mode and no mode indicator.
    const indicatorBits = format.versionNumber - 1;
    return MICRO_MODE_NAMES[indicatorBits ? readBits(indicatorBits) : 0]!;
  }

  // The encoder calls the segmenter at the first version of each width group, or at the requested
  // version, so the last call at or below the resolved version produced the encoded segments.
  let call: SegmenterCall | undefined;
  for (const candidate of segmenterCalls) {
    if (candidate.version <= format.version) call = candidate;
  }
  if (call) {
    const modes = new Set(call.segments.map(({mode}) => mode));
    return modes.size > 1 ? 'mixed' : call.segments[0]!.mode;
  }

  // A single segment starts with its mode indicator. The encoder writes the UTF-8 ECI header only
  // before an octet segment.
  const indicator = readBits(4);
  return indicator === MODE_ECI ? 'octet' : MODE_NAMES[indicator]!;
}

function createTraceRequest(
  options: QRCodeExplainOptions,
  segmentation: QRCodeTraceSegmentation,
): QRCodeTraceRequest {
  const micro = options.micro === true;
  return {
    payload: options.payload,
    symbol: micro ? 'micro' : 'standard',
    mode: options.mode ?? 'auto',
    errorCorrectionLevel: options.errorCorrectionLevel ?? 'M',
    version: micro ? options.microVersion : options.version,
    mask: micro ? options.microMask : options.mask,
    fallback: micro && options.microFallback === true,
    segmentation,
    eci: !micro && options.eci === true,
    kanji: options.kanji !== undefined,
  };
}

function createGroups(
  modulesByRole: Readonly<Record<QRCodeExplainRole, readonly QRCodeExplainModule[]>>,
): ReadonlyMap<string, QRCodeExplainGroup> {
  const groups = new Map<string, QRCodeExplainGroup>();
  for (const role of QR_CODE_EXPLAIN_ROLE_ORDER) {
    const details = QR_CODE_EXPLAIN_ROLE_DETAILS[role];
    groups.set(role, {
      ...details,
      id: role,
      role,
      modules: modulesByRole[role],
    });
  }
  groups.set('quiet-zone', {
    id: 'quiet-zone',
    role: 'quiet-zone',
    label: 'Quiet zone',
    description:
      'A clear light border that helps scanners isolate the QR code from its surroundings.',
    modules: [],
  });
  return groups;
}
