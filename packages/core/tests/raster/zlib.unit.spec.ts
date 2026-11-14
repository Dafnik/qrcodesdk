import {constants, deflateRawSync, deflateSync, inflateSync} from 'node:zlib';
import {describe, expect, test} from 'vitest';

import {zlibDeflate, zlibInflate} from '../../src/raster/zlib';

function randomBytes(length: number, seed: number, range = 256): Uint8Array {
  const bytes = new Uint8Array(length);
  for (let index = 0; index < length; index++) {
    seed = (Math.imul(seed, 1_103_515_245) + 12_345) >>> 0;
    bytes[index] = (seed >>> 16) % range;
  }
  return bytes;
}

/** Bytes shaped like filtered PNG rows: long zero runs with a few changes. */
function runs(length: number, seed: number): Uint8Array {
  const bytes = new Uint8Array(length);
  const random = randomBytes(length, seed);
  for (let index = 0; index < length; index++) {
    if (random[index]! < 12) bytes[index] = random[(index * 7) % length]!;
  }
  return bytes;
}

const INPUTS = [
  {name: 'empty input', data: new Uint8Array(0)},
  {name: 'one byte', data: Uint8Array.of(7)},
  {name: 'one repeated byte', data: new Uint8Array(70_000).fill(9)},
  {name: 'two bytes', data: Uint8Array.of(0, 255)},
  {name: 'random bytes', data: randomBytes(150_000, 1)},
  {name: 'a small alphabet', data: randomBytes(90_000, 2, 3)},
  {name: 'zero runs', data: runs(300_000, 3)},
];

describe('bundled zlib', () => {
  test.each(INPUTS)('round-trips $name through node:zlib', ({data}) => {
    const compressed = zlibDeflate(data);
    expect(Buffer.from(inflateSync(compressed)).equals(Buffer.from(data))).toBe(true);
    expect(Buffer.from(zlibInflate(compressed, data.length || 1)).equals(Buffer.from(data))).toBe(
      true,
    );
  });

  test.each(
    INPUTS.flatMap(({name, data}) =>
      [
        {level: 0, strategy: constants.Z_DEFAULT_STRATEGY},
        {level: 1, strategy: constants.Z_DEFAULT_STRATEGY},
        {level: 9, strategy: constants.Z_DEFAULT_STRATEGY},
        {level: 9, strategy: constants.Z_RLE},
        {level: 9, strategy: constants.Z_HUFFMAN_ONLY},
        {level: 9, strategy: constants.Z_FIXED},
      ].map((options) => ({name, data, ...options})),
    ),
  )(
    'inflates $name from node:zlib at level $level with strategy $strategy',
    ({data, ...options}) => {
      const compressed = deflateSync(data, options);
      expect(Buffer.from(zlibInflate(compressed, data.length || 1)).equals(Buffer.from(data))).toBe(
        true,
      );
    },
  );

  test('compresses filtered rows about as well as node:zlib with the run-length strategy', () => {
    const data = runs(300_000, 4);
    const reference = deflateSync(data, {level: 9, strategy: constants.Z_RLE}).length;
    expect(zlibDeflate(data).length).toBeLessThanOrEqual(Math.ceil(reference * 1.1));
  });

  test('stores incompressible blocks', () => {
    const data = randomBytes(200_000, 5);
    expect(zlibDeflate(data).length).toBeLessThan(data.length + 64);
  });

  test('limits the output length', () => {
    const data = new Uint8Array(1000);
    expect(() => zlibInflate(zlibDeflate(data), 999)).toThrow(RangeError);
    expect(zlibInflate(zlibDeflate(data), 1000)).toHaveLength(1000);
  });

  test('rejects malformed streams', () => {
    const valid = zlibDeflate(randomBytes(500, 6, 4));
    const corrupt = (index: number, value: number) => {
      const bytes = Uint8Array.from(valid);
      bytes[index] = value;
      return bytes;
    };
    const raw = deflateRawSync(Uint8Array.of(1, 2, 3));
    const preset = Buffer.concat([Uint8Array.of(0x78, 0xbb), new Uint8Array(4), raw]);
    for (const source of [
      new Uint8Array(0),
      Uint8Array.of(0x78),
      corrupt(0, 0x79),
      corrupt(1, 0x9d),
      preset,
      valid.subarray(0, valid.length - 1),
      valid.subarray(0, 10),
      corrupt(valid.length - 1, valid[valid.length - 1]! ^ 1),
      // A reserved block type.
      Uint8Array.of(0x78, 0x9c, 0x07),
      // A stored block whose length does not match its complement.
      Uint8Array.of(0x78, 0x9c, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00),
      // A distance before the start of the output.
      Uint8Array.of(0x78, 0x9c, 0x03, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01),
    ]) {
      expect(() => zlibInflate(source, 10_000)).toThrow();
    }
  });
});
