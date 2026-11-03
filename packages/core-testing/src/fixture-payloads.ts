import type {QRCodeMode} from '@qrcodesdk/core';

const NUMERIC_CHARACTERS = '0123456789';
const ALPHANUMERIC_CHARACTERS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
const PRINTABLE_ASCII_CHARACTERS = Array.from({length: 0x7f - 0x20}, (_, index) =>
  String.fromCharCode(0x20 + index),
).join('');

/** Multi-byte UTF-8 characters grouped by their encoded byte length. */
const UTF8_CHARACTERS_BY_BYTE_LENGTH = {
  2: [...'äöüßéñçøåÆΩЖπ'],
  3: [...'€✅日本語東京中文한글…★'],
  4: [...'🚀😀🎉🌍🧪📦'],
} as const;

export type QRCodeFixturePayloadOptions = {
  /**
   * Mixes multi-byte UTF-8 characters into octet payloads. `length` then counts UTF-8 bytes,
   * not characters. Ignored by numeric and alphanumeric payloads.
   */
  readonly utf8?: boolean;
};

/** Hashes a fixture name (FNV-1a) into a stable 32-bit seed. */
export function fixtureSeed(name: string): number {
  let hash = 0x81_1c_9d_c5;
  for (let index = 0; index < name.length; index += 1) {
    hash ^= name.charCodeAt(index);
    hash = Math.imul(hash, 0x01_00_01_93);
  }
  return hash >>> 0;
}

/** Creates a deterministic mulberry32 generator returning values in `[0, 1)`. */
export function createFixtureRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d_2b_79_f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/**
 * Creates a deterministic, non-repeating payload for `mode`.
 *
 * `length` counts characters for numeric and alphanumeric payloads and bytes for octet payloads.
 */
export function createFixturePayload(
  mode: QRCodeMode,
  length: number,
  seed: number,
  options: QRCodeFixturePayloadOptions = {},
): string {
  const random = createFixtureRandom(seed);
  const pick = <T>(values: ArrayLike<T>): T => values[Math.floor(random() * values.length)]!;

  if (mode === 'numeric' || mode === 'alphanumeric') {
    const characters = mode === 'numeric' ? NUMERIC_CHARACTERS : ALPHANUMERIC_CHARACTERS;
    return Array.from({length}, () => pick(characters)).join('');
  }

  if (!options.utf8) return Array.from({length}, () => pick(PRINTABLE_ASCII_CHARACTERS)).join('');

  let payload = '';
  let remainingBytes = length;
  while (remainingBytes > 0) {
    // Roughly half ASCII, half multi-byte characters that still fit into the remaining bytes.
    const byteLength = random() < 0.5 ? 1 : 2 + Math.floor(random() * 3);
    if (byteLength === 1 || byteLength > remainingBytes) {
      payload += pick(PRINTABLE_ASCII_CHARACTERS);
      remainingBytes -= 1;
    } else {
      payload += pick(UTF8_CHARACTERS_BY_BYTE_LENGTH[byteLength as 2 | 3 | 4]);
      remainingBytes -= byteLength;
    }
  }
  return payload;
}
