import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {describe, test} from 'vitest';

import {type QRCodeMask, type QRCodeSegmenter, type QRCodeVersion, qrcode} from '@qrcodesdk/core';
import {kanji} from '@qrcodesdk/core/kanji';
import {QR_CODE_MODULE_ROLES} from '@qrcodesdk/core/matrix';
import {type QRCodeMicroVersion, microQR} from '@qrcodesdk/core/micro';

import {QR_CODE_EXPLAIN_ROLE_ORDER, explainQRCode} from './qrcode-analyzer.ts';

describe('explainQRCode', () => {
  test('classifies every matrix module using QR placement rules', () => {
    const explanation = explainQRCode({
      payload: 'EXPLAIN',
      version: 5,
      errorCorrectionLevel: 'H',
      mask: 3,
      moduleSize: 8,
      quietZone: 4,
    });
    const {width: size, modules} = explanation.matrix;
    assert.equal(explanation.modules.length, size ** 2);
    assert.equal(explanation.moduleGrid.length, size);
    assert.ok(explanation.modules.some(({role}) => role === 'functional'));
    assert.ok(explanation.modules.some(({role}) => role === 'encoded'));
    for (const module of explanation.modules) {
      assert.ok(QR_CODE_EXPLAIN_ROLE_ORDER.includes(module.role));
      assert.equal(module.value, modules[module.row * size + module.column]);
    }
  });

  test('reserves finder and alignment patterns from the module roles', () => {
    const capacities = [
      [1, 26, 0],
      [2, 44, 7],
      [7, 196, 0],
      [14, 581, 3],
    ] as const;
    for (const [version, codewords, remainderBits] of capacities) {
      const explanation = explainQRCode({payload: 'ROLES', version, mask: 0});
      const count = (role: string) =>
        explanation.modules.filter((module) => module.role === role).length;
      assert.equal(count('encoded'), codewords * 8);
      assert.equal(count('remainder'), remainderBits);
      const {width: size, roles} = explanation.matrix;
      for (const module of explanation.modules) {
        const isData = roles[module.row * size + module.column] === QR_CODE_MODULE_ROLES.data;
        assert.equal(module.role === 'functional', !isData);
      }
    }
  });

  test('reports public matrix and style options', () => {
    const explanation = explainQRCode({
      payload: '12345',
      version: 1,
      mask: 0,
      moduleSize: 8,
      quietZone: 4,
    });
    assert.equal(explanation.mode, 'numeric');
    assert.equal(explanation.version, 1);
    assert.equal(explanation.errorCorrectionLevel, 'M');
    assert.equal(explanation.mask, 0);
    assert.equal(explanation.moduleSize, 8);
    assert.equal(explanation.quietZone, 4);
    assert.equal(explanation.viewSize, explanation.matrix.width + 8);
  });

  test('maps encoded bits to zig-zag coordinates and stable unmasked values', () => {
    const first = explainQRCode({payload: 'MASK CHECK', version: 3, mask: 0});
    const second = explainQRCode({payload: 'MASK CHECK', version: 3, mask: 1});
    const encodedFirst = first.modules.filter(({role}) => role === 'encoded').sort(byPlacement);
    const encodedSecond = second.modules.filter(({role}) => role === 'encoded').sort(byPlacement);
    assert.deepEqual(
      encodedFirst.slice(0, 4).map(({row, column}) => ({row, column})),
      [
        {row: 28, column: 28},
        {row: 28, column: 27},
        {row: 27, column: 28},
        {row: 27, column: 27},
      ],
    );
    assert.deepEqual(
      encodedFirst.map(({sourceValue}) => sourceValue),
      encodedSecond.map(({sourceValue}) => sourceValue),
    );
  });

  test('resolves every forced mask and the automatic mask through the public builder', () => {
    for (let mask = 0; mask < 8; mask++) {
      const typedMask = mask as QRCodeMask;
      const explanation = explainQRCode({payload: 'MASK CHECK', mask: typedMask});
      assert.equal(explanation.mask, typedMask);
      assert.deepEqual(explanation.matrix, qrcode('MASK CHECK').mask(typedMask).matrix());
    }
    const automatic = explainQRCode({payload: 'AUTOMATIC MASK'});
    assert.deepEqual(
      automatic.matrix,
      qrcode('AUTOMATIC MASK')
        .version(automatic.version as QRCodeVersion)
        .mask(automatic.mask)
        .matrix(),
    );
  });

  test('reports Kanji mode when the Kanji table is supplied', () => {
    assert.equal(explainQRCode({payload: '漢字テスト'}).mode, 'octet');
    assert.equal(explainQRCode({payload: '漢字テスト', kanji}).mode, 'kanji');
    assert.equal(explainQRCode({payload: '漢字 test', kanji}).mode, 'octet');
    assert.equal(explainQRCode({payload: '漢字123', kanji, optimizeSegments: true}).mode, 'mixed');
    assert.equal(explainQRCode({payload: '漢字テスト', kanji, version: 5, mask: 2}).mode, 'kanji');
    assert.equal(explainQRCode({payload: '漢字 test', kanji, version: 5}).mode, 'octet');
    assert.deepEqual(
      explainQRCode({payload: '漢字テスト', kanji}).matrix,
      qrcode('漢字テスト').mode('kanji').kanji(kanji).matrix(),
    );
  });

  test('reports actual modes for default, optimized, and forced encoding', () => {
    // Moved from the playground segmentation tests, which run without Vitest.
    const payload = 'ABCD12345678901234567890abcd';
    assert.equal(explainQRCode({payload, mode: 'auto'}).mode, 'octet');
    const optimized = explainQRCode({payload, mode: 'auto', optimizeSegments: true});
    assert.equal(optimized.mode, 'mixed');
    assert.equal(optimized.matrix.width, 25);
    assert.equal(explainQRCode({payload, mode: 'octet', optimizeSegments: true}).mode, 'octet');
    assert.equal(explainQRCode({payload: '', mode: 'auto'}).mode, 'numeric');
  });

  test('reads the mode of a single segment from its emitted header', () => {
    assert.equal(explainQRCode({payload: '0123'}).mode, 'numeric');
    assert.equal(explainQRCode({payload: 'ABC 123'}).mode, 'alphanumeric');
    assert.equal(explainQRCode({payload: 'abc'}).mode, 'octet');
    assert.equal(explainQRCode({payload: 'abc', eci: true}).mode, 'octet');
    assert.equal(explainQRCode({payload: 'ABC', eci: true}).mode, 'alphanumeric');
    // Version 40 at level H has 81 blocks, so the header still comes from the first codeword.
    assert.equal(
      explainQRCode({payload: 'abc', eci: true, version: 40, errorCorrectionLevel: 'H'}).mode,
      'octet',
    );
  });

  test('labels custom segmenter output without calling the segmenter again', () => {
    const versions: number[] = [];
    const segmenter: QRCodeSegmenter = (payload, {version}) => {
      versions.push(version);
      return [
        {mode: 'alphanumeric', payload: String(payload).slice(0, 3)},
        {mode: 'numeric', payload: String(payload).slice(3)},
      ];
    };
    const explanation = explainQRCode({payload: 'ABC123', segmenter});
    assert.equal(explanation.mode, 'mixed');
    assert.deepEqual(versions, [1]);
    assert.deepEqual(explanation.matrix, qrcode('ABC123').segmenter(segmenter).matrix());
  });

  test('reads the error correction level and mask from the format information', () => {
    for (const errorCorrectionLevel of ['L', 'M', 'Q', 'H'] as const) {
      const explanation = explainQRCode({payload: 'FORMAT', errorCorrectionLevel, mask: 5});
      assert.equal(explanation.errorCorrectionLevel, errorCorrectionLevel);
      assert.equal(explanation.mask, 5);
      assert.equal(explanation.symbol, 'standard');
    }
  });

  test('explains Micro QR codes with their versions, masks, and placement', () => {
    const counts = {M1: [11, 36], M2: [13, 80], M3: [15, 132], M4: [17, 192]} as const;
    for (const [microVersion, [size, encodedBits]] of Object.entries(counts)) {
      const explanation = explainQRCode({
        payload: '1',
        micro: true,
        microVersion: microVersion as QRCodeMicroVersion,
        microMask: 2,
        errorCorrectionLevel: 'L',
      });
      assert.equal(explanation.symbol, 'micro');
      assert.equal(explanation.version, microVersion);
      assert.equal(explanation.matrix.width, size);
      assert.equal(explanation.mask, 2);
      assert.equal(explanation.mode, 'numeric');
      assert.equal(explanation.modules.filter(({role}) => role === 'encoded').length, encodedBits);
      assert.equal(explanation.modules.filter(({role}) => role === 'remainder').length, 0);
      assert.equal(explanation.errorCorrectionLevel, microVersion === 'M1' ? undefined : 'L');
    }

    const microOptions = {payload: 'MICRO', micro: true} as const;
    const automatic = explainQRCode(microOptions);
    assert.equal(automatic.version, 'M2');
    assert.equal(automatic.mode, 'alphanumeric');
    assert.deepEqual(automatic.matrix, qrcode('MICRO').options({symbol: microQR()}).matrix());
    assert.equal(explainQRCode({...microOptions, payload: 'micro'}).mode, 'octet');
    assert.equal(explainQRCode({...microOptions, payload: '東京', kanji}).mode, 'kanji');
  });

  test('maps Micro QR placement bits past a final 4-bit data codeword', () => {
    // M3-L holds 84 data bits: 10 full data codewords and a 4-bit one, then 6 ECC codewords.
    const explanation = explainQRCode({
      payload: '1',
      micro: true,
      microVersion: 'M3',
      errorCorrectionLevel: 'L',
    });
    const codeword = (placementBitIndex: number) =>
      explanation.modules.find((module) => module.placementBitIndex === placementBitIndex)
        ?.codewordIndex;
    assert.equal(codeword(79), 9);
    assert.equal(codeword(80), 10);
    assert.equal(codeword(83), 10);
    assert.equal(codeword(84), 11);
    assert.equal(codeword(131), 16);
  });

  test('reports a standard QR code when a Micro QR code falls back', () => {
    const payload = 'https://qrcodesdk.dev';
    assert.throws(() => explainQRCode({payload, micro: true}), /Payload too large/);
    const explanation = explainQRCode({payload, micro: true, microFallback: true});
    assert.equal(explanation.symbol, 'standard');
    assert.equal(explanation.microFallback, true);
    assert.equal(explanation.mode, 'octet');
    assert.equal(explanation.version, 2);
  });

  test('validates matrix and styling inputs through public APIs', () => {
    assert.throws(() => explainQRCode({payload: 'ABC', mode: 'numeric'}), /Invalid payload format/);
    assert.throws(() => explainQRCode({payload: '1', moduleSize: 0}), /moduleSize/);
    assert.throws(() => explainQRCode({payload: '1', quietZone: -1}), /quietZone/);
  });
});

test('the Angular explainer exposes modules for pointer inspection', () => {
  const component = readFileSync(new URL('../angular/qrcode-explain.ts', import.meta.url), 'utf8');

  assert.match(component, /qr\.quietZone\b/);
  assert.match(component, /module\.column \+ qr\.quietZone/);
  assert.match(component, /module\.row \+ qr\.quietZone/);
  assert.match(component, /\[attr\.data-group\]="module\.groupId"/);
  assert.match(component, /\[attr\.data-role\]="module\.role"/);
  assert.match(component, /\[attr\.data-row\]="module\.row"/);
  assert.match(component, /\[attr\.data-column\]="module\.column"/);
  assert.match(component, /closest<SVGElement>\('\[data-group\]'\)/);
  assert.match(component, /element\.dataset\['group'\]/);
});

function byPlacement(
  first: {placementBitIndex?: number},
  second: {placementBitIndex?: number},
): number {
  return first.placementBitIndex! - second.placementBitIndex!;
}
