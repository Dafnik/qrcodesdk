import {QRCodeError} from '../error';
import {throwInvalid} from '../options';
import type {
  QRCodePayload,
  QRCodeSegment,
  QRCodeSegmenter,
  QRCodeStandardMatrixOptions,
  QRCodeVersion,
} from '../types';
import {ECC_LEVELS_MAP} from './error-correction';
import {getNumberOfAvailableBitsForData} from './get-number-of-available-bits-for-data';
import {type QRCodeKanjiLookup, resolveKanjiLookup, throwMissingKanji} from './kanji';
import {resolveMode} from './mode';
import {createSingleSegment, getSegmentsBitLength} from './segments';
import type {QRCodeErrorCorrectionLevelValue, QRCodeResolvedMatrixOptions} from './types';

export function resolveQRCodeMatrixOptions(
  payload: QRCodePayload,
  options: QRCodeStandardMatrixOptions = {},
): QRCodeResolvedMatrixOptions {
  if (typeof payload === 'number' && (!Number.isSafeInteger(payload) || payload < 0)) {
    throw invalidPayload({payload});
  }
  const {eci = false, mask, version: requestedVersion} = options;
  if (options.segmenter !== undefined && typeof options.segmenter !== 'function') {
    throwInvalid('segmenter', 'a function', options.segmenter);
  }
  const kanjiLookup = resolveKanjiLookup(options.kanji);
  if (options.mode === 'kanji' && !kanjiLookup) throwMissingKanji();

  let forcedSegments: QRCodeResolvedMatrixOptions['segments'] | undefined;
  if (!options.segmenter || (options.mode !== undefined && options.mode !== 'auto')) {
    const segment = createSingleSegment(
      resolveMode(payload, options.mode, kanjiLookup),
      payload,
      kanjiLookup,
    );
    if (!segment) throw invalidPayload({payload, mode: options.mode});
    forcedSegments = [segment];
  }
  const segmentsFor = (version: QRCodeVersion) =>
    createSegments(options.segmenter!, payload, version, eci, options.kanji, kanjiLookup);

  const errorCorrectionLevel =
    ECC_LEVELS_MAP[(options.errorCorrectionLevel ?? 'M') as keyof typeof ECC_LEVELS_MAP];

  let resolved: Pick<QRCodeResolvedMatrixOptions, 'segments' | 'version'> | undefined;
  if (requestedVersion !== undefined) {
    const segments = forcedSegments ?? segmentsFor(requestedVersion);
    if (!segmentsFitVersion(segments, requestedVersion, errorCorrectionLevel, eci)) {
      throw new QRCodeError('PAYLOAD_TOO_LARGE', 'QRCode: Payload too large', {
        details: {version: requestedVersion},
      });
    }
    resolved = {segments, version: requestedVersion};
  } else {
    // Character count indicator widths change at versions 10 and 27.
    search: for (const [start, end] of [
      [1, 9],
      [10, 26],
      [27, 40],
    ] as const) {
      const segments = forcedSegments ?? segmentsFor(start);
      for (let version = start; version <= end; version++) {
        if (segmentsFitVersion(segments, version as QRCodeVersion, errorCorrectionLevel, eci)) {
          resolved = {segments, version: version as QRCodeVersion};
          break search;
        }
      }
    }
    if (!resolved) throw new QRCodeError('PAYLOAD_TOO_LARGE', 'QRCode: Payload too large');
  }

  return {...resolved, errorCorrectionLevel, mask, eci};
}

function invalidPayload(details: Record<string, unknown>): QRCodeError {
  return new QRCodeError('INVALID_PAYLOAD', 'QRCode: Invalid payload format', {details});
}

export function segmentsFitVersion(
  segments: QRCodeResolvedMatrixOptions['segments'],
  version: QRCodeVersion,
  errorCorrectionLevel: QRCodeErrorCorrectionLevelValue,
  eci: boolean,
): boolean {
  return (
    getSegmentsBitLength(version, segments, eci) <=
    getNumberOfAvailableBitsForData(version, errorCorrectionLevel)
  );
}

function createSegments(
  segmenter: QRCodeSegmenter,
  payload: QRCodePayload,
  version: QRCodeVersion,
  eci: boolean,
  kanji: QRCodeStandardMatrixOptions['kanji'],
  kanjiLookup: QRCodeKanjiLookup | undefined,
): QRCodeResolvedMatrixOptions['segments'] {
  const segments: unknown = segmenter(payload, kanji ? {version, eci, kanji} : {version, eci});
  if (!Array.isArray(segments) || segments.length === 0) throw invalidPayload({payload});
  const value = String(payload);
  let text = '';
  const encoded = segments.map((segment: unknown) => {
    const {mode, payload: segmentText} = (segment ?? {}) as Partial<QRCodeSegment>;
    if (
      typeof segmentText !== 'string' ||
      (segmentText === '' && segments.length > 1) ||
      (mode !== 'numeric' && mode !== 'alphanumeric' && mode !== 'octet' && mode !== 'kanji') ||
      // UTF-8 encoding would replace each half of a split surrogate pair.
      (isHighSurrogate(text.charCodeAt(text.length - 1)) &&
        isLowSurrogate(segmentText.charCodeAt(0)))
    ) {
      throw invalidPayload({payload: segmentText, mode});
    }
    if (mode === 'kanji' && !kanjiLookup) throwMissingKanji();
    text += segmentText;
    const encodedSegment = createSingleSegment(
      resolveMode(segmentText, mode),
      segmentText,
      kanjiLookup,
    );
    if (!encodedSegment) throw invalidPayload({payload: segmentText, mode});
    return encodedSegment;
  });
  if (text !== value) throw invalidPayload({payload});
  return encoded;
}

function isHighSurrogate(code: number): boolean {
  return code >= 0xd800 && code <= 0xdbff;
}

function isLowSurrogate(code: number): boolean {
  return code >= 0xdc00 && code <= 0xdfff;
}
