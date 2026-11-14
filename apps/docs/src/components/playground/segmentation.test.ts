import assert from 'node:assert/strict';
import {test} from 'node:test';

import {qrcode} from '@qrcodesdk/core';
import {kanji} from '@qrcodesdk/core/kanji';
import {automaticSegmenter} from '@qrcodesdk/core/segmenter';

import {generatePlaygroundCode} from './angular/playground-code-generator.ts';
import {
  createCliPreview,
  createCliSVGOptions,
  defaultCliOptions,
  generateCliCommand,
} from './cli-playground.ts';
import {readCliOptionsFromSearchParams, writeCliOptionsToSearchParams} from './cli-query.ts';
import {
  loadPlaygroundKanji,
  playgroundKanjiSettled,
  playgroundKanjiTable,
} from './playground-kanji.ts';
import {
  createPlaygroundSVGOptions,
  defaultPlaygroundOptions,
  playgroundOptions,
  updateQrOptions,
} from './playground-options.ts';
import {hasQRCodeError} from './qrcode-error-checker.ts';
import {readQrOptionsFromSearchParams, writeQrOptionsToSearchParams} from './query-sync.ts';

const payload = 'ABCD12345678901234567890abcd';

test('playground shares explicit auto and optimization through URLs and renderers', () => {
  const options = {
    ...defaultPlaygroundOptions,
    payload,
    mode: 'auto' as const,
    optimizeSegments: true,
  };
  const params = writeQrOptionsToSearchParams(
    new URLSearchParams(),
    options,
    defaultPlaygroundOptions,
  );
  const restored = readQrOptionsFromSearchParams(params);
  assert.equal(restored.mode, 'auto');
  assert.equal(restored.optimizeSegments, true);
  const matrixOptions = createPlaygroundSVGOptions(restored).matrix;
  assert.equal(matrixOptions?.segmenter, automaticSegmenter);
  assert.equal(qrcode(payload).options(matrixOptions).matrix().width, 25);
  assert.equal(
    qrcode(payload)
      .options(createPlaygroundSVGOptions({...restored, optimizeSegments: false}).matrix)
      .matrix().width,
    29,
  );
});

test('CLI URL, generated command, and preview agree on optional optimization', () => {
  const options = {...defaultCliOptions, payload, mode: 'auto' as const, optimizeSegments: true};
  const params = new URLSearchParams();
  writeCliOptionsToSearchParams(params, options);
  const restored = readCliOptionsFromSearchParams(params);
  assert.equal(restored.mode, 'auto');
  assert.equal(restored.optimizeSegments, true);
  assert.match(generateCliCommand(restored), /--mode auto --optimize-segments/);
  assert.equal(createCliSVGOptions(restored).matrix?.segmenter, automaticSegmenter);
});

test('all framework examples import the optional optimizer only when selected', () => {
  for (const packageName of ['angular', 'react', 'svelte', 'vue'] as const) {
    const options = {...defaultPlaygroundOptions, packageName, mode: 'auto' as const};
    const plain = generatePlaygroundCode(options).code;
    const optimized = generatePlaygroundCode({...options, optimizeSegments: true}).code;
    assert.match(plain, /mode: 'auto'/);
    assert.doesNotMatch(plain, /automaticSegmenter/);
    assert.match(
      optimized,
      new RegExp(
        `import \\{[^}]*\\bautomaticSegmenter\\b[^}]*\\} from '@qrcodesdk/${packageName}'`,
      ),
    );
    assert.doesNotMatch(optimized, /@qrcodesdk\/core/);
    assert.match(optimized, /segmenter: automaticSegmenter/);
  }
});

test('playground loads the Kanji table before it applies updates that need it', async () => {
  assert.equal(playgroundKanjiTable(), undefined);
  // Without the table, the preview reports an error instead of encoding without Kanji mode.
  assert.match(
    String(hasQRCodeError({...defaultPlaygroundOptions, payload: '東京', kanji: true})),
    /Kanji table is still loading/,
  );
  assert.equal(hasQRCodeError({...defaultPlaygroundOptions, payload: '東京'}), undefined);
  assert.equal(
    createCliPreview({...defaultCliOptions, payload: '東京', kanji: true}).state,
    'error',
  );
  assert.equal(
    createPlaygroundSVGOptions({...defaultPlaygroundOptions, kanji: true}).matrix?.kanji,
    undefined,
  );

  updateQrOptions({kanji: true});
  updateQrOptions({payload: '東京タワー'});
  // Both updates wait for the table and keep their order.
  assert.notEqual(playgroundOptions.get().kanji, true);
  assert.notEqual(playgroundOptions.get().payload, '東京タワー');

  await playgroundKanjiSettled();
  assert.equal(playgroundKanjiTable(), kanji);
  assert.equal(playgroundOptions.get().kanji, true);
  assert.equal(playgroundOptions.get().payload, '東京タワー');
  assert.equal(createPlaygroundSVGOptions(playgroundOptions.get()).matrix?.kanji, kanji);

  // Once the table has loaded, updates apply immediately.
  updateQrOptions({payload: '漢字', kanji: false});
  assert.equal(playgroundOptions.get().payload, '漢字');
  assert.equal(playgroundOptions.get().kanji, false);
});

test('playground shares the Kanji switch through URLs and renderers', async () => {
  await loadPlaygroundKanji();
  const options = {...defaultPlaygroundOptions, payload: '東京タワー', kanji: true};
  const params = writeQrOptionsToSearchParams(
    new URLSearchParams(),
    options,
    defaultPlaygroundOptions,
  );
  assert.equal(params.get('kanji'), 'true');
  const restored = readQrOptionsFromSearchParams(params);
  assert.equal(restored.kanji, true);
  const matrixOptions = createPlaygroundSVGOptions(restored).matrix;
  assert.equal(matrixOptions?.kanji, kanji);
  assert.equal(qrcode('東京タワー').options(matrixOptions).matrix().width, 21);
  assert.equal(
    qrcode('東京タワー')
      .options(createPlaygroundSVGOptions({...restored, kanji: false}).matrix)
      .matrix().width,
    25,
  );
});

test('playground forced Kanji mode uses the Kanji table', async () => {
  await loadPlaygroundKanji();
  const params = new URLSearchParams({mode: 'kanji'});
  const restored = readQrOptionsFromSearchParams(params);
  assert.equal(restored.mode, 'kanji');
  const matrixOptions = createPlaygroundSVGOptions({...restored, payload: '漢字'}).matrix;
  assert.equal(matrixOptions?.kanji, kanji);
  assert.equal(qrcode('漢字').options(matrixOptions).matrix().width, 21);
});

test('all framework examples import the Kanji table only when it is used', () => {
  for (const packageName of ['angular', 'react', 'svelte', 'vue'] as const) {
    const options = {...defaultPlaygroundOptions, packageName};
    assert.doesNotMatch(generatePlaygroundCode(options).code, /\bkanji\b/);
    for (const code of [
      generatePlaygroundCode({...options, kanji: true}).code,
      generatePlaygroundCode({...options, mode: 'kanji'}).code,
    ]) {
      assert.match(
        code,
        new RegExp(`import \\{[^}]*\\bkanji\\b[^}]*\\} from '@qrcodesdk/${packageName}'`),
      );
      assert.match(code, /matrix: \{[^}]*\bkanji\b/);
      assert.doesNotMatch(code, /@qrcodesdk\/core/);
    }
  }
});

test('CLI URL, generated command, and preview agree on Kanji mode', async () => {
  await loadPlaygroundKanji();
  const options = {...defaultCliOptions, payload: '東京タワー123', kanji: true};
  const params = new URLSearchParams();
  writeCliOptionsToSearchParams(params, options);
  const restored = readCliOptionsFromSearchParams(params);
  assert.equal(restored.kanji, true);
  assert.match(generateCliCommand(restored), / --kanji\b/);
  assert.equal(createCliSVGOptions(restored).matrix?.kanji, kanji);

  const forced = {...defaultCliOptions, payload: '漢字', mode: 'kanji' as const, kanji: true};
  assert.match(generateCliCommand(forced), /--mode kanji/);
  assert.doesNotMatch(generateCliCommand(forced), / --kanji\b/);
  assert.equal(createCliSVGOptions(forced).matrix?.kanji, kanji);
  assert.equal(createCliSVGOptions(defaultCliOptions).matrix?.kanji, undefined);
});
