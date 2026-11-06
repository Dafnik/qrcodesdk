import assert from 'node:assert/strict';
import {test} from 'node:test';

import {qrcode} from '@qrcodesdk/core';
import {automaticSegmenter} from '@qrcodesdk/core/segmenter';

import {explainQRCode} from '../explain/qrcode-analyzer.ts';
import {generatePlaygroundCode} from './angular/playground-code-generator.ts';
import {createCliSVGOptions, defaultCliOptions, generateCliCommand} from './cli-playground.ts';
import {readCliOptionsFromSearchParams, writeCliOptionsToSearchParams} from './cli-query.ts';
import {createPlaygroundSVGOptions, defaultPlaygroundOptions} from './playground-options.ts';
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
  assert.equal(qrcode(payload).options(matrixOptions).matrix().size, 25);
  assert.equal(
    qrcode(payload)
      .options(createPlaygroundSVGOptions({...restored, optimizeSegments: false}).matrix)
      .matrix().size,
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

test('the explainer reports actual modes for default, optimized, and forced encoding', () => {
  assert.equal(explainQRCode({payload, mode: 'auto'}).mode, 'octet');
  const optimized = explainQRCode({payload, mode: 'auto', optimizeSegments: true});
  assert.equal(optimized.mode, 'mixed');
  assert.equal(optimized.matrix.size, 25);
  assert.equal(explainQRCode({payload, mode: 'octet', optimizeSegments: true}).mode, 'octet');
  assert.equal(explainQRCode({payload: '', mode: 'auto'}).mode, 'numeric');
});
