import {describe, expect, test} from 'vitest';

import {
  ECI_UTF8_BIT_LENGTH,
  MODE_ALPHANUMERIC,
  MODE_NUMERIC,
  MODE_OCTET,
  encodeUTF8,
  validateData,
} from '../../src/matrix/mode';
import {getSegmentsBitLength, optimizeSegments} from '../../src/matrix/segments';
import type {QRCodeEncodedSegment, QRCodeVersion} from '../../src/types';

const MODES = [MODE_NUMERIC, MODE_ALPHANUMERIC, MODE_OCTET] as const;

describe('mixed-mode segmentation', () => {
  test.each([1, 10, 27] as const)(
    'optimizes numeric, alphanumeric, and octet runs for version group starting at %s',
    (version) => {
      const segments = optimizeSegments('ABCDE12345678?A1A', version, true);

      expect(segments).toEqual(
        version < 27
          ? [
              {mode: MODE_ALPHANUMERIC, data: 'ABCDE'},
              {mode: MODE_NUMERIC, data: '12345678'},
              {mode: MODE_OCTET, data: [0x3f, 0x41, 0x31, 0x41]},
            ]
          : [
              {mode: MODE_ALPHANUMERIC, data: 'ABCDE12345678'},
              {mode: MODE_OCTET, data: [0x3f, 0x41, 0x31, 0x41]},
            ],
      );
    },
  );

  test('does not switch modes when segment headers cost more than they save', () => {
    expect(optimizeSegments('ABCDE12FGHIJ', 1, false)).toEqual([
      {mode: MODE_ALPHANUMERIC, data: 'ABCDE12FGHIJ'},
    ]);
    expect(optimizeSegments('abc12def', 1, false)).toEqual([
      {mode: MODE_OCTET, data: [0x61, 0x62, 0x63, 0x31, 0x32, 0x64, 0x65, 0x66]},
    ]);
  });

  test('preserves pure-mode, number, leading-zero, empty, and Unicode inputs', () => {
    expect(optimizeSegments(12345, 1, false)).toEqual([{mode: MODE_NUMERIC, data: '12345'}]);
    expect(optimizeSegments('00123', 1, false)).toEqual([{mode: MODE_NUMERIC, data: '00123'}]);
    expect(optimizeSegments('HELLO WORLD', 1, false)).toEqual([
      {mode: MODE_ALPHANUMERIC, data: 'HELLO WORLD'},
    ]);
    expect(optimizeSegments('hello', 1, false)).toEqual([
      {mode: MODE_OCTET, data: [0x68, 0x65, 0x6c, 0x6c, 0x6f]},
    ]);
    expect(optimizeSegments('', 1, false)).toEqual([{mode: MODE_NUMERIC, data: ''}]);
    expect(optimizeSegments('AB✅🚀1234567890', 1, false)).toEqual([
      {mode: MODE_OCTET, data: encodeUTF8('AB✅🚀')},
      {mode: MODE_NUMERIC, data: '1234567890'},
    ]);
    expect(optimizeSegments('\ud800', 1, false)).toEqual([
      {mode: MODE_OCTET, data: [0xef, 0xbf, 0xbd]},
    ]);
  });

  test('matches a brute-force minimum for short inputs', () => {
    const alphabet = ['1', 'A', 'a'];
    for (const eci of [false, true]) {
      for (const version of [1, 10, 27] as const) {
        for (let length = 1; length <= 5; length++) {
          for (const input of stringsOfLength(alphabet, length)) {
            const optimized = optimizeSegments(input, version, eci);
            expect(
              getSegmentsBitLength(version, optimized, eci),
              `${eci}:${version}: ${input}`,
            ).toBe(bruteForceMinimumBitLength(input, version, eci));
          }
        }
      }
    }
  });
});

function bruteForceMinimumBitLength(input: string, version: QRCodeVersion, eci: boolean): number {
  const characters = Array.from(input);
  const cache = new Map<string, number>();

  const visit = (start: number, hasUTF8ECI: boolean): number => {
    if (start === characters.length) return 0;
    const key = `${start}:${Number(hasUTF8ECI)}`;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;

    let best = Number.POSITIVE_INFINITY;
    for (let end = start + 1; end <= characters.length; end++) {
      const text = characters.slice(start, end).join('');
      for (const mode of MODES) {
        const encoded = validateData(mode, text);
        if (encoded === undefined) continue;
        const segment = {mode, data: encoded} satisfies QRCodeEncodedSegment;
        const introducesUTF8ECI = mode === MODE_OCTET && !hasUTF8ECI;
        const segmentBitLength =
          getSegmentsBitLength(version, [segment], eci) -
          (eci && mode === MODE_OCTET && !introducesUTF8ECI ? ECI_UTF8_BIT_LENGTH : 0);
        best = Math.min(best, segmentBitLength + visit(end, hasUTF8ECI || mode === MODE_OCTET));
      }
    }

    cache.set(key, best);
    return best;
  };

  return visit(0, false);
}

function* stringsOfLength(alphabet: readonly string[], length: number): Generator<string> {
  const indices = Array(length).fill(0) as number[];
  while (true) {
    yield indices.map((index) => alphabet[index]!).join('');
    let cursor = length - 1;
    while (cursor >= 0 && indices[cursor] === alphabet.length - 1) {
      indices[cursor] = 0;
      cursor--;
    }
    if (cursor < 0) return;
    indices[cursor]!++;
  }
}
