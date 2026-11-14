import {throwInvalid} from '../options';
import type {QRCodeKanji} from '../types';

/** Returns the 13-bit Kanji mode value of a UTF-16 code unit, or `-1` if Kanji mode lacks it. */
export type QRCodeKanjiLookup = (codeUnit: number) => number;

const lookups = new WeakMap<object, QRCodeKanjiLookup>();

export function createKanji(lookup: QRCodeKanjiLookup): QRCodeKanji {
  const kanji = Object.freeze({}) as QRCodeKanji;
  lookups.set(kanji, lookup);
  return kanji;
}

/** Returns the lookup of a `kanji` option and rejects values not created by `createKanji`. */
export function resolveKanjiLookup(kanji: unknown): QRCodeKanjiLookup | undefined {
  if (kanji === undefined) return undefined;
  const lookup = typeof kanji === 'object' && kanji !== null ? lookups.get(kanji) : undefined;
  if (!lookup) throwInvalid('kanji', 'the kanji table from @qrcodesdk/core/kanji', kanji);
  return lookup;
}

export function throwMissingKanji(): never {
  throwInvalid('kanji', 'the kanji table from @qrcodesdk/core/kanji for Kanji mode', undefined);
}
