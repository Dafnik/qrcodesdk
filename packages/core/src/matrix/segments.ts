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
  isAlphanumericPayload,
  isNumericPayload,
  validatePayload,
} from './mode';

type OptimizerState = {
  readonly mode: QRCodeSupportedModeIndicator;
  // Characters in the current numeric (mod 3) or alphanumeric (mod 2) group.
  readonly remainder: number;
  readonly bitLength: number;
  readonly segmentCount: number;
  readonly hasUTF8ECI: boolean;
  readonly previousKey: number | undefined;
  readonly startsSegment: boolean;
};

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
 */
export function optimizeSegments(
  payload: QRCodePayload,
  version: QRCodeVersion,
  eci: boolean,
): QRCodeEncodedSegment[] {
  const characters = Array.from(String(payload));
  if (characters.length === 0) return [{mode: MODE_NUMERIC, payload: ''}];

  const histories: Map<number, OptimizerState>[] = [];
  let previousStates: Map<number | undefined, OptimizerState | undefined> = new Map([
    [undefined, undefined],
  ]);

  for (const character of characters) {
    const states = new Map<number, OptimizerState>();
    for (const mode of MODE_ORDER) {
      if (
        mode === MODE_NUMERIC
          ? !isNumericPayload(character)
          : mode === MODE_ALPHANUMERIC && !isAlphanumericPayload(character)
      ) {
        continue;
      }

      for (const [previousKey, previous] of previousStates) {
        const appending = previous?.mode === mode;
        const remainder =
          mode === MODE_OCTET ? 0 : appending ? (previous.remainder + 1) % (4 - mode) : 1;
        const hasUTF8ECI = !!previous?.hasUTF8ECI || mode === MODE_OCTET;
        const characterBits =
          mode === MODE_OCTET
            ? getUTF8ByteLength(character) * 8
            : (mode === MODE_NUMERIC ? 4 : 6) - (appending && previous.remainder ? 1 : 0);
        const candidate: OptimizerState = {
          mode,
          remainder,
          bitLength:
            (previous?.bitLength ?? 0) +
            characterBits +
            (appending
              ? 0
              : 4 +
                getCharacterCountBits(mode, version) +
                (eci && mode === MODE_OCTET && !previous?.hasUTF8ECI ? ECI_UTF8_BIT_LENGTH : 0)),
          segmentCount: (previous?.segmentCount ?? 0) + (appending ? 0 : 1),
          hasUTF8ECI,
          previousKey,
          startsSegment: !appending,
        };
        const key = mode * 6 + remainder * 2 + +hasUTF8ECI;
        const current = states.get(key);
        if (!current || isBetter(candidate, current)) states.set(key, candidate);
      }
    }
    histories.push(states);
    previousStates = states;
  }

  let key: number | undefined;
  let best: OptimizerState | undefined;
  for (const [stateKey, state] of previousStates as Map<number, OptimizerState>) {
    if (!best || isBetter(state, best)) {
      best = state;
      key = stateKey;
    }
  }

  const result: QRCodeEncodedSegment[] = [];
  for (let index = characters.length - 1, segmentEnd = characters.length; index >= 0; index--) {
    const state = histories[index]!.get(key!)!;
    if (state.startsSegment) {
      result.unshift(
        createSingleSegment(state.mode, characters.slice(index, segmentEnd).join(''))!,
      );
      segmentEnd = index;
    }
    key = state.previousKey;
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

function isBetter(candidate: OptimizerState, current: OptimizerState): boolean {
  return (
    candidate.bitLength < current.bitLength ||
    (candidate.bitLength === current.bitLength && candidate.segmentCount < current.segmentCount)
  );
}

function getUTF8ByteLength(value: string): number {
  const codePoint = value.codePointAt(0)!;
  return codePoint < 0x80 ? 1 : codePoint < 0x800 ? 2 : codePoint < 0x10000 ? 3 : 4;
}
