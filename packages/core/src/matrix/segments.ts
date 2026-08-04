import type {
  QRCodeEncodedSegment,
  QRCodeInputData,
  QRCodeSupportedModeIndicator,
  QRCodeVersion,
} from '../types';
import {
  ECI_UTF8_BIT_LENGTH,
  MODE_ALPHANUMERIC,
  MODE_NUMERIC,
  MODE_OCTET,
  getModeDefinition,
  isAlphanumericData,
  isNumericData,
  validateData,
} from './mode';

type SegmentMode = QRCodeSupportedModeIndicator;

type OptimizerState = {
  readonly mode: SegmentMode;
  readonly remainder: number;
  readonly bitLength: number;
  readonly segmentCount: number;
  readonly hasUTF8ECI: boolean;
  readonly previousKey: string | undefined;
  readonly startsSegment: boolean;
};

const MODE_ORDER = [MODE_NUMERIC, MODE_ALPHANUMERIC, MODE_OCTET] as const;

export function createSingleSegment(
  mode: QRCodeSupportedModeIndicator,
  data: QRCodeInputData,
): QRCodeEncodedSegment | undefined {
  const encoded = validateData(mode, data);
  return encoded === undefined ? undefined : {mode, data: encoded};
}

export function optimizeSegments(
  data: QRCodeInputData,
  version: QRCodeVersion,
): QRCodeEncodedSegment[] {
  const source = String(data);
  if (source.length === 0) return [{mode: MODE_NUMERIC, data: ''}];

  const characters = Array.from(source);
  const histories: ReadonlyMap<string, OptimizerState>[] = [];
  let previousStates: ReadonlyMap<string, OptimizerState> | undefined;

  for (let index = 0; index < characters.length; index++) {
    const character = characters[index]!;
    const nextStates = new Map<string, OptimizerState>();

    for (const mode of MODE_ORDER) {
      if (!canEncodeCharacter(mode, character)) continue;

      if (previousStates === undefined) {
        offerState(nextStates, createStartedState(mode, character, version, undefined, undefined));
        continue;
      }

      for (const [previousKey, previous] of previousStates) {
        const candidate =
          previous.mode === mode
            ? appendToState(previous, previousKey, character)
            : createStartedState(mode, character, version, previous, previousKey);
        offerState(nextStates, candidate);
      }
    }

    histories.push(nextStates);
    previousStates = nextStates;
  }

  const finalState = bestState(previousStates!);
  return reconstructSegments(characters, histories, stateKey(finalState));
}

export function getSegmentsBitLength(
  version: QRCodeVersion,
  segments: readonly QRCodeEncodedSegment[],
): number {
  let bitLength = segments.some(({mode}) => mode === MODE_OCTET) ? ECI_UTF8_BIT_LENGTH : 0;
  for (const segment of segments) {
    const definition = getModeDefinition(segment.mode);
    bitLength +=
      4 +
      definition.getCharacterCountBits(version) +
      definition.getPayloadBitLength(segment.data.length);
  }
  return bitLength;
}

function canEncodeCharacter(mode: SegmentMode, character: string): boolean {
  if (mode === MODE_NUMERIC) return isNumericData(character);
  if (mode === MODE_ALPHANUMERIC) return isAlphanumericData(character);
  return true;
}

function createStartedState(
  mode: SegmentMode,
  character: string,
  version: QRCodeVersion,
  previous: OptimizerState | undefined,
  previousKey: string | undefined,
): OptimizerState {
  const definition = getModeDefinition(mode);
  return {
    mode,
    remainder: initialRemainder(mode),
    bitLength:
      (previous?.bitLength ?? 0) +
      (mode === MODE_OCTET && previous?.hasUTF8ECI !== true ? ECI_UTF8_BIT_LENGTH : 0) +
      4 +
      definition.getCharacterCountBits(version) +
      getFirstCharacterBitLength(mode, character),
    segmentCount: (previous?.segmentCount ?? 0) + 1,
    hasUTF8ECI: previous?.hasUTF8ECI === true || mode === MODE_OCTET,
    previousKey,
    startsSegment: true,
  };
}

function appendToState(
  previous: OptimizerState,
  previousKey: string,
  character: string,
): OptimizerState {
  return {
    mode: previous.mode,
    remainder: nextRemainder(previous.mode, previous.remainder),
    bitLength:
      previous.bitLength +
      getAppendedCharacterBitLength(previous.mode, previous.remainder, character),
    segmentCount: previous.segmentCount,
    hasUTF8ECI: previous.hasUTF8ECI,
    previousKey,
    startsSegment: false,
  };
}

function offerState(states: Map<string, OptimizerState>, candidate: OptimizerState): void {
  const key = stateKey(candidate);
  const current = states.get(key);
  if (
    current === undefined ||
    candidate.bitLength < current.bitLength ||
    (candidate.bitLength === current.bitLength && candidate.segmentCount < current.segmentCount)
  ) {
    states.set(key, candidate);
  }
}

function bestState(states: ReadonlyMap<string, OptimizerState>): OptimizerState {
  let result: OptimizerState | undefined;
  for (const state of states.values()) {
    if (
      result === undefined ||
      state.bitLength < result.bitLength ||
      (state.bitLength === result.bitLength && state.segmentCount < result.segmentCount)
    ) {
      result = state;
    }
  }
  return result!;
}

function reconstructSegments(
  characters: readonly string[],
  histories: readonly ReadonlyMap<string, OptimizerState>[],
  finalKey: string,
): QRCodeEncodedSegment[] {
  const result: QRCodeEncodedSegment[] = [];
  let key: string | undefined = finalKey;
  let segmentEnd = characters.length;

  for (let index = characters.length - 1; index >= 0; index--) {
    const state: OptimizerState = histories[index]!.get(key!)!;
    if (state.startsSegment) {
      const text = characters.slice(index, segmentEnd).join('');
      result.push(createSingleSegment(state.mode, text)!);
      segmentEnd = index;
    }
    key = state.previousKey;
  }

  return result.reverse();
}

function stateKey(state: Pick<OptimizerState, 'mode' | 'remainder' | 'hasUTF8ECI'>): string {
  return `${state.mode}:${state.remainder}:${Number(state.hasUTF8ECI)}`;
}

function initialRemainder(mode: SegmentMode): number {
  return mode === MODE_OCTET ? 0 : 1;
}

function nextRemainder(mode: SegmentMode, remainder: number): number {
  if (mode === MODE_NUMERIC) return (remainder + 1) % 3;
  if (mode === MODE_ALPHANUMERIC) return (remainder + 1) % 2;
  return 0;
}

function getFirstCharacterBitLength(mode: SegmentMode, character: string): number {
  if (mode === MODE_NUMERIC) return 4;
  if (mode === MODE_ALPHANUMERIC) return 6;
  return getUTF8ByteLength(character) * 8;
}

function getAppendedCharacterBitLength(
  mode: SegmentMode,
  remainder: number,
  character: string,
): number {
  if (mode === MODE_NUMERIC) return remainder === 0 ? 4 : 3;
  if (mode === MODE_ALPHANUMERIC) return remainder === 0 ? 6 : 5;
  return getUTF8ByteLength(character) * 8;
}

function getUTF8ByteLength(value: string): number {
  const codePoint = value.codePointAt(0)!;
  if (codePoint <= 0x7f) return 1;
  if (codePoint <= 0x7ff) return 2;
  if (codePoint <= 0xffff) return 3;
  return 4;
}
