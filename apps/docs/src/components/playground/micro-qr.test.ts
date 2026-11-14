import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

import {generatePlaygroundCode} from './angular/playground-code-generator.ts';
import {loadPlaygroundKanji} from './playground-kanji.ts';
import {
  type PlaygroundOptions,
  createPlaygroundSVGOptions,
  defaultPlaygroundOptions,
  isUnreliableMicroFinderRing,
  playgroundSymbolPatch,
} from './playground-options.ts';
import {hasQRCodeError} from './qrcode-error-checker.ts';
import {readQrOptionsFromSearchParams, writeQrOptionsToSearchParams} from './query-sync.ts';

const microOptions: PlaygroundOptions = {
  ...defaultPlaygroundOptions,
  payload: '12345',
  micro: true,
  quietZone: 2,
};

function renderMatrixSize(options: PlaygroundOptions): number {
  const {matrix} = createPlaygroundSVGOptions(options, undefined);
  return qrcode(options.payload).options(matrix).matrix().width;
}

describe('playground Micro QR options', () => {
  test('generates a Micro QR code and ignores the standard-only options', () => {
    const options: PlaygroundOptions = {
      ...microOptions,
      version: 10,
      mask: 3,
      eci: true,
      optimizeSegments: true,
    };

    assert.equal(renderMatrixSize(options), 13);
    assert.equal(renderMatrixSize({...options, microVersion: 'M4'}), 17);
    assert.equal(renderMatrixSize({...options, micro: false}), 57);
    assert.equal(hasQRCodeError(options, undefined), undefined);
  });

  test('applies the Micro QR version, mask, and fallback', () => {
    const svg = (options: PlaygroundOptions) => {
      const {matrix, ...rendererOptions} = createPlaygroundSVGOptions(options, undefined);
      return qrcode(options.payload).options(matrix).render(QRCodeSVGRenderer(rendererOptions));
    };

    assert.notEqual(svg({...microOptions, microMask: 0}), svg({...microOptions, microMask: 1}));

    const url = {...microOptions, payload: 'https://qrcodesdk.dev'};
    assert.ok(hasQRCodeError(url, undefined));
    assert.equal(hasQRCodeError({...url, microFallback: true}, undefined), undefined);
    assert.equal(renderMatrixSize({...url, microFallback: true}), 25);
  });

  test('passes the Kanji table, so Japanese text fits a smaller Micro QR code', async () => {
    await loadPlaygroundKanji();
    const options: PlaygroundOptions = {
      ...microOptions,
      payload: '東京タワー',
      errorCorrectionLevel: 'L',
    };

    // Five Kanji characters fit M3, while their 15 UTF-8 bytes need M4.
    assert.equal(renderMatrixSize({...options, kanji: true}), 15);
    assert.equal(renderMatrixSize({...options, mode: 'kanji'}), 15);
    assert.equal(renderMatrixSize(options), 17);
  });

  test('moves a default quiet zone to the default of the selected symbol', () => {
    assert.deepEqual(playgroundSymbolPatch({quietZone: 4}, true), {micro: true, quietZone: 2});
    assert.deepEqual(playgroundSymbolPatch({quietZone: 2}, false), {micro: false, quietZone: 4});
    assert.deepEqual(playgroundSymbolPatch({quietZone: 6}, true), {micro: true});
    assert.deepEqual(playgroundSymbolPatch({quietZone: undefined}, false), {micro: false});
  });

  test('flags the finder rings that ZXing cannot locate in Micro QR codes', () => {
    for (const shape of ['rounded', 'extra-rounded', 'diagonal-rounded', 'circle'] as const) {
      assert.equal(isUnreliableMicroFinderRing(shape), true, shape);
    }
    for (const shape of [undefined, 'square', 'diagonal'] as const) {
      assert.equal(isUnreliableMicroFinderRing(shape), false, shape);
    }
  });
});

describe('playground Micro QR query synchronization', () => {
  test('round-trips the Micro QR options and omits their defaults', () => {
    const options: PlaygroundOptions = {
      ...microOptions,
      microVersion: 'M3',
      microMask: 2,
      microFallback: true,
    };
    const params = writeQrOptionsToSearchParams(
      new URLSearchParams(),
      options,
      defaultPlaygroundOptions,
    );

    assert.equal(params.get('micro'), 'true');
    assert.equal(params.get('micro-version'), 'M3');
    assert.equal(params.get('micro-mask'), '2');
    assert.equal(params.get('micro-fallback'), 'true');

    const read = readQrOptionsFromSearchParams(params);
    assert.equal(read.micro, true);
    assert.equal(read.microVersion, 'M3');
    assert.equal(read.microMask, 2);
    assert.equal(read.microFallback, true);

    const defaults = writeQrOptionsToSearchParams(
      new URLSearchParams(),
      defaultPlaygroundOptions,
      defaultPlaygroundOptions,
    );
    for (const key of ['micro', 'micro-version', 'micro-mask', 'micro-fallback']) {
      assert.equal(defaults.has(key), false, key);
    }
  });

  test('ignores invalid Micro QR values', () => {
    const read = readQrOptionsFromSearchParams(
      new URLSearchParams('micro=yes&micro-version=M5&micro-mask=4&micro-fallback=1'),
    );

    assert.equal(read.micro, false);
    assert.equal(read.microVersion, undefined);
    assert.equal(read.microMask, undefined);
    assert.equal(read.microFallback, false);
  });
});

describe('playground Micro QR code generation', () => {
  test('imports microQR and passes it as the symbol without standard-only options', () => {
    const options: PlaygroundOptions = {
      ...microOptions,
      version: 10,
      mask: 3,
      eci: true,
      optimizeSegments: true,
      errorCorrectionLevel: 'L',
    };

    for (const packageName of ['react', 'vue', 'svelte', 'angular'] as const) {
      const {code} = generatePlaygroundCode({...options, packageName});
      assert.match(
        code,
        new RegExp(`import \\{[^}]*\\bmicroQR\\b[^}]*\\} from '@qrcodesdk/${packageName}';`),
      );
      assert.match(code, /symbol: microQR\(\),/);
      assert.match(code, /errorCorrectionLevel: 'L',/);
      assert.doesNotMatch(code, /automaticSegmenter|version: 10|mask: 3|eci: true/);
    }
  });

  test('passes the Kanji table to microQR matrix options', () => {
    for (const packageName of ['react', 'vue', 'svelte', 'angular'] as const) {
      const {code} = generatePlaygroundCode({...microOptions, kanji: true, packageName});
      assert.match(
        code,
        new RegExp(`import \\{[^}]*\\bkanji\\b[^}]*\\} from '@qrcodesdk/${packageName}';`),
      );
      assert.match(code, /symbol: microQR\(\),\n\s+kanji,/);
    }
  });

  test('writes the Micro QR version, mask, and fallback', () => {
    const {code} = generatePlaygroundCode({
      ...microOptions,
      packageName: 'react',
      microVersion: 'M2',
      microMask: 1,
      microFallback: true,
    });

    assert.match(
      code,
      / {6}symbol: microQR\(\{\n {8}version: 'M2',\n {8}mask: 1,\n {8}fallback: true,\n {6}\}\),/,
    );
  });
});
