import {describe, expect, test, vi} from 'vitest';

import {QRCodeError, type QRCodeSegmenter, qrcode} from '../src';
import {kanji} from '../src/kanji';
import {decodeKanjiTable} from '../src/kanji/decode-table';
import {KANJI_TABLE} from '../src/kanji/table';
import {encode} from '../src/matrix/encode';
import {resolveKanjiLookup} from '../src/matrix/kanji';
import {MODE_KANJI, getCharacterCountBits, validatePayload} from '../src/matrix/mode';
import {automaticSegmenter} from '../src/segmenter';
import {kanjiModeValues, shiftJISKanjiValues} from './helpers';

const lookup = resolveKanjiLookup(kanji)!;

function bitsToCodewords(bits: string, length: number): number[] {
  const padded = bits.padEnd(Math.ceil(bits.length / 8) * 8, '0');
  const codewords = Array.from({length: padded.length / 8}, (_, index) =>
    parseInt(padded.slice(index * 8, index * 8 + 8), 2),
  );
  for (let pad = 0xec; codewords.length < length; pad ^= 0xec ^ 0x11) codewords.push(pad);
  return codewords;
}

function expectError(run: () => unknown, code: QRCodeError['code']): void {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(QRCodeError);
    expect((error as QRCodeError).code).toBe(code);
    return;
  }
  throw new Error('Expected a QRCodeError');
}

describe('Kanji table', () => {
  test('matches the WHATWG Shift_JIS decoder for every UTF-16 code unit', () => {
    const expected = shiftJISKanjiValues();
    expect(expected.size).toBe(6_953);
    for (let codeUnit = 0; codeUnit < 0x10000; codeUnit++) {
      expect(lookup(codeUnit), codeUnit.toString(16)).toBe(
        expected.get(String.fromCharCode(codeUnit)) ?? -1,
      );
    }
  });

  test('keeps the lowest value for characters with several Shift JIS codes', () => {
    // U+2252 is both 0x81E0 (JIS X 0208) and 0x8790 (NEC row 13).
    expect(lookup(0x2252)).toBe(0x00a0);
    expect(decodeKanjiTable(KANJI_TABLE).filter(Boolean)).toHaveLength(6_953);
  });

  test('exposes one frozen opaque value', () => {
    expect(Object.isFrozen(kanji)).toBe(true);
    expect(Object.keys(kanji)).toEqual([]);
  });
});

describe('Kanji mode encoding', () => {
  test('encodes the ISO/IEC 18004 example', () => {
    // 点 is 0x935F and 茗 is 0xE4AA in Shift JIS.
    expect(validatePayload(MODE_KANJI, '点茗', lookup)).toEqual([0x0d9f, 0x1aaa]);
    expect(encode(1, [{mode: MODE_KANJI, payload: [0x0d9f, 0x1aaa]}], 19, false)).toEqual(
      bitsToCodewords('1000' + '00000010' + '0110110011111' + '1101010101010' + '0000', 19),
    );
  });

  test('uses 8, 10, and 12 character count bits', () => {
    expect(
      [1, 9, 10, 26, 27, 40].map((version) => getCharacterCountBits(MODE_KANJI, version as 1)),
    ).toEqual([8, 8, 10, 10, 12, 12]);
  });

  test.each([
    {version: 1, errorCorrectionLevel: 'L', capacity: 10},
    {version: 1, errorCorrectionLevel: 'H', capacity: 4},
    {version: 10, errorCorrectionLevel: 'M', capacity: 131},
    {version: 40, errorCorrectionLevel: 'L', capacity: 1_817},
    {version: 40, errorCorrectionLevel: 'H', capacity: 784},
  ] as const)(
    'fits $capacity characters in version $version-$errorCorrectionLevel',
    ({version, errorCorrectionLevel, capacity}) => {
      const builder = (length: number) =>
        qrcode('漢字テスト'.repeat(400).slice(0, length))
          .mode('kanji')
          .kanji(kanji)
          .version(version)
          .errorCorrection(errorCorrectionLevel)
          .mask(0);
      expect(builder(capacity).matrix().width).toBe(17 + 4 * version);
      expectError(() => builder(capacity + 1).matrix(), 'PAYLOAD_TOO_LARGE');
    },
  );

  test('detects Kanji mode in auto mode only with the table', () => {
    const forced = qrcode('漢字テスト').mode('kanji').kanji(kanji).mask(0).matrix();
    expect(qrcode('漢字テスト').kanji(kanji).mask(0).matrix()).toEqual(forced);
    expect(qrcode('漢字テスト').mask(0).matrix()).toEqual(
      qrcode('漢字テスト').mode('octet').mask(0).matrix(),
    );
    expect(qrcode('漢字テスト').kanji(kanji).kanji().mask(0).matrix()).toEqual(
      qrcode('漢字テスト').mode('octet').mask(0).matrix(),
    );
    // Numeric and alphanumeric detection win, and payloads with other characters stay octet.
    expect(qrcode('123').kanji(kanji).matrix()).toEqual(qrcode('123').mode('numeric').matrix());
    expect(qrcode('ABC').kanji(kanji).matrix()).toEqual(
      qrcode('ABC').mode('alphanumeric').matrix(),
    );
    expect(qrcode('漢字 abc').kanji(kanji).matrix()).toEqual(
      qrcode('漢字 abc').mode('octet').matrix(),
    );
  });

  test('never emits an ECI header for Kanji segments', () => {
    expect(qrcode('漢字').mode('kanji').kanji(kanji).eci(true).mask(0).matrix()).toEqual(
      qrcode('漢字').mode('kanji').kanji(kanji).mask(0).matrix(),
    );
  });

  test('accepts Kanji segments from a custom segmenter', () => {
    const segmenter = vi.fn<QRCodeSegmenter>(() => [
      {mode: 'kanji', payload: '点茗'},
      {mode: 'numeric', payload: '123'},
    ]);
    const matrix = qrcode('点茗123').segmenter(segmenter).kanji(kanji).version(1).mask(0).matrix();
    expect(segmenter).toHaveBeenCalledExactlyOnceWith('点茗123', {version: 1, eci: false, kanji});
    expect(matrix).toEqual(
      qrcode('点茗123').segmenter(automaticSegmenter).kanji(kanji).version(1).mask(0).matrix(),
    );
    expect(kanjiModeValues('点茗')).toEqual([0x0d9f, 0x1aaa]);
  });
});

describe('Kanji mode errors', () => {
  test('requires the Kanji table', () => {
    expectError(() => qrcode('漢字').mode('kanji').matrix(), 'INVALID_OPTIONS');
    expectError(
      () =>
        qrcode('漢字')
          .segmenter(() => [{mode: 'kanji', payload: '漢字'}])
          .matrix(),
      'INVALID_OPTIONS',
    );
    expect(() => qrcode('漢字').mode('kanji').matrix()).toThrow(
      'QR code kanji must be the kanji table from @qrcodesdk/core/kanji for Kanji mode',
    );
  });

  test.each([{}, Object.freeze({}), 'kanji', null, true])('rejects %s as Kanji table', (value) => {
    expectError(
      () =>
        qrcode('漢字')
          .options({kanji: value as never})
          .matrix(),
      'INVALID_OPTIONS',
    );
    expectError(
      () => automaticSegmenter('漢字', {version: 1, eci: false, kanji: value as never}),
      'INVALID_OPTIONS',
    );
  });

  // U+2212 has no Shift JIS code of its own; the WHATWG encoder substitutes U+FF0D.
  test.each(['A', '🚀', '\ud800', '−', '漢字🚀'])('rejects %s in forced Kanji mode', (payload) => {
    expectError(() => qrcode(payload).mode('kanji').kanji(kanji).matrix(), 'INVALID_PAYLOAD');
    expectError(
      () =>
        qrcode(payload)
          .segmenter(() => [{mode: 'kanji', payload}])
          .kanji(kanji)
          .matrix(),
      'INVALID_PAYLOAD',
    );
  });

  test('rejects Kanji mode for numbers', () => {
    expectError(() => qrcode(123).mode('kanji').kanji(kanji).matrix(), 'INVALID_PAYLOAD');
  });
});
