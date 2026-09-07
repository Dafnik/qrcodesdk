import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import type {QRCodeDataImageURL} from '@qrcodesdk/core';

import {generatePlaygroundCode} from './angular/playground-code-generator.ts';
import {
  type PlaygroundOptions,
  type PlaygroundPreparedImage,
  defaultPlaygroundOptions,
} from './playground-options.ts';

const preparedImage: PlaygroundPreparedImage = {
  dataUrl: 'data:image/png;base64,cHJlcGFyZWQ=' as QRCodeDataImageURL,
  element: {width: 4, height: 2} as HTMLImageElement,
  fileName: 'logo.png',
  size: 0.4,
  padding: 1,
  clearBackground: true,
};

function createOptions(
  packageName: PlaygroundOptions['packageName'],
  output: PlaygroundOptions['output'],
): PlaygroundOptions {
  return {
    ...defaultPlaygroundOptions,
    packageName,
    output,
    errorCorrectionLevel: 'H',
  };
}

describe('generated playground image snippets', () => {
  for (const packageName of ['react', 'vue', 'svelte', 'angular'] as const) {
    test(`${packageName} SVG reads and decodes the file before conditional rendering`, () => {
      const {code} = generatePlaygroundCode(createOptions(packageName, 'svg'), preparedImage);

      assert.match(code, /new FileReader\(\)/);
      assert.match(code, /await image\.decode\(\)/);
      assert.match(code, /source: (?:imageSource|source)/);
      const conditionalRender = {
        angular: /@if \(options\(\)/,
        react: /if \(!imageSource\)/,
        svelte: /{#if options}/,
        vue: /v-if="options"/,
      }[packageName];
      assert.match(code, conditionalRender);
    });

    for (const output of ['image', 'canvas'] as const) {
      test(`${packageName} ${output} passes a decoded image element after preparation`, () => {
        const {code} = generatePlaygroundCode(createOptions(packageName, output), preparedImage);

        assert.match(code, /new FileReader\(\)/);
        assert.match(code, /const image = new Image\(\)/);
        assert.match(code, /await image\.decode\(\)/);
        assert.match(code, /source: (?:imageSource|source)/);
      });
    }
  }
});

describe('generated playground ECI options', () => {
  for (const packageName of ['react', 'vue', 'svelte', 'angular'] as const) {
    test(`${packageName} includes ECI only when enabled`, () => {
      const disabled = generatePlaygroundCode(createOptions(packageName, 'svg')).code;
      const enabled = generatePlaygroundCode({
        ...createOptions(packageName, 'svg'),
        eci: true,
      }).code;

      assert.doesNotMatch(disabled, /eci:/);
      assert.match(enabled, /eci: true/);
    });
  }
});

describe('generated playground languages', () => {
  test('generates an idiomatic Vue single-file component', () => {
    const preview = generatePlaygroundCode(createOptions('vue', 'image'));

    assert.equal(preview.lang, 'vue');
    assert.match(preview.code, /<script setup lang="ts">/);
    assert.match(preview.code, /from '@qrcodesdk\/vue'/);
    assert.match(preview.code, /ref="qrcode"/);
    assert.match(preview.code, /:payload="payload"/);
    assert.match(preview.code, /:options="options"/);
    assert.doesNotMatch(preview.code, /:data(?:\s|\/|>)/);
    assert.doesNotMatch(preview.code, /:options(?:\s|\/|>)/);
  });

  test('generates an idiomatic Svelte component', () => {
    const preview = generatePlaygroundCode(createOptions('svelte', 'image'));

    assert.equal(preview.lang, 'svelte');
    assert.match(preview.code, /<script lang="ts">/);
    assert.match(preview.code, /from '@qrcodesdk\/svelte'/);
    assert.match(preview.code, /bind:this={qrcode}/);
  });
});
