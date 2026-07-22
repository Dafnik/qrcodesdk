import type {
  QRCodeEncodedData,
  QRCodeInputData,
  QRCodeMode,
  QRCodeSupportedModeIndicator,
  QRCodeVersion,
} from '../types';

export const MODE_NUMERIC = 1,
  MODE_ALPHANUMERIC = 2,
  MODE_OCTET = 4 satisfies QRCodeSupportedModeIndicator;

export const MODE_TERMINATOR = 0;

export const MODES_MAP: Record<QRCodeMode, QRCodeSupportedModeIndicator> = {
  numeric: MODE_NUMERIC,
  alphanumeric: MODE_ALPHANUMERIC,
  octet: MODE_OCTET,
};

const NUMERIC_REGEXP = /^\d*$/;
const ALPHANUMERIC_REGEXP = /^[A-Z0-9 $%*+\-./:]*$/;

type PackBits = (value: number, bitCount: number) => void;
type TextEncoderConstructor = new () => {
  encode(input?: string): Uint8Array;
};

export type QRCodeModeDefinition = {
  readonly indicator: QRCodeSupportedModeIndicator;
  readonly validate: (data: QRCodeInputData) => QRCodeEncodedData | undefined;
  readonly getCharacterCountBits: (version: QRCodeVersion) => number;
  readonly getMaxDataLength: (numberOfBits: number) => number;
  readonly encodePayload: (data: QRCodeEncodedData, pack: PackBits) => void;
};

let cachedAlphanumericMap: Record<string, number> | undefined;

// Alphanumeric character mapping (JIS X 0510:2004 Table 5).
export function getAlphanumericMap(): Record<string, number> {
  cachedAlphanumericMap ??= createAlphanumericMap();
  return cachedAlphanumericMap;
}

const MODE_DEFINITIONS: Record<QRCodeSupportedModeIndicator, QRCodeModeDefinition> = {
  [MODE_NUMERIC]: {
    indicator: MODE_NUMERIC,
    validate: (data) => {
      const stringData = String(data);
      return NUMERIC_REGEXP.test(stringData) ? stringData : undefined;
    },
    getCharacterCountBits: (version) => (version < 10 ? 10 : version < 27 ? 12 : 14),
    getMaxDataLength: (numberOfBits) =>
      ((numberOfBits / 10) | 0) * 3 + (numberOfBits % 10 < 4 ? 0 : numberOfBits % 10 < 7 ? 1 : 2),
    encodePayload: (data, pack) => {
      const stringData = data as string;
      let index = 2;
      for (; index < stringData.length; index += 3) {
        pack(Number.parseInt(stringData.substring(index - 2, index + 1), 10), 10);
      }
      pack(Number.parseInt(stringData.substring(index - 2), 10), [0, 4, 7][stringData.length % 3]!);
    },
  },
  [MODE_ALPHANUMERIC]: {
    indicator: MODE_ALPHANUMERIC,
    validate: (data) => {
      const stringData = String(data);
      return ALPHANUMERIC_REGEXP.test(stringData) ? stringData : undefined;
    },
    getCharacterCountBits: (version) => (version < 10 ? 9 : version < 27 ? 11 : 13),
    getMaxDataLength: (numberOfBits) =>
      ((numberOfBits / 11) | 0) * 2 + (numberOfBits % 11 < 6 ? 0 : 1),
    encodePayload: (data, pack) => {
      const alphanumericMap = getAlphanumericMap();
      const stringData = data as string;
      let index = 1;
      for (; index < stringData.length; index += 2) {
        pack(
          alphanumericMap[stringData.charAt(index - 1)]! * 45 +
            alphanumericMap[stringData.charAt(index)]!,
          11,
        );
      }
      if (stringData.length % 2 === 1) {
        pack(alphanumericMap[stringData.charAt(index - 1)]!, 6);
      }
    },
  },
  [MODE_OCTET]: {
    indicator: MODE_OCTET,
    validate: (data) => [
      ...new (globalThis as unknown as {TextEncoder: TextEncoderConstructor}).TextEncoder().encode(
        String(data),
      ),
    ],
    getCharacterCountBits: (version) => (version < 10 ? 8 : 16),
    getMaxDataLength: (numberOfBits) => (numberOfBits / 8) | 0,
    encodePayload: (data, pack) => {
      for (const byte of data as number[]) pack(byte, 8);
    },
  },
};

export function getModeDefinition(mode: number | undefined): QRCodeModeDefinition {
  const definition = MODE_DEFINITIONS[mode as QRCodeSupportedModeIndicator];
  if (!definition) throw new Error('QRCode: Invalid mode');
  return definition;
}

export function resolveMode(
  data: QRCodeInputData,
  requestedMode: QRCodeMode | undefined,
): QRCodeSupportedModeIndicator {
  if (requestedMode !== undefined) {
    return getModeDefinition(MODES_MAP[requestedMode]).indicator;
  }

  if (typeof data === 'number' || NUMERIC_REGEXP.test(data)) return MODE_NUMERIC;
  if (ALPHANUMERIC_REGEXP.test(data)) return MODE_ALPHANUMERIC;
  return MODE_OCTET;
}

export function validateData(
  mode: QRCodeSupportedModeIndicator,
  data: QRCodeInputData,
): QRCodeEncodedData | undefined {
  if (typeof data === 'number' && (!Number.isSafeInteger(data) || data < 0)) return undefined;
  return getModeDefinition(mode).validate(data);
}

function createAlphanumericMap(): Record<string, number> {
  const map: Record<string, number> = {};
  for (let i = 0; i < 45; i++) {
    map['0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'.charAt(i)] = i;
  }
  return map;
}
