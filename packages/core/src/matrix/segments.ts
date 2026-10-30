import type {
  QRCodeEncodedSegment,
  QRCodePayload,
  QRCodeSupportedModeIndicator,
  QRCodeVersion,
} from '../types';
import {
  ECI_UTF8_BIT_LENGTH,
  MODE_ALPHANUMERIC,
  MODE_NUMERIC,
  MODE_OCTET,
  getCharacterCountBits,
  getPayloadBitLength,
  isNumericPayload,
  validatePayload,
} from './mode';

// State keys are mode * 6 + remainder * 2 + hasUTF8ECI, so 26 slots cover every state.
const STATE_COUNT = 26;
const MODE_ORDER = [MODE_NUMERIC, MODE_ALPHANUMERIC, MODE_OCTET] as const;

export function createSingleSegment(
  mode: QRCodeSupportedModeIndicator,
  payload: QRCodePayload,
): QRCodeEncodedSegment | undefined {
  const encoded = validatePayload(mode, payload);
  return encoded === undefined ? undefined : {mode, payload: encoded};
}

/**
 * Finds the shortest mixed-mode segmentation with a dynamic program over
 * (mode, partial character group, UTF-8 ECI emitted) states.
 *
 * Numeric and alphanumeric states track the characters in the current group
 * (mod 3 and mod 2). State data lives in fixed-size typed arrays, and each step
 * records the order in which keys first appear, so ties resolve in that order.
 */
export function optimizeSegments(
  payload: QRCodePayload,
  version: QRCodeVersion,
  eci: boolean,
): QRCodeEncodedSegment[] {
  const value = String(payload);
  // Keep numeric and canonical empty payloads out of the mixed-mode optimizer.
  if (isNumericPayload(value)) return [{mode: MODE_NUMERIC, payload: value}];

  const offsets: number[] = [];
  const codePoints: number[] = [];
  for (let index = 0; index < value.length;) {
    const codePoint = value.codePointAt(index)!;
    offsets.push(index);
    codePoints.push(codePoint);
    index += codePoint > 0xffff ? 2 : 1;
  }
  offsets.push(value.length);

  const length = codePoints.length;
  // Predecessor state key per character and state, or -1 at the first character.
  const previousKeys = new Int8Array(length * STATE_COUNT);
  let previousBitLengths = new Float64Array(STATE_COUNT);
  let previousSegmentCounts = new Int32Array(STATE_COUNT);
  let previousOrder = [-1];
  let bitLengths = new Float64Array(STATE_COUNT);
  let segmentCounts = new Int32Array(STATE_COUNT);

  for (let index = 0; index < length; index++) {
    const codePoint = codePoints[index]!;
    const isNumeric = codePoint >= 48 && codePoint <= 57;
    const isAlphanumeric =
      isNumeric ||
      (codePoint >= 65 && codePoint <= 90) ||
      // Space $ % * + - . / :
      codePoint === 32 ||
      codePoint === 36 ||
      codePoint === 37 ||
      codePoint === 42 ||
      codePoint === 43 ||
      (codePoint >= 45 && codePoint <= 47) ||
      codePoint === 58;
    const octetBits =
      (codePoint < 0x80 ? 1 : codePoint < 0x800 ? 2 : codePoint < 0x10000 ? 3 : 4) * 8;
    const order: number[] = [];
    bitLengths.fill(Infinity);

    for (const mode of MODE_ORDER) {
      if (mode === MODE_NUMERIC ? !isNumeric : mode === MODE_ALPHANUMERIC && !isAlphanumeric) {
        continue;
      }
      const countBits = getCharacterCountBits(mode, version);

      for (const previousKey of previousOrder) {
        const hasPrevious = previousKey >= 0;
        const previousRemainder = (previousKey % 6) >> 1;
        const previousHasUTF8ECI = hasPrevious && (previousKey & 1) === 1;
        const appending = hasPrevious && ((previousKey / 6) | 0) === mode;
        const remainder =
          mode === MODE_OCTET ? 0 : appending ? (previousRemainder + 1) % (4 - mode) : 1;
        const hasUTF8ECI = previousHasUTF8ECI || mode === MODE_OCTET;
        const characterBits =
          mode === MODE_OCTET
            ? octetBits
            : (mode === MODE_NUMERIC ? 4 : 6) - (appending && previousRemainder ? 1 : 0);
        const bitLength =
          (hasPrevious ? previousBitLengths[previousKey]! : 0) +
          characterBits +
          (appending
            ? 0
            : 4 +
              countBits +
              (eci && mode === MODE_OCTET && !previousHasUTF8ECI ? ECI_UTF8_BIT_LENGTH : 0));
        const segmentCount =
          (hasPrevious ? previousSegmentCounts[previousKey]! : 0) + (appending ? 0 : 1);
        const key = mode * 6 + remainder * 2 + +hasUTF8ECI;
        const currentBitLength = bitLengths[key]!;
        if (currentBitLength === Infinity) order.push(key);
        if (
          bitLength < currentBitLength ||
          (bitLength === currentBitLength && segmentCount < segmentCounts[key]!)
        ) {
          bitLengths[key] = bitLength;
          segmentCounts[key] = segmentCount;
          previousKeys[index * STATE_COUNT + key] = previousKey;
        }
      }
    }
    [previousBitLengths, bitLengths] = [bitLengths, previousBitLengths];
    [previousSegmentCounts, segmentCounts] = [segmentCounts, previousSegmentCounts];
    previousOrder = order;
  }

  let key = -1;
  for (const stateKey of previousOrder) {
    if (
      key < 0 ||
      previousBitLengths[stateKey]! < previousBitLengths[key]! ||
      (previousBitLengths[stateKey] === previousBitLengths[key] &&
        previousSegmentCounts[stateKey]! < previousSegmentCounts[key]!)
    ) {
      key = stateKey;
    }
  }

  const result: QRCodeEncodedSegment[] = [];
  for (let index = length - 1, segmentEnd = length; index >= 0; index--) {
    const previousKey = previousKeys[index * STATE_COUNT + key]!;
    const mode = ((key / 6) | 0) as QRCodeSupportedModeIndicator;
    if (previousKey < 0 || ((previousKey / 6) | 0) !== mode) {
      result.unshift(createSingleSegment(mode, value.slice(offsets[index], offsets[segmentEnd]))!);
      segmentEnd = index;
    }
    key = previousKey;
  }
  return result;
}

export function getSegmentsBitLength(
  version: QRCodeVersion,
  segments: readonly QRCodeEncodedSegment[],
  eci: boolean,
): number {
  let bitLength = eci && segments.some(({mode}) => mode === MODE_OCTET) ? ECI_UTF8_BIT_LENGTH : 0;
  for (const {mode, payload} of segments) {
    bitLength +=
      4 + getCharacterCountBits(mode, version) + getPayloadBitLength(mode, payload.length);
  }
  return bitLength;
}
