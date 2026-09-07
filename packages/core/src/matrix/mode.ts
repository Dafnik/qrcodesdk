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

export const MODE_TERMINATOR = 0;
export const MODE_ECI = 7;
export const ECI_UTF8_ASSIGNMENT = 26;
export const ECI_UTF8_BIT_LENGTH = 12;

export const MODES_MAP: Record<QRCodeMode, QRCodeSupportedModeIndicator> = {
  numeric: MODE_NUMERIC,
  alphanumeric: MODE_ALPHANUMERIC,
  octet: MODE_OCTET,
};

export const MODES = ['numeric', 'alphanumeric', 'octet'] as const satisfies readonly QRCodeMode[];

const NUMERIC_REGEXP = /^\d*$/;
const ALPHANUMERIC_REGEXP = /^[A-Z0-9 $%*+\-./:]*$/;

type PackBits = (value: number, bitCount: number) => void;
type TextEncoderConstructor = new () => {
  encode(payload?: string): Uint8Array;
};

export type QRCodeModeDefinition = {
  readonly indicator: QRCodeSupportedModeIndicator;
  readonly validate: (payload: QRCodePayload) => QRCodeEncodedPayload | undefined;
  readonly getCharacterCountBits: (version: QRCodeVersion) => number;
  readonly getPayloadBitLength: (dataLength: number) => number;
  readonly encodePayload: (payload: QRCodeEncodedPayload, pack: PackBits) => void;
};

let cachedAlphanumericMap: Record<string, number> | undefined;
let cachedTextEncoder: InstanceType<TextEncoderConstructor> | undefined;

// Alphanumeric character mapping (JIS X 0510:2004 Table 5).
export function getAlphanumericMap(): Record<string, number> {
  cachedAlphanumericMap ??= createAlphanumericMap();
  return cachedAlphanumericMap;
}

const MODE_DEFINITIONS: Record<QRCodeSupportedModeIndicator, QRCodeModeDefinition> = {
  [MODE_NUMERIC]: {
    indicator: MODE_NUMERIC,
    validate: (payload) => {
      const stringPayload = String(payload);
      return NUMERIC_REGEXP.test(stringPayload) ? stringPayload : undefined;
    },
    getCharacterCountBits: (version) => (version < 10 ? 10 : version < 27 ? 12 : 14),
    getPayloadBitLength: (dataLength) => ((dataLength / 3) | 0) * 10 + [0, 4, 7][dataLength % 3]!,
    encodePayload: (payload, pack) => {
      const stringPayload = payload as string;
      let index = 2;
      for (; index < stringPayload.length; index += 3) {
        pack(Number.parseInt(stringPayload.substring(index - 2, index + 1), 10), 10);
      }
      pack(
        Number.parseInt(stringPayload.substring(index - 2), 10),
        [0, 4, 7][stringPayload.length % 3]!,
      );
    },
  },
  [MODE_ALPHANUMERIC]: {
    indicator: MODE_ALPHANUMERIC,
    validate: (payload) => {
      const stringPayload = String(payload);
      return ALPHANUMERIC_REGEXP.test(stringPayload) ? stringPayload : undefined;
    },
    getCharacterCountBits: (version) => (version < 10 ? 9 : version < 27 ? 11 : 13),
    getPayloadBitLength: (dataLength) => ((dataLength / 2) | 0) * 11 + (dataLength % 2) * 6,
    encodePayload: (payload, pack) => {
      const alphanumericMap = getAlphanumericMap();
      const stringPayload = payload as string;
      let index = 1;
      for (; index < stringPayload.length; index += 2) {
        pack(
          alphanumericMap[stringPayload.charAt(index - 1)]! * 45 +
            alphanumericMap[stringPayload.charAt(index)]!,
          11,
        );
      }
      if (stringPayload.length % 2 === 1) {
        pack(alphanumericMap[stringPayload.charAt(index - 1)]!, 6);
      }
    },
  },
  [MODE_OCTET]: {
    indicator: MODE_OCTET,
    validate: (payload) => encodeUTF8(String(payload)),
    getCharacterCountBits: (version) => (version < 10 ? 8 : 16),
    getPayloadBitLength: (dataLength) => dataLength * 8,
    encodePayload: (payload, pack) => {
      const payloadBytes = payload as number[];
      for (let index = 0; index < payloadBytes.length; index++) {
        pack(payloadBytes[index]!, 8);
      }
    },
  },
};

export function getModeDefinition(mode: number | undefined): QRCodeModeDefinition {
  const definition = MODE_DEFINITIONS[mode as QRCodeSupportedModeIndicator];
  if (!definition) {
    throw new QRCodeError('INVALID_OPTIONS', 'QRCode: Invalid mode', {
      details: {field: 'mode', value: mode},
    });
  }
  return definition;
}

export function resolveMode(
  payload: QRCodePayload,
  requestedMode: QRCodeMode | undefined,
): QRCodeSupportedModeIndicator {
  if (requestedMode !== undefined) {
    return getModeDefinition(MODES_MAP[requestedMode]).indicator;
  }

  if (typeof payload === 'number' || NUMERIC_REGEXP.test(payload)) return MODE_NUMERIC;
  if (ALPHANUMERIC_REGEXP.test(payload)) return MODE_ALPHANUMERIC;
  return MODE_OCTET;
}

export function validatePayload(
  mode: QRCodeSupportedModeIndicator,
  payload: QRCodePayload,
): QRCodeEncodedPayload | undefined {
  if (typeof payload === 'number' && (!Number.isSafeInteger(payload) || payload < 0))
    return undefined;
  return getModeDefinition(mode).validate(payload);
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

function createAlphanumericMap(): Record<string, number> {
  const map: Record<string, number> = {};
  for (let i = 0; i < 45; i++) {
    map['0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'.charAt(i)] = i;
  }
  return map;
}
