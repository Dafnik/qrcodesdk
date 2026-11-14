import {readFileSync} from 'node:fs';
import {describe, expect, expectTypeOf, test} from 'vitest';

import {
  QRCodeError,
  type QRCodeMatrixOptions,
  QRCodeSVGRenderer,
  type QRCodeSymbol,
  QRCodeTextRenderer,
  QR_CODE_MODULE_ROLES as ROLES,
  qrcode,
} from '../../src';
import {kanji} from '../../src/kanji';
import {calculateECC} from '../../src/matrix/calculate-ecc';
import {getGF256GeneratorPolynomial} from '../../src/matrix/error-correction';
import {resolveKanjiLookup} from '../../src/matrix/kanji';
import {MODE_ALPHANUMERIC, MODE_KANJI, MODE_NUMERIC, MODE_OCTET} from '../../src/matrix/mode';
import {createSingleSegment} from '../../src/matrix/segments';
import type {QRCodeSupportedModeIndicator} from '../../src/matrix/types';
import {
  type QRCodeMicroMask,
  type QRCodeMicroOptions,
  type QRCodeMicroVersion,
  microQR,
} from '../../src/micro';
import {
  encodeMicro,
  getMicroCharacterCountBits,
  getMicroModeIndicator,
  supportsMicroMode,
} from '../../src/micro/encode';
import {fillMicroFormatInformation} from '../../src/micro/matrix';
import {
  getMicroDataBits,
  getMicroDataCodewords,
  getMicroErrorCorrectionCodewords,
  getMicroSymbolNumber,
} from '../../src/micro/tables';
import {finder, rounded} from '../../src/style';
import type {QRCodeErrorCorrectionLevel, QRCodeMode} from '../../src/types';
import {fixturePayload, toRows} from '../helpers';

type Level = Extract<QRCodeErrorCorrectionLevel, 'L' | 'M' | 'Q'>;
type Mode = Exclude<QRCodeMode, 'auto'>;

function micro(
  payload: string | number,
  options: QRCodeMicroOptions = {},
  matrixOptions: Omit<QRCodeMatrixOptions, 'symbol'> = {},
) {
  return qrcode(payload)
    .options({...matrixOptions, symbol: microQR(options)} as QRCodeMatrixOptions)
    .matrix();
}

function expectQRCodeError(run: () => unknown, code: QRCodeError['code'], field?: string): void {
  let error: unknown;
  try {
    run();
  } catch (caught) {
    error = caught;
  }
  expect(error).toBeInstanceOf(QRCodeError);
  expect((error as QRCodeError).code).toBe(code);
  if (field !== undefined) expect((error as QRCodeError).details.field).toBe(field);
}

// ISO/IEC 18004:2015 Table 7: data capacity by symbol, level, and mode.
const CAPACITIES: readonly [QRCodeMicroVersion, Level, Record<Mode, number>][] = [
  ['M1', 'L', {numeric: 5, alphanumeric: 0, octet: 0, kanji: 0}],
  ['M2', 'L', {numeric: 10, alphanumeric: 6, octet: 0, kanji: 0}],
  ['M2', 'M', {numeric: 8, alphanumeric: 5, octet: 0, kanji: 0}],
  ['M3', 'L', {numeric: 23, alphanumeric: 14, octet: 9, kanji: 6}],
  ['M3', 'M', {numeric: 18, alphanumeric: 11, octet: 7, kanji: 4}],
  ['M4', 'L', {numeric: 35, alphanumeric: 21, octet: 15, kanji: 9}],
  ['M4', 'M', {numeric: 30, alphanumeric: 18, octet: 13, kanji: 8}],
  ['M4', 'Q', {numeric: 21, alphanumeric: 13, octet: 9, kanji: 5}],
];

describe('Micro QR tables', () => {
  test('match ISO/IEC 18004:2015 Tables 7 and 9', () => {
    // Symbol, data codewords, data bits, error-correction codewords.
    const expected = [
      [1, 0, 0, 3, 20, 2],
      [2, 0, 1, 5, 40, 5],
      [2, 1, 2, 4, 32, 6],
      [3, 0, 3, 11, 84, 6],
      [3, 1, 4, 9, 68, 8],
      [4, 0, 5, 16, 128, 8],
      [4, 1, 6, 14, 112, 10],
      [4, 2, 7, 10, 80, 14],
    ] as const;
    for (const [version, level, symbolNumber, codewords, bits, ecc] of expected) {
      expect(getMicroSymbolNumber(version, level, true)).toBe(symbolNumber);
      expect(getMicroDataCodewords(version, symbolNumber)).toBe(codewords);
      expect(getMicroDataBits(version, symbolNumber)).toBe(bits);
      expect(getMicroErrorCorrectionCodewords(symbolNumber)).toBe(ecc);
    }
  });

  test('rejects levels a version does not support', () => {
    expect(getMicroSymbolNumber(1, 0, false)).toBe(-1);
    expect(getMicroSymbolNumber(1, 1, true)).toBe(0);
    expect(getMicroSymbolNumber(1, 2, true)).toBe(-1);
    expect(getMicroSymbolNumber(2, 2, true)).toBe(-1);
    expect(getMicroSymbolNumber(3, 2, false)).toBe(-1);
    expect(getMicroSymbolNumber(4, 3, false)).toBe(-1);
  });

  test('uses Micro QR character count widths', () => {
    expect([1, 2, 3, 4].map((v) => getMicroCharacterCountBits(v as 1, MODE_NUMERIC))).toEqual([
      3, 4, 5, 6,
    ]);
    expect([2, 3, 4].map((v) => getMicroCharacterCountBits(v as 2, MODE_ALPHANUMERIC))).toEqual([
      3, 4, 5,
    ]);
    expect([3, 4].map((v) => getMicroCharacterCountBits(v as 3, MODE_OCTET))).toEqual([4, 5]);
    expect([3, 4].map((v) => getMicroCharacterCountBits(v as 3, MODE_KANJI))).toEqual([3, 4]);
  });

  test('uses Micro QR mode indicators and the first version of each mode', () => {
    const MODES: readonly QRCodeSupportedModeIndicator[] = [
      MODE_NUMERIC,
      MODE_ALPHANUMERIC,
      MODE_OCTET,
      MODE_KANJI,
    ];
    expect(MODES.map(getMicroModeIndicator)).toEqual([0, 1, 2, 3]);
    const firstVersion = (mode: QRCodeSupportedModeIndicator) =>
      ([1, 2, 3, 4] as const).find((version) => supportsMicroMode(version, mode));
    expect(MODES.map(firstVersion)).toEqual([1, 2, 3, 3]);
  });
});

describe('Micro QR encoding', () => {
  test('encodes the ISO/IEC 18004:2015 Annex example 01234567 as M2-L', () => {
    const data = encodeMicro(2, createSingleSegment(MODE_NUMERIC, '01234567')!, 40);
    expect(data).toEqual([0x40, 0x18, 0xac, 0xc3, 0x00]);
    expect(calculateECC(data, getGF256GeneratorPolynomial(5))).toEqual([
      0x86, 0x0d, 0x22, 0xae, 0x30,
    ]);
  });

  test('pads with alternating codewords and a zero final 4-bit codeword', () => {
    // M3-L: mode 00, count 00001, data 0001, and a 7-bit terminator fill 18 bits.
    expect(encodeMicro(3, createSingleSegment(MODE_NUMERIC, '1')!, 84)).toEqual([
      0b00000010, 0b00100000, 0x00, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec, 0x00,
    ]);
    // M1: count 101, then 0001111011 and 0101101 fill all 20 data bits, ending in a 4-bit codeword.
    expect(encodeMicro(1, createSingleSegment(MODE_NUMERIC, '12345')!, 20)).toEqual([
      0b10100011, 0b11011010, 0b11010000,
    ]);
  });

  test('truncates the terminator when the data is nearly full', () => {
    // M2-M: 1 + 4 + 27 data bits = 32 bits, so no terminator fits.
    expect(encodeMicro(2, createSingleSegment(MODE_NUMERIC, '12345678')!, 32)).toHaveLength(4);
  });

  test('writes all 32 format codes as BCH(15,5) words masked with 0x4445', () => {
    for (let symbolNumber = 0; symbolNumber < 8; symbolNumber++) {
      for (let mask = 0; mask < 4; mask++) {
        const modules = fillMicroFormatInformation(new Uint8Array(11 * 11), 11, symbolNumber, mask);
        let code = 0;
        for (let x = 1; x <= 8; x++) code = (code << 1) | modules[8 * 11 + x]!;
        for (let y = 7; y >= 1; y--) code = (code << 1) | modules[y * 11 + 8]!;
        const word = code ^ 0x4445;
        expect(word >> 10).toBe((symbolNumber << 2) | mask);
        let remainder = word;
        for (let bit = 14; bit >= 10; bit--) {
          if ((remainder >> bit) & 1) remainder ^= 0x537 << (bit - 10);
        }
        expect(remainder).toBe(0);
      }
    }
    expect(fillMicroFormatInformation(new Uint8Array(121), 11, 0, 0)[8 * 11 + 1]).toBe(1);
  });
});

describe('Micro QR matrices', () => {
  const references = readFileSync(new URL('__fixtures__/segno-micro-qr.txt', import.meta.url))
    .toString()
    .split('\n\n')
    .filter((block) => block.startsWith('{'))
    .map((block) => {
      const [header, ...rows] = block.trim().split('\n');
      return {
        ...(JSON.parse(header!) as {
          payload: string;
          mode: Mode;
          version: QRCodeMicroVersion | null;
          errorCorrectionLevel: Level;
          mask: QRCodeMicroMask | null;
          symbol: string;
          selectedMask: QRCodeMicroMask;
        }),
        rows,
      };
    });

  test('loads the segno references', () => {
    expect(references.length).toBeGreaterThan(80);
    expect(new Set(references.map(({symbol}) => symbol))).toEqual(
      new Set(['M1', 'M2-L', 'M2-M', 'M3-L', 'M3-M', 'M4-L', 'M4-M', 'M4-Q']),
    );
  });

  test.each(references)(
    'matches segno for $payload ($mode) as $symbol, mask $selectedMask',
    ({payload, mode, version, errorCorrectionLevel, mask, rows}) => {
      const matrix = micro(
        payload,
        {version: version ?? undefined, mask: mask ?? undefined},
        {mode, errorCorrectionLevel, kanji},
      );
      expect(toRows(matrix).map((row) => row.join(''))).toEqual(rows);
    },
  );

  test.each([1, 2, 3, 4] as const)('lays out the function patterns of M%i', (version) => {
    const matrix = micro('1', {version: `M${version}`}, {errorCorrectionLevel: 'L'});
    const n = version * 2 + 9;
    const count = (role: number) => matrix.roles.filter((value) => value === role).length;
    expect(matrix.width).toBe(n);
    expect(count(ROLES.finderCenter)).toBe(9);
    expect(count(ROLES.finderRing)).toBe(40);
    expect(count(ROLES.separator)).toBe(15);
    expect(count(ROLES.format)).toBe(15);
    expect(count(ROLES.timing)).toBe(2 * (n - 8));
    expect(count(ROLES.alignmentRing) + count(ROLES.alignmentCenter)).toBe(0);
    expect(count(ROLES.version)).toBe(0);
    // Every data module holds one data or error-correction bit.
    expect(count(ROLES.data)).toBe([5, 10, 17, 24][version - 1]! * 8 - (version & 1) * 4);
    for (let i = 8; i < n; i++) {
      expect(matrix.modules[i]).toBe(+(i % 2 === 0));
      expect(matrix.modules[i * n]).toBe(+(i % 2 === 0));
    }
    expect(Object.isFrozen(matrix.modules)).toBe(true);
    expect(Object.isFrozen(matrix.roles)).toBe(true);
  });

  test('explicit masks differ from each other only in data modules', () => {
    const [first, ...others] = ([0, 1, 2, 3] as const).map((mask) => micro('01234567', {mask}));
    for (const other of others) {
      for (let index = 0; index < first!.modules.length; index++) {
        const role = first!.roles[index];
        if (role !== ROLES.data && role !== ROLES.format) {
          expect(other.modules[index]).toBe(first!.modules[index]);
        }
      }
    }
  });
});

describe('Micro QR version selection', () => {
  test.each(
    CAPACITIES.flatMap(([version, level, capacities]) =>
      (Object.entries(capacities) as [Mode, number][])
        .filter(([, capacity]) => capacity > 0)
        .map(([mode, capacity]) => ({version, level, mode, capacity})),
    ),
  )('$version-$level holds $capacity $mode characters', ({version, level, mode, capacity}) => {
    const payload = fixturePayload(mode, capacity);
    const options = {mode, errorCorrectionLevel: level, kanji} as const;
    expect(micro(payload, {version}, options).width).toBe(+version[1]! * 2 + 9);
    expectQRCodeError(
      () => micro(fixturePayload(mode, capacity + 1), {version}, options),
      'PAYLOAD_TOO_LARGE',
    );
  });

  test('chooses the smallest version that holds the payload and supports the level', () => {
    expect(micro('12345').width).toBe(13);
    expect(micro('12345', {}, {errorCorrectionLevel: 'L'}).width).toBe(13);
    expect(micro('12345', {}, {errorCorrectionLevel: 'Q'}).width).toBe(17);
    expect(micro('HELLO WORLD').width).toBe(15);
    expect(micro('hello').width).toBe(15);
    expect(micro(12345678901).width).toBe(15);
    expect(micro(fixturePayload('numeric', 35), {}, {errorCorrectionLevel: 'L'}).width).toBe(17);
  });

  test('uses M1 only when requested', () => {
    expect(micro('12345', {version: 'M1'}).width).toBe(11);
    expect(micro('12345', {version: 'M1'}, {errorCorrectionLevel: 'L'}).width).toBe(11);
    expectQRCodeError(
      () => micro('12345', {version: 'M1'}, {errorCorrectionLevel: 'Q'}),
      'INVALID_OPTIONS',
      'errorCorrectionLevel',
    );
    expectQRCodeError(() => micro('A', {version: 'M1'}), 'PAYLOAD_TOO_LARGE');
  });

  test('rejects levels and options that Micro QR codes do not support', () => {
    expectQRCodeError(
      () => micro('1', {}, {errorCorrectionLevel: 'H'}),
      'INVALID_OPTIONS',
      'errorCorrectionLevel',
    );
    expectQRCodeError(
      () => micro('1', {version: 'M3'}, {errorCorrectionLevel: 'Q'}),
      'INVALID_OPTIONS',
      'errorCorrectionLevel',
    );
    for (const [field, value] of [
      ['version', 1],
      ['mask', 0],
      ['eci', true],
      ['segmenter', () => [{mode: 'numeric', payload: '1'}]],
    ] as const) {
      expectQRCodeError(
        () => micro('1', {}, {[field]: value} as QRCodeMatrixOptions),
        'INVALID_OPTIONS',
        field,
      );
    }
    expect(micro('1', {}, {eci: false} as QRCodeMatrixOptions).width).toBe(13);
    expectQRCodeError(() => microQR({version: 'M5' as 'M1'}), 'INVALID_OPTIONS', 'microQR.version');
    expectQRCodeError(() => microQR({mask: 4 as 0}), 'INVALID_OPTIONS', 'microQR.mask');
    expectQRCodeError(() => microQR({mask: 1.5 as 0}), 'INVALID_OPTIONS', 'microQR.mask');
    expectQRCodeError(
      () => microQR({fallback: 'yes' as unknown as boolean}),
      'INVALID_OPTIONS',
      'microQR.fallback',
    );
  });

  test('rejects invalid payloads', () => {
    expectQRCodeError(() => micro(-1), 'INVALID_PAYLOAD');
    expectQRCodeError(() => micro('abc', {}, {mode: 'numeric'}), 'INVALID_PAYLOAD');
    expectQRCodeError(() => micro('hello', {}, {mode: 'alphanumeric'}), 'INVALID_PAYLOAD');
  });

  test('throws or falls back to a standard QR code when no Micro QR code fits', () => {
    const payload = 'https://qrcodesdk.dev/packages/core';
    expectQRCodeError(() => micro(payload), 'PAYLOAD_TOO_LARGE');
    expectQRCodeError(() => micro('hello', {version: 'M2'}), 'PAYLOAD_TOO_LARGE');
    expect(micro(payload, {fallback: true})).toEqual(qrcode(payload).matrix());
    expect(micro(payload, {fallback: true}, {errorCorrectionLevel: 'Q'})).toEqual(
      qrcode(payload).errorCorrection('Q').matrix(),
    );
    expect(micro('1', {fallback: true}, {errorCorrectionLevel: 'H'})).toEqual(
      qrcode('1').errorCorrection('H').matrix(),
    );
    expect(micro('12345', {fallback: true}).width).toBe(13);
  });

  test('works through the builder chain and caches the matrix', () => {
    const builder = qrcode('12345').options({symbol: microQR()}).errorCorrection('L');
    expect(builder.matrix()).toBe(builder.matrix());
    expect(builder.matrix().width).toBe(13);
    expectQRCodeError(() => builder.version(2).matrix(), 'INVALID_OPTIONS', 'version');
    expect(builder.options({symbol: undefined}).matrix().width).toBe(21);
  });

  test('types the symbol options', () => {
    expectTypeOf(microQR()).toEqualTypeOf<QRCodeSymbol>();
    expectTypeOf<{symbol: QRCodeSymbol}>().toMatchTypeOf<QRCodeMatrixOptions>();
    expectTypeOf<{symbol: QRCodeSymbol; version: 1}>().not.toMatchTypeOf<QRCodeMatrixOptions>();
    expectTypeOf<{symbol: QRCodeSymbol; eci: true}>().not.toMatchTypeOf<QRCodeMatrixOptions>();
    expectTypeOf<{symbol: QRCodeSymbol; mask: 0}>().not.toMatchTypeOf<QRCodeMatrixOptions>();
  });
});

describe('Micro QR Kanji mode', () => {
  test('encodes the ISO/IEC 18004 example 点茗 with a 2-bit Kanji indicator in M3', () => {
    // Mode 11, count 010, then 点 0x0D9F and 茗 0x1AAA in 13 bits each, and a 7-bit terminator.
    const segment = createSingleSegment(MODE_KANJI, '点茗', kanjiLookup())!;
    expect(encodeMicro(3, segment, 84).slice(0, 5)).toEqual([
      0b11010011, 0b01100111, 0b11110101, 0b01010100, 0b00000000,
    ]);
  });

  test('uses Kanji mode for Japanese text when the Kanji table is present', () => {
    const payload = '東京タワー';
    // Five Kanji characters fit M3, while their 15 UTF-8 bytes need M4.
    expect(micro(payload, {}, {errorCorrectionLevel: 'L', kanji}).width).toBe(15);
    expect(micro(payload, {}, {errorCorrectionLevel: 'L'}).width).toBe(17);
    expect(micro(payload, {}, {errorCorrectionLevel: 'L', mode: 'kanji', kanji}).width).toBe(15);
  });

  test('requires the Kanji table and M3 or larger', () => {
    expectQRCodeError(() => micro('点茗', {}, {mode: 'kanji'}), 'INVALID_OPTIONS', 'kanji');
    expectQRCodeError(
      () => micro('点茗', {}, {mode: 'kanji', kanji: {} as typeof kanji}),
      'INVALID_OPTIONS',
      'kanji',
    );
    expectQRCodeError(
      () => micro('点茗', {version: 'M2'}, {mode: 'kanji', kanji, errorCorrectionLevel: 'L'}),
      'PAYLOAD_TOO_LARGE',
    );
    expectQRCodeError(() => micro('Grüße', {}, {mode: 'kanji', kanji}), 'INVALID_PAYLOAD');
  });

  test('passes the Kanji table to the standard QR code fallback', () => {
    const payload = createKanjiPayload(20);
    expect(micro(payload, {fallback: true}, {mode: 'kanji', kanji})).toEqual(
      qrcode(payload).options({mode: 'kanji', kanji}).matrix(),
    );
  });
});

describe('Micro QR rendering', () => {
  const matrix = micro('12345');

  test('defaults the quiet zone to 2 modules for Micro QR and 4 for standard QR codes', () => {
    expect(QRCodeSVGRenderer({style: {moduleSize: 1}})(matrix)).toContain('viewBox="0 0 17 17"');
    expect(QRCodeSVGRenderer({style: {moduleSize: 1, quietZone: 4}})(matrix)).toContain(
      'viewBox="0 0 21 21"',
    );
    expect(QRCodeSVGRenderer({style: {moduleSize: 1}})(qrcode('1').matrix())).toContain(
      'viewBox="0 0 29 29"',
    );
    expect(
      QRCodeTextRenderer({layout: 'full', style: {moduleSize: 1}})(matrix).split('\n'),
    ).toHaveLength(17);
  });

  test('draws the one finder pattern of a Micro QR code with a finder style', () => {
    const svg = QRCodeSVGRenderer({
      style: {modules: rounded(), finder: finder({color: '#ff0000'})},
    })(matrix);
    // One 7x7 ring (four edges) and one 3x3 center, offset by the 2-module quiet zone.
    expect(svg.match(/<path fill="#ff0000"[^>]*d="([^"]*)"/)?.[1]).toBe(
      'm2 2h7v1h-7zm0 6h7v1h-7zm0 -5h1v5h-1zm6 0h1v5h-1zm-4 1h3v3h-3z',
    );
  });
});

function kanjiLookup() {
  return resolveKanjiLookup(kanji)!;
}

function createKanjiPayload(length: number): string {
  return fixturePayload('kanji', length);
}
