import assert from 'node:assert/strict';
import {describe, test} from 'vitest';

import {
  type QRCodeErrorCorrectionLevel,
  type QRCodeMask,
  type QRCodeSegmenter,
  type QRCodeVersion,
  qrcode,
} from '@qrcodesdk/core';
import {kanji} from '@qrcodesdk/core/kanji';
import {type QRCodeMicroMask, type QRCodeMicroVersion, microQR} from '@qrcodesdk/core/micro';

import {type QRCodeExplainOptions, explainQRCode} from './qrcode-analyzer.ts';
import {
  ECC_LEVELS_MAP,
  type QRCodeMicroVersionNumber,
  applyMaskToMatrix,
  createBaseMatrix,
  createMicroBaseMatrix,
  evaluateMatrix,
  fillDataInMatrix,
  fillFormatInformationInMatrix,
  fillMicroData,
  fillMicroFormatInformation,
  getMicroDataBits,
} from './qrcode-core-source.ts';
import {MICRO_STANDARD_MASKS} from './qrcode-symbol.ts';
import type {QRCodeEncodingTrace, QRCodeTraceRequest} from './qrcode-trace-types.ts';
import {analyzeQRCodeEncoding} from './qrcode-trace.ts';

const LEVELS = ['L', 'M', 'Q', 'H'] as const satisfies readonly QRCodeErrorCorrectionLevel[];

function trace(options: QRCodeExplainOptions): QRCodeEncodingTrace {
  const {matrix, traceRequest} = explainQRCode(options);
  return analyzeQRCodeEncoding(matrix, traceRequest);
}

function hex(values: readonly number[]): string {
  return values.map((value) => value.toString(16).padStart(2, '0')).join(' ');
}

/**
 * Rebuilds the matrix from the traced codewords in placement order, the selected mask, and the
 * format information, independently of the matrix the trace read them from.
 */
function reconstruct(result: QRCodeEncodingTrace): number[] {
  const codewords = result.interleaving.map(({value}) => value);
  if (result.family === 'micro') {
    const version = Number(result.symbol.version.slice(1)) as QRCodeMicroVersionNumber;
    const {size, modules, roles} = createMicroBaseMatrix(version);
    const symbolNumber = microSymbolNumber(result);
    const filled = fillMicroData(
      modules.slice(),
      roles,
      size,
      codewords,
      getMicroDataBits(version, symbolNumber),
    );
    applyMaskToMatrix(filled, roles, size, MICRO_STANDARD_MASKS[result.symbol.mask]);
    return [...fillMicroFormatInformation(filled, size, symbolNumber, result.symbol.mask)];
  }
  const {size, modules, roles} = createBaseMatrix(result.symbol.version);
  const filled = fillDataInMatrix(modules.slice(), roles, size, codewords);
  applyMaskToMatrix(filled, roles, size, result.symbol.mask);
  return [
    ...fillFormatInformationInMatrix(
      filled,
      size,
      ECC_LEVELS_MAP[result.symbol.errorCorrectionLevel],
      result.symbol.mask,
    ),
  ];
}

function microSymbolNumber(result: Extract<QRCodeEncodingTrace, {family: 'micro'}>): number {
  const first = {M1: 0, M2: 1, M3: 3, M4: 5}[result.symbol.version];
  return first + ['L', 'M', 'Q'].indexOf(result.symbol.errorCorrectionLevel ?? 'L');
}

describe('analyzeQRCodeEncoding for standard QR codes', () => {
  test('recovers the blocks and codewords of every version and level', () => {
    for (let version = 1; version <= 40; version++) {
      for (const errorCorrectionLevel of LEVELS) {
        const options = {
          payload: 'Hi 12',
          version: version as QRCodeVersion,
          errorCorrectionLevel,
          mask: (version % 8) as QRCodeMask,
        };
        const result = trace(options);
        assert.equal(result.family, 'standard');
        const {capacity, blocks, interleaving} = result;
        assert.equal(interleaving.length, capacity.totalCodewords);
        assert.equal(
          blocks.reduce((sum, block) => sum + block.dataCodewords.length, 0),
          capacity.dataCodewords,
        );
        // Block lengths differ by at most one, and the longer blocks come last.
        const lengths = blocks.map((block) => block.dataCodewords.length);
        assert.ok(lengths.every((length, index) => index === 0 || length >= lengths[index - 1]!));
        assert.ok(Math.max(...lengths) - Math.min(...lengths) <= 1);
        let offset = 0;
        for (const block of blocks) {
          assert.equal(block.dataOffset, offset);
          offset += block.dataCodewords.length;
          assert.equal(
            block.errorCorrectionCodewords.length,
            blocks[0]!.errorCorrectionCodewords.length,
          );
        }
        assert.deepEqual(reconstruct(result), qrcode('Hi 12').options(options).matrix().modules);
      }
    }
  });

  test('matches the block structure of ISO/IEC 18004 Table 9', () => {
    const blockShape = (version: QRCodeVersion, errorCorrectionLevel: QRCodeErrorCorrectionLevel) =>
      trace({payload: '1', version, errorCorrectionLevel, mask: 0}).blocks.map(
        (block) => `${block.dataCodewords.length}+${block.errorCorrectionCodewords.length}`,
      );
    assert.deepEqual(blockShape(1, 'H'), ['9+17']);
    assert.deepEqual(blockShape(5, 'Q'), ['15+18', '15+18', '16+18', '16+18']);
    const largest = blockShape(40, 'H');
    assert.equal(largest.length, 81);
    assert.equal(largest.filter((shape) => shape === '15+30').length, 20);
    assert.equal(largest.filter((shape) => shape === '16+30').length, 61);
  });

  test('reproduces independently published codewords', () => {
    // ISO/IEC 18004 Annex I: "01234567" as a 1-M symbol.
    const numeric = trace({payload: '01234567', version: 1, errorCorrectionLevel: 'M'});
    assert.equal(
      hex(numeric.blocks[0]!.dataCodewords),
      '10 20 0c 56 61 80 ec 11 ec 11 ec 11 ec 11 ec 11',
    );
    assert.equal(hex(numeric.blocks[0]!.errorCorrectionCodewords), 'a5 24 d4 c1 ed 36 c7 87 2c 55');
    // The widely reproduced "HELLO WORLD" 1-Q example.
    const alphanumeric = trace({payload: 'HELLO WORLD', version: 1, errorCorrectionLevel: 'Q'});
    assert.equal(
      hex(alphanumeric.blocks[0]!.dataCodewords),
      '20 5b 0b 78 d1 72 dc 4d 43 40 ec 11 ec',
    );
    assert.equal(
      hex(alphanumeric.blocks[0]!.errorCorrectionCodewords),
      'a8 48 16 52 d9 36 9c 00 2e 0f b4 7a 10',
    );
  });

  test('interleaves data codewords across unequal blocks before the error correction', () => {
    const result = trace({payload: 'INTERLEAVE', version: 5, errorCorrectionLevel: 'Q', mask: 1});
    const {blocks, interleaving} = result;
    // Four blocks with 15, 15, 16, and 16 data codewords: 15 rounds of 4, then the 2 extras.
    assert.deepEqual(
      interleaving
        .slice(0, 5)
        .map(({blockIndex, kind, indexInBlock}) => [blockIndex, kind, indexInBlock]),
      [
        [0, 'data', 0],
        [1, 'data', 0],
        [2, 'data', 0],
        [3, 'data', 0],
        [0, 'data', 1],
      ],
    );
    assert.deepEqual(
      interleaving
        .slice(60, 63)
        .map(({blockIndex, kind, indexInBlock}) => [blockIndex, kind, indexInBlock]),
      [
        [2, 'data', 15],
        [3, 'data', 15],
        [0, 'ecc', 0],
      ],
    );
    for (const codeword of interleaving) {
      const block = blocks[codeword.blockIndex]!;
      const values =
        codeword.kind === 'data' ? block.dataCodewords : block.errorCorrectionCodewords;
      assert.equal(values[codeword.indexInBlock], codeword.value);
    }
    assert.equal(result.remainderBits, 7);
  });

  test('parses numeric, alphanumeric, octet, Kanji, and empty payloads', () => {
    const segment = (options: QRCodeExplainOptions) => {
      const [first, ...rest] = trace(options).segments;
      assert.equal(rest.length, 0);
      const {mode, count, countUnit, text, modeBits, countBits, payloadBits} = first!;
      return {mode, count, countUnit, text, modeBits, countBits, payloadBits};
    };
    assert.deepEqual(segment({payload: '12345'}), {
      mode: 'numeric',
      count: 5,
      countUnit: 'digits',
      text: '12345',
      modeBits: 4,
      countBits: 10,
      payloadBits: 17,
    });
    assert.deepEqual(segment({payload: 'AB1'}), {
      mode: 'alphanumeric',
      count: 3,
      countUnit: 'characters',
      text: 'AB1',
      modeBits: 4,
      countBits: 9,
      payloadBits: 17,
    });
    assert.deepEqual(segment({payload: '東京', kanji}), {
      mode: 'kanji',
      count: 2,
      countUnit: 'Kanji characters',
      text: '東京',
      modeBits: 4,
      countBits: 8,
      payloadBits: 26,
    });
    assert.deepEqual(segment({payload: ''}), {
      mode: 'numeric',
      count: 0,
      countUnit: 'digits',
      text: '',
      modeBits: 4,
      countBits: 10,
      payloadBits: 0,
    });
    // Octet mode counts UTF-8 bytes: é takes 2, ✅ 3, and 😀 4, while the string has 4 code units.
    const unicode = segment({payload: 'é✅😀'});
    assert.equal(unicode.count, 9);
    assert.equal(unicode.countUnit, 'bytes');
    assert.equal(unicode.text.length, 4);
    assert.equal(unicode.payloadBits, 72);
  });

  test('reports the UTF-8 ECI header before the first octet segment', () => {
    const result = trace({payload: 'ABC123abc\u00e9', eci: true, optimizeSegments: true});
    assert.equal(result.segmentation, 'automatic');
    assert.deepEqual(
      result.segments.map(({mode, text}) => [mode, text]),
      [
        ['alphanumeric', 'ABC123'],
        ['octet', 'abc\u00e9'],
      ],
    );
    assert.deepEqual(result.eci, [
      {assignment: 26, label: 'UTF-8', segmentIndex: 1, bitOffset: 46, bitLength: 12},
    ]);
    assert.equal(result.segments[1]!.bitOffset, 58);
    assert.equal(result.capacity.headerBits, 4 + 9 + 12 + 4 + 8);
  });

  test('reports custom segments without calling the segmenter again', () => {
    let calls = 0;
    const segmenter: QRCodeSegmenter = (payload) => {
      calls++;
      return [
        {mode: 'numeric', payload: String(payload).slice(0, 3)},
        {mode: 'numeric', payload: String(payload).slice(3)},
      ];
    };
    const {matrix, traceRequest} = explainQRCode({payload: '123456', segmenter});
    const callsBeforeTrace = calls;
    const result = analyzeQRCodeEncoding(matrix, traceRequest);
    assert.equal(calls, callsBeforeTrace);
    assert.equal(result.segmentation, 'custom');
    assert.deepEqual(
      result.segments.map(({mode, text}) => [mode, text]),
      [
        ['numeric', '123'],
        ['numeric', '456'],
      ],
    );
    assert.equal('segmenter' in traceRequest, false);
    assert.equal('kanji' in traceRequest && typeof traceRequest.kanji, 'boolean');
  });

  test('accounts for exact capacity, truncated terminators, and pad codewords', () => {
    // 41 digits fill 151 of the 152 data bits of 1-L, leaving 1 bit of the 4-bit terminator.
    const full = trace({payload: '1'.repeat(41), errorCorrectionLevel: 'L'});
    assert.equal(full.symbol.version, 1);
    assert.equal(full.capacity.remainingBits, 1);
    assert.deepEqual(full.padding.terminator, {bitOffset: 151, bitLength: 1, fullBitLength: 4});
    assert.deepEqual(full.padding.alignment, {bitOffset: 152, bitLength: 0});
    assert.deepEqual(full.padding.padCodewords, {start: 19, end: 19});

    const exact = trace({payload: '1'.repeat(34)});
    assert.equal(exact.capacity.remainingBits, 0);
    assert.equal(exact.padding.terminator.bitLength, 0);

    const short = trace({payload: 'A'});
    assert.deepEqual(short.padding.terminator, {bitOffset: 19, bitLength: 4, fullBitLength: 4});
    assert.deepEqual(short.padding.alignment, {bitOffset: 23, bitLength: 1});
    const {start, end} = short.padding.padCodewords;
    assert.deepEqual([start, end], [3, 16]);
    const data = short.blocks[0]!.dataCodewords;
    assert.equal(hex(data.slice(start, end)), 'ec 11 ec 11 ec 11 ec 11 ec 11 ec 11 ec');
  });

  test('explains why automatic selection rejected the next smaller version', () => {
    const result = trace({payload: '1'.repeat(35)});
    assert.equal(result.symbol.version, 2);
    assert.equal(result.symbol.versionSelection, 'automatic');
    assert.deepEqual(result.capacity.smallerVersion, {
      version: 1,
      fits: false,
      dataBits: 128,
      requiredBits: 4 + 10 + 117,
    });
    const forced = trace({payload: '1'.repeat(35), version: 9});
    assert.equal(forced.symbol.versionSelection, 'requested');
    assert.equal(forced.capacity.smallerVersion, undefined);
  });

  test('matches the size-boundary example on the How QR codes work page', () => {
    const example = (options: QRCodeExplainOptions) => {
      const {symbol, capacity} = trace(options);
      return [symbol.version, capacity.usedBits, capacity.dataBits];
    };
    assert.deepEqual(example({payload: '1'.repeat(34)}), [1, 128, 128]);
    assert.deepEqual(example({payload: '1'.repeat(35)}), [2, 131, 224]);
    assert.deepEqual(example({payload: 'https://qrcodesdk.dev'}), [2, 180, 224]);
    assert.deepEqual(example({payload: 'https://qrcodesdk.dev', eci: true}), [2, 192, 224]);
  });

  test('widens character count indicators at versions 10 and 27', () => {
    const countBits = (version: QRCodeVersion) =>
      trace({payload: 'abc', version, mask: 0}).segments[0]!.countBits;
    assert.deepEqual([countBits(9), countBits(10), countBits(26), countBits(27)], [8, 16, 16, 16]);
    const numericBits = (version: QRCodeVersion) =>
      trace({payload: '123', version, mask: 0}).segments[0]!.countBits;
    assert.deepEqual(
      [numericBits(9), numericBits(10), numericBits(26), numericBits(27)],
      [10, 12, 12, 14],
    );
  });

  test('scores every mask exactly as the encoder evaluator does', () => {
    for (let mask = 0; mask < 8; mask++) {
      const forced = trace({payload: 'MASKS', version: 2, mask: mask as QRCodeMask});
      assert.equal(forced.masks.selected, mask);
      assert.equal(forced.masks.selection, 'requested');
    }
    const result = trace({payload: 'MASKS', version: 2});
    assert.equal(result.masks.selection, 'automatic');
    assert.equal(result.masks.winner, 'lower');
    for (const candidate of result.masks.candidates) {
      const {size, modules} = qrcode('MASKS').version(2).mask(candidate.mask).matrix();
      assert.equal(candidate.score, evaluateMatrix(Uint8Array.from(modules), size));
    }
    const best = Math.min(...result.masks.candidates.map(({score}) => score));
    assert.equal(result.masks.candidates[result.masks.selected]!.score, best);
  });

  test('keeps the lower mask when penalty scores tie', () => {
    const result = trace({payload: '66', version: 1});
    const scores = result.masks.candidates.map(({score}) => score);
    assert.equal(scores[3], scores[4]);
    assert.equal(Math.min(...scores), scores[3]);
    assert.equal(result.masks.selected, 3);
  });

  test('rejects a request that does not match the matrix', () => {
    const {matrix, traceRequest} = explainQRCode({payload: 'STALE'});
    assert.throws(
      () => analyzeQRCodeEncoding(matrix, {...traceRequest, payload: 'STALER'}),
      /do not cover the payload|do not match the payload/,
    );
    assert.throws(
      () => analyzeQRCodeEncoding(matrix, {...traceRequest, version: 5}),
      /requested version/,
    );
    assert.throws(
      () => analyzeQRCodeEncoding(matrix, {...traceRequest, symbol: 'micro'} as QRCodeTraceRequest),
      /Micro QR code was requested/,
    );
  });
});

describe('analyzeQRCodeEncoding for Micro QR codes', () => {
  const micro = (options: Omit<QRCodeExplainOptions, 'micro'>) => trace({...options, micro: true});

  test('reproduces the ISO/IEC 18004 Micro QR example', () => {
    const result = micro({payload: '01234567', microVersion: 'M2', errorCorrectionLevel: 'L'});
    assert.equal(result.family, 'micro');
    assert.equal(hex(result.blocks[0]!.dataCodewords), '40 18 ac c3 00');
    assert.equal(hex(result.blocks[0]!.errorCorrectionCodewords), '86 0d 22 ae 30');
    assert.deepEqual([result.segments[0]!.modeBits, result.segments[0]!.countBits], [1, 4]);
    assert.deepEqual(result.padding.terminator, {bitOffset: 32, bitLength: 5, fullBitLength: 5});
  });

  test('traces every version, supported level, and mode', () => {
    const cases: [QRCodeMicroVersion, QRCodeErrorCorrectionLevel, string][] = [
      ['M1', 'L', '12345'],
      ['M2', 'L', 'AB12'],
      ['M2', 'M', '123'],
      ['M3', 'L', 'abc'],
      ['M3', 'M', '東京'],
      ['M4', 'L', 'MICRO QR'],
      ['M4', 'M', 'micro'],
      ['M4', 'Q', '漢字'],
    ];
    for (const [microVersion, errorCorrectionLevel, payload] of cases) {
      for (let mask = 0; mask < 4; mask++) {
        const options = {
          payload,
          microVersion,
          errorCorrectionLevel,
          microMask: mask as QRCodeMicroMask,
          kanji,
        };
        const result = micro(options);
        assert.equal(result.family, 'micro');
        assert.equal(result.symbol.version, microVersion);
        assert.equal(result.symbol.mask, mask);
        assert.equal(
          result.symbol.errorCorrectionLevel,
          microVersion === 'M1' ? undefined : errorCorrectionLevel,
        );
        assert.equal(result.segments[0]!.text, payload);
        assert.equal(result.blocks.length, 1);
        const matrix = qrcode(payload)
          .options({
            symbol: microQR({version: microVersion, mask: mask as QRCodeMicroMask}),
            errorCorrectionLevel,
            kanji,
          })
          .matrix();
        assert.deepEqual(reconstruct(result), matrix.modules);
      }
    }
  });

  test('places only the high nibble of the final 4-bit data codeword in M1 and M3', () => {
    const m1 = micro({payload: '1', microVersion: 'M1'});
    assert.equal(m1.symbol.errorCorrectionLevel, undefined);
    assert.equal(m1.capacity.dataBits, 20);
    assert.deepEqual(m1.padding.finalPartialCodeword, {
      codewordIndex: 2,
      dataBits: 4,
      omittedBits: 4,
      content: 'pad',
    });
    assert.deepEqual(
      m1.interleaving.map(({placedBits}) => placedBits),
      [8, 8, 4, 8, 8],
    );
    // The full M1 payload reaches the 4-bit codeword with data.
    const full = micro({payload: '12345', microVersion: 'M1'});
    assert.equal(full.capacity.remainingBits, 0);
    assert.equal(full.padding.finalPartialCodeword?.content, 'data');
    assert.equal(full.padding.terminator.bitLength, 0);

    const m3 = micro({payload: '1', microVersion: 'M3', errorCorrectionLevel: 'M'});
    assert.equal(m3.capacity.dataBits, 68);
    assert.equal(m3.padding.finalPartialCodeword?.codewordIndex, 8);
    assert.equal(m3.blocks[0]!.dataCodewords[8]! & 0x0f, 0);
  });

  test('scores the four masks by their edges, where the higher score wins', () => {
    const result = micro({payload: 'EDGES'});
    assert.equal(result.family, 'micro');
    if (result.family !== 'micro') return;
    assert.equal(result.masks.winner, 'higher');
    assert.equal(result.masks.candidates.length, 4);
    for (const candidate of result.masks.candidates) {
      const low = Math.min(candidate.rightEdge, candidate.bottomEdge);
      const high = Math.max(candidate.rightEdge, candidate.bottomEdge);
      assert.equal(candidate.score, low * 16 + high);
    }
    const best = Math.max(...result.masks.candidates.map(({score}) => score));
    assert.equal(result.masks.candidates[result.masks.selected]!.score, best);

    const forced = micro({payload: 'EDGES', microMask: 3});
    assert.equal(forced.masks.selected, 3);
    assert.equal(forced.masks.selection, 'requested');
  });

  test('keeps the lower Micro QR mask when edge scores tie', () => {
    const result = micro({payload: 'T3'});
    assert.deepEqual(
      result.masks.candidates.map(({score}) => score),
      [86, 56, 86, 86],
    );
    assert.equal(result.masks.selected, 0);
  });

  test('explains why a smaller Micro QR version was rejected', () => {
    assert.deepEqual(micro({payload: 'ABCDEF'}).capacity.smallerVersion, {
      version: 'M2',
      fits: false,
      dataBits: 32,
      requiredBits: 37,
    });
    assert.deepEqual(
      micro({payload: '東京タワー', kanji, errorCorrectionLevel: 'L'}).capacity.smallerVersion,
      {
        version: 'M2',
        fits: false,
        unsupported: 'mode',
      },
    );
    assert.deepEqual(micro({payload: 'abc', errorCorrectionLevel: 'Q'}).capacity.smallerVersion, {
      version: 'M3',
      fits: false,
      unsupported: 'level',
    });
  });

  test('traces the standard QR code of a fallback as automatically selected', () => {
    const result = micro({
      payload: 'https://qrcodesdk.dev',
      microFallback: true,
      microVersion: 'M4',
      microMask: 1,
    });
    assert.equal(result.family, 'standard');
    if (result.family !== 'standard') return;
    assert.equal(result.symbol.microFallback, true);
    assert.equal(result.symbol.versionSelection, 'automatic');
    assert.equal(result.masks.selection, 'automatic');
    assert.equal(result.segmentation, 'single');
  });
});
