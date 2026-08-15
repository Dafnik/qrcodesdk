import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import type {QRCodeDataImageURL} from '@qrcodesdk/core';

import {generatePlaygroundCode} from './angular/playground-code-generator.ts';
import {
  type PlaygroundConfig,
  type PlaygroundPreparedImage,
  defaultPlaygroundConfig,
} from './playground-config.ts';

const preparedImage: PlaygroundPreparedImage = {
  dataUrl: 'data:image/png;base64,cHJlcGFyZWQ=' as QRCodeDataImageURL,
  element: {width: 4, height: 2} as HTMLImageElement,
  fileName: 'logo.png',
  size: 0.4,
  padding: 1,
  clearBackground: true,
};

function config(
  packageName: PlaygroundConfig['packageName'],
  output: PlaygroundConfig['output'],
): PlaygroundConfig {
  return {
    ...defaultPlaygroundConfig,
    packageName,
    output,
    errorCorrectionLevel: 'H',
  };
}

describe('generated playground image snippets', () => {
  for (const packageName of ['react', 'vue', 'angular'] as const) {
    test(`${packageName} SVG reads and decodes the file before conditional rendering`, () => {
      const {code} = generatePlaygroundCode(config(packageName, 'svg'), preparedImage);

      assert.match(code, /new FileReader\(\)/);
      assert.match(code, /await image\.decode\(\)/);
      assert.match(code, /source: (?:imageSource|source)/);
      const conditionalRender = {
        angular: /@if \(options\(\)/,
        react: /if \(!imageSource\)/,
        vue: /v-if="options"/,
      }[packageName];
      assert.match(code, conditionalRender);
    });

    for (const output of ['image', 'canvas'] as const) {
      test(`${packageName} ${output} passes a decoded image element after preparation`, () => {
        const {code} = generatePlaygroundCode(config(packageName, output), preparedImage);

        assert.match(code, /new FileReader\(\)/);
        assert.match(code, /const image = new Image\(\)/);
        assert.match(code, /await image\.decode\(\)/);
        assert.match(code, /source: (?:imageSource|source)/);
      });
    }
  }
});

describe('generated playground ECI options', () => {
  for (const packageName of ['react', 'vue', 'angular'] as const) {
    test(`${packageName} includes ECI only when enabled`, () => {
      const disabled = generatePlaygroundCode(config(packageName, 'svg')).code;
      const enabled = generatePlaygroundCode({...config(packageName, 'svg'), eci: true}).code;

      assert.doesNotMatch(disabled, /eci:/);
      assert.match(enabled, /eci: true/);
    });
  }
});

describe('generated playground languages', () => {
  test('generates an idiomatic Vue single-file component', () => {
    const preview = generatePlaygroundCode(config('vue', 'image'));

    assert.equal(preview.lang, 'vue');
    assert.match(preview.code, /<script setup lang="ts">/);
    assert.match(preview.code, /from '@qrcodesdk\/vue'/);
    assert.match(preview.code, /ref="qrcode"/);
  });
});
