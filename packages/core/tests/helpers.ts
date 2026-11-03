import type {QRCodeMatrix} from '../src/types';

export function toRows({size, modules}: {size: number; modules: ArrayLike<number>}): number[][] {
  return Array.from({length: size}, (_, y) =>
    Array.from({length: size}, (_, x) => modules[y * size + x]!),
  );
}

/** Creates a matrix with every module in the data role. */
export function fromRows(rows: readonly (readonly (0 | 1)[])[]): QRCodeMatrix {
  return {
    size: rows.length,
    modules: rows.flat(),
    roles: Array<0>(rows.length * rows.length).fill(0),
  };
}

const FIXTURE_ALPHABETS = {
  numeric: '0123456789',
  alphanumeric: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:',
  octet: Array.from({length: 0x7f - 0x20}, (_, index) => String.fromCharCode(0x20 + index)).join(
    '',
  ),
} as const;

/**
 * Creates a deterministic, non-repeating payload from the mode's alphabet (printable ASCII for
 * octet mode, so `length` is also the byte length). Mirrors `@repo/core-testing`, which core
 * cannot depend on.
 */
export function fixturePayload(
  mode: keyof typeof FIXTURE_ALPHABETS,
  length: number,
  seed = 1,
): string {
  const alphabet = FIXTURE_ALPHABETS[mode];
  // mulberry32
  let state = seed >>> 0;
  let payload = '';
  for (let index = 0; index < length; index++) {
    state = (state + 0x6d_2b_79_f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    payload +=
      alphabet[Math.floor((((value ^ (value >>> 14)) >>> 0) / 4_294_967_296) * alphabet.length)];
  }
  return payload;
}
