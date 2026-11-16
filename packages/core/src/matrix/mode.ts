import type {QRCodeEncodingMode, QRCodeMode, QRCodePayload, QRCodeVersion} from '../types';
import type {QRCodeKanjiLookup} from './kanji';
import type {QRCodeCodewords, QRCodeEncodedPayload, QRCodeSupportedModeIndicator} from './types';

export const MODE_NUMERIC = 1,
  MODE_ALPHANUMERIC = 2,
  MODE_OCTET = 4,
  MODE_KANJI = 8 satisfies QRCodeSupportedModeIndicator;

export const MODE_ECI = 7;
export const ECI_UTF8_ASSIGNMENT = 26;
export const ECI_UTF8_BIT_LENGTH = 12;

export const MODES_MAP: Record<QRCodeEncodingMode, QRCodeSupportedModeIndicator> = {
  numeric: MODE_NUMERIC,
  alphanumeric: MODE_ALPHANUMERIC,
  octet: MODE_OCTET,
  kanji: MODE_KANJI,
};

// Alphanumeric character table (JIS X 0510:2004 Table 5).
export const ALPHANUMERIC_CHARACTERS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
const NUMERIC_REGEXP = /^\d*$/;
const ALPHANUMERIC_REGEXP = /^[A-Z0-9 $%*+\-./:]*$/;

type PackBits = (value: number, bitCount: number) => void;
/**
 * Packs bit fields of up to 24 bits into code words, most significant bit first: the code words,
 * a function that appends the low `bitCount` bits of a value (no-op for 0 bits), and a function
 * that returns the number of bits written. The last code word is partial until it is full; its
 * unwritten low bits are 0.
 */
export type QRCodeBitBuffer = readonly [QRCodeCodewords, PackBits, () => number];

type TextEncoderConstructor = new () => {
  encode(payload?: string): Uint8Array;
};

let cachedTextEncoder: InstanceType<TextEncoderConstructor> | undefined;

export function getCharacterCountBits(
  mode: QRCodeSupportedModeIndicator,
  version: QRCodeVersion,
): number {
  const group = version < 10 ? 0 : version < 27 ? 1 : 2;
  // numeric: 10/12/14, alphanumeric: 9/11/13, octet: 8/16/16, kanji: 8/10/12
  if (mode === MODE_OCTET) return group ? 16 : 8;
  return (mode === MODE_KANJI ? 8 : 11 - mode) + 2 * group;
}

export function getPayloadBitLength(mode: QRCodeSupportedModeIndicator, length: number): number {
  if (mode === MODE_NUMERIC) return ((length / 3) | 0) * 10 + [0, 4, 7][length % 3]!;
  if (mode === MODE_ALPHANUMERIC) return ((length / 2) | 0) * 11 + (length % 2) * 6;
  return length * (mode === MODE_KANJI ? 13 : 8);
}

export function createBitBuffer(): QRCodeBitBuffer {
  const buffer: QRCodeCodewords = [];
  let bitLength = 0;
  return [
    buffer,
    (value, bitCount) => {
      for (; bitCount > 0;) {
        const free = 8 - (bitLength & 7);
        const count = Math.min(free, bitCount);
        if (free === 8) buffer.push(0);
        buffer[buffer.length - 1]! |=
          ((value >> (bitCount -= count)) & ((1 << count) - 1)) << (free - count);
        bitLength += count;
      }
    },
    () => bitLength,
  ];
}

export function encodePayload(
  mode: QRCodeSupportedModeIndicator,
  payload: QRCodeEncodedPayload,
  pack: PackBits,
): void {
  if (typeof payload !== 'string') {
    const bitCount = mode === MODE_KANJI ? 13 : 8;
    for (let index = 0; index < payload.length; index++) pack(payload[index]!, bitCount);
  } else if (mode === MODE_NUMERIC) {
    for (let index = 0; index < payload.length; index += 3) {
      const digits = payload.slice(index, index + 3);
      pack(+digits, digits.length * 3 + 1);
    }
  } else {
    for (let index = 0; index < payload.length; index += 2) {
      const first = ALPHANUMERIC_CHARACTERS.indexOf(payload[index]!);
      if (index + 1 < payload.length) {
        pack(first * 45 + ALPHANUMERIC_CHARACTERS.indexOf(payload[index + 1]!), 11);
      } else {
        pack(first, 6);
      }
    }
  }
}

export function resolveMode(
  payload: QRCodePayload,
  requestedMode: QRCodeMode | undefined,
  kanji?: QRCodeKanjiLookup,
): QRCodeSupportedModeIndicator {
  if (requestedMode !== undefined && requestedMode !== 'auto') {
    return MODES_MAP[requestedMode];
  }

  if (typeof payload === 'number' || isNumericPayload(payload)) return MODE_NUMERIC;
  if (isAlphanumericPayload(payload)) return MODE_ALPHANUMERIC;
  return kanji && encodeKanji(payload, kanji) ? MODE_KANJI : MODE_OCTET;
}

/** Callers must reject Kanji mode without a lookup before validating. */
export function validatePayload(
  mode: QRCodeSupportedModeIndicator,
  payload: QRCodePayload,
  kanji?: QRCodeKanjiLookup,
): QRCodeEncodedPayload | undefined {
  if (typeof payload === 'number' && (!Number.isSafeInteger(payload) || payload < 0)) {
    return undefined;
  }
  const value = String(payload);
  if (mode === MODE_OCTET) return encodeUTF8(value);
  if (mode === MODE_KANJI) return encodeKanji(value, kanji!);
  return (mode === MODE_NUMERIC ? isNumericPayload : isAlphanumericPayload)(value)
    ? value
    : undefined;
}

export function isNumericPayload(payload: string): boolean {
  return NUMERIC_REGEXP.test(payload);
}

export function isAlphanumericPayload(payload: string): boolean {
  return ALPHANUMERIC_REGEXP.test(payload);
}

/** Returns the 13-bit Kanji mode values of a payload, or `undefined` if one character lacks one. */
export function encodeKanji(payload: string, kanji: QRCodeKanjiLookup): number[] | undefined {
  const values: number[] = [];
  for (let index = 0; index < payload.length; index++) {
    const value = kanji(payload.charCodeAt(index));
    if (value < 0) return undefined;
    values.push(value);
  }
  return values;
}

export function encodeUTF8(payload: string): number[] {
  cachedTextEncoder ??= new (
    globalThis as unknown as {TextEncoder: TextEncoderConstructor}
  ).TextEncoder();
  return [...cachedTextEncoder.encode(payload)];
}
