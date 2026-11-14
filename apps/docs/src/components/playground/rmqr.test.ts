import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {qrcode} from '@qrcodesdk/core';

import {generatePlaygroundCode} from './angular/playground-code-generator.ts';
import {
  type PlaygroundOptions,
  createPlaygroundSVGOptions,
  defaultPlaygroundOptions,
  playgroundSymbol,
  playgroundSymbolPatch,
  unreliableRMQRPatterns,
} from './playground-options.ts';
import {hasQRCodeError} from './qrcode-error-checker.ts';
import {readQrOptionsFromSearchParams, writeQrOptionsToSearchParams} from './query-sync.ts';

const rmqrOptions: PlaygroundOptions = {
  ...defaultPlaygroundOptions,
  payload: '12345',
  rmqr: true,
  quietZone: 2,
};

function renderMatrix(options: PlaygroundOptions): [width: number, height: number] {
  const {matrix} = createPlaygroundSVGOptions(options, undefined);
  const {width, height} = qrcode(options.payload).options(matrix).matrix();
  return [width, height];
}

describe('playground rMQR options', () => {
  test('generates an rMQR code and ignores the other symbols’ options', () => {
    const options: PlaygroundOptions = {
      ...rmqrOptions,
      micro: true,
      microVersion: 'M4',
      version: 10,
      mask: 3,
      eci: true,
      optimizeSegments: true,
    };

    assert.equal(playgroundSymbol(options), 'rmqr');
    assert.deepEqual(renderMatrix(options), [27, 11]);
    assert.deepEqual(renderMatrix({...options, rmqrVersion: 'R7'}), [43, 7]);
    assert.deepEqual(renderMatrix({...options, rmqrVersion: 'R17x139'}), [139, 17]);
    assert.deepEqual(renderMatrix({...options, rmqr: false}), [17, 17]);
    assert.equal(hasQRCodeError(options, undefined), undefined);
  });

  test('reports the error-correction levels that rMQR codes do not support', () => {
    assert.ok(hasQRCodeError({...rmqrOptions, errorCorrectionLevel: 'L'}, undefined));
    assert.equal(hasQRCodeError({...rmqrOptions, errorCorrectionLevel: 'H'}, undefined), undefined);
  });

  test('moves the quiet zone and error-correction level to values rMQR codes support', () => {
    assert.deepEqual(playgroundSymbolPatch({quietZone: 4}, 'rmqr'), {
      micro: false,
      rmqr: true,
      quietZone: 2,
    });
    assert.deepEqual(playgroundSymbolPatch({quietZone: 2, micro: true}, 'rmqr'), {
      micro: false,
      rmqr: true,
    });
    assert.deepEqual(playgroundSymbolPatch({quietZone: 2, rmqr: true}, 'standard'), {
      micro: false,
      rmqr: false,
      quietZone: 4,
    });
    assert.deepEqual(playgroundSymbolPatch({errorCorrectionLevel: 'L'}, 'rmqr'), {
      micro: false,
      rmqr: true,
      errorCorrectionLevel: undefined,
    });
    assert.deepEqual(playgroundSymbolPatch({errorCorrectionLevel: 'Q'}, 'rmqr'), {
      micro: false,
      rmqr: true,
      errorCorrectionLevel: 'H',
    });
  });

  test('flags the patterns that ZXing cannot locate in rMQR codes', () => {
    assert.deepEqual(unreliableRMQRPatterns({}), []);
    assert.deepEqual(
      unreliableRMQRPatterns({finderRingShape: 'square', alignmentCenterShape: 'square'}),
      [],
    );
    assert.deepEqual(
      unreliableRMQRPatterns({finderRingShape: 'diagonal', alignmentCenterShape: 'circle'}),
      ['finder ring', 'alignment center'],
    );
  });
});

describe('playground rMQR query synchronization', () => {
  test('round-trips the rMQR options and omits their defaults', () => {
    for (const rmqrVersion of ['R13', 'R7x139'] as const) {
      const params = writeQrOptionsToSearchParams(
        new URLSearchParams(),
        {...rmqrOptions, rmqrVersion},
        defaultPlaygroundOptions,
      );

      assert.equal(params.get('rmqr'), 'true');
      assert.equal(params.get('rmqr-version'), rmqrVersion);

      const read = readQrOptionsFromSearchParams(params);
      assert.equal(read.rmqr, true);
      assert.equal(read.rmqrVersion, rmqrVersion);
    }

    const defaults = writeQrOptionsToSearchParams(
      new URLSearchParams(),
      defaultPlaygroundOptions,
      defaultPlaygroundOptions,
    );
    for (const key of ['rmqr', 'rmqr-version']) {
      assert.equal(defaults.has(key), false, key);
    }
  });

  test('ignores invalid rMQR values', () => {
    const read = readQrOptionsFromSearchParams(new URLSearchParams('rmqr=yes&rmqr-version=R7x27'));

    assert.equal(read.rmqr, false);
    assert.equal(read.rmqrVersion, undefined);
  });
});

describe('playground rMQR code generation', () => {
  test('imports rMQR and passes it as the symbol without standard-only options', () => {
    const options: PlaygroundOptions = {
      ...rmqrOptions,
      version: 10,
      mask: 3,
      eci: true,
      optimizeSegments: true,
      errorCorrectionLevel: 'H',
    };

    for (const packageName of ['react', 'vue', 'svelte', 'angular'] as const) {
      const {code} = generatePlaygroundCode({...options, packageName});
      assert.match(
        code,
        new RegExp(`import \\{[^}]*\\brMQR\\b[^}]*\\} from '@qrcodesdk/${packageName}';`),
      );
      assert.match(code, /symbol: rMQR\(\),/);
      assert.match(code, /errorCorrectionLevel: 'H',/);
      assert.doesNotMatch(code, /microQR|automaticSegmenter|version: 10|mask: 3|eci: true/);
    }
  });

  test('writes the rMQR version', () => {
    const {code} = generatePlaygroundCode({
      ...rmqrOptions,
      packageName: 'react',
      rmqrVersion: 'R9',
    });

    assert.match(code, /symbol: rMQR\(\{\n\s+version: 'R9',\n\s+\}\),/);
  });
});
