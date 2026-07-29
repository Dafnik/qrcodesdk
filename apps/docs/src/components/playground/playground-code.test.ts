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
  for (const packageName of ['react', 'angular'] as const) {
    test(`${packageName} SVG reads and decodes the file before conditional rendering`, () => {
      const {code} = generatePlaygroundCode(config(packageName, 'svg'), preparedImage);

      assert.match(code, /new FileReader\(\)/);
      assert.match(code, /await image\.decode\(\)/);
      assert.match(code, /source: (?:imageSource|source)/);
      assert.match(code, packageName === 'react' ? /if \(!imageSource\)/ : /@if \(options\(\)/);
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
