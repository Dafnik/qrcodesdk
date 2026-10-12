import {QRCodeError} from '../error';
import type {
  QRCodeEncodedPayload,
  QRCodeMode,
  QRCodePayload,
  QRCodeSupportedModeIndicator,
  QRCodeVersion,
} from '../types';

export const MODE_NUMERIC = 1,
  MODE_ALPHANUMERIC = 2,
  MODE_OCTET = 4 satisfies QRCodeSupportedModeIndicator;

export const MODE_ECI = 7;
export const ECI_UTF8_ASSIGNMENT = 26;
export const ECI_UTF8_BIT_LENGTH = 12;

export const MODES_MAP: Record<QRCodeMode, QRCodeSupportedModeIndicator> = {
  numeric: MODE_NUMERIC,
  alphanumeric: MODE_ALPHANUMERIC,
  octet: MODE_OCTET,
};

// Alphanumeric character table (JIS X 0510:2004 Table 5).
export const ALPHANUMERIC_CHARACTERS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
const NUMERIC_REGEXP = /^\d*$/;
const ALPHANUMERIC_REGEXP = /^[A-Z0-9 $%*+\-./:]*$/;

type PackBits = (value: number, bitCount: number) => void;
type TextEncoderConstructor = new () => {
  encode(payload?: string): Uint8Array;
};

let cachedTextEncoder: InstanceType<TextEncoderConstructor> | undefined;

export function getCharacterCountBits(
  mode: QRCodeSupportedModeIndicator,
  version: QRCodeVersion,
): number {
  const group = version < 10 ? 0 : version < 27 ? 1 : 2;
  // numeric: 10/12/14, alphanumeric: 9/11/13, octet: 8/16/16
  return mode === MODE_OCTET ? (group ? 16 : 8) : 11 - mode + 2 * group;
}

export function getPayloadBitLength(mode: QRCodeSupportedModeIndicator, length: number): number {
  if (mode === MODE_NUMERIC) return ((length / 3) | 0) * 10 + [0, 4, 7][length % 3]!;
  if (mode === MODE_ALPHANUMERIC) return ((length / 2) | 0) * 11 + (length % 2) * 6;
  return length * 8;
}

export function encodePayload(
  mode: QRCodeSupportedModeIndicator,
  payload: QRCodeEncodedPayload,
  pack: PackBits,
): void {
  if (typeof payload !== 'string') {
    for (let index = 0; index < payload.length; index++) pack(payload[index]!, 8);
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
): QRCodeSupportedModeIndicator {
  if (requestedMode !== undefined) {
    const mode = MODES_MAP[requestedMode];
    if (typeof mode !== 'number') {
      throw new QRCodeError('INVALID_OPTIONS', 'QRCode: Invalid mode', {
        details: {field: 'mode', value: mode},
      });
    }
    return mode;
  }

  if (typeof payload === 'number' || isNumericPayload(payload)) return MODE_NUMERIC;
  return isAlphanumericPayload(payload) ? MODE_ALPHANUMERIC : MODE_OCTET;
}

export function validatePayload(
  mode: QRCodeSupportedModeIndicator,
  payload: QRCodePayload,
): QRCodeEncodedPayload | undefined {
  if (typeof payload === 'number' && (!Number.isSafeInteger(payload) || payload < 0)) {
    return undefined;
  }
  const value = String(payload);
  if (mode === MODE_OCTET) return encodeUTF8(value);
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

export function encodeUTF8(payload: string): number[] {
  cachedTextEncoder ??= new (
    globalThis as unknown as {TextEncoder: TextEncoderConstructor}
  ).TextEncoder();
  return [...cachedTextEncoder.encode(payload)];
}
