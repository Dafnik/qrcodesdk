import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import type {QRCodeDataImageURL} from '@qrcodesdk/core';

import {createCodeHighlighter} from './angular/code-highlighter.ts';
import {generatePlaygroundCode, quote} from './angular/playground-code-generator.ts';
import {defaultCliOptions, generateCliCommand} from './cli-playground.ts';
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

type FrameworkPackage = Exclude<PlaygroundOptions['packageName'], 'cli'>;

/** Specifiers of the generated import from the framework package. */
function frameworkSpecifiers(code: string, packageName: FrameworkPackage): string[] {
  const match = new RegExp(`import \\{([^}]*)\\} from '@qrcodesdk/${packageName}';`).exec(code);
  assert.ok(match, `missing import from @qrcodesdk/${packageName}`);
  return match[1]
    .split(',')
    .map((specifier) => specifier.trim())
    .filter(Boolean);
}

/** Assert that the snippet imports the style factories from the framework package. */
function assertStyleFactories(
  code: string,
  packageName: FrameworkPackage,
  factories: readonly string[],
): void {
  const imported = frameworkSpecifiers(code, packageName);
  for (const factory of factories) assert.ok(imported.includes(factory));
}

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
      assert.match(code, /centerImage: svgCenterImage\((?:imageSource|source)\),/);
      assert.ok(frameworkSpecifiers(code, packageName).includes('svgCenterImage'));
      assert.ok(frameworkSpecifiers(code, packageName).includes('type QRCodeDataImageURL'));
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
        assert.match(code, /centerImage: canvasCenterImage\((?:imageSource|source)\),/);
        assert.ok(frameworkSpecifiers(code, packageName).includes('canvasCenterImage'));
      });
    }

    test(`${packageName} passes configured center image layout values`, () => {
      const {code} = generatePlaygroundCode(createOptions(packageName, 'canvas'), {
        ...preparedImage,
        size: 0.25,
        clearBackground: false,
      });

      assert.match(
        code,
        /centerImage: canvasCenterImage\((?:imageSource|source), \{\s+size: 0\.25,\s+clearBackground: false,\s+\}\),/,
      );
    });
  }
});

describe('generated playground ECI options', () => {
  for (const packageName of ['react', 'vue', 'svelte', 'angular'] as const) {
    test(`${packageName} includes enabled ECI`, () => {
      const enabled = generatePlaygroundCode({
        ...createOptions(packageName, 'svg'),
        eci: true,
      }).code;

      assert.match(enabled, /eci: true/);
    });
  }
});

describe('generated playground languages', () => {
  test('the shared highlighter supports CLI commands and escapes payload markup', () => {
    const command = generateCliCommand({
      ...defaultCliOptions,
      payload: '<img src=x onerror=alert(1)>',
    });
    const html = createCodeHighlighter().codeToHtml(command, {lang: 'sh', theme: 'vitesse-light'});
    assert.match(html, /npx/);
    assert.match(html, /&(?:lt|#x0*3c|#0*60);img/i);
    assert.doesNotMatch(html, /<img/);
  });
  for (const packageName of ['react', 'vue', 'svelte', 'angular'] as const) {
    for (const output of ['svg', 'image', 'canvas'] as const) {
      test(`${packageName} ${output} imports its option type from the adapter`, () => {
        const {code} = generatePlaygroundCode(createOptions(packageName, output));
        const type =
          output === 'svg'
            ? 'QRCodeSVGOptions'
            : output === 'image'
              ? 'QRCodeImageOptions'
              : 'QRCodeCanvasOptions';

        assert.match(code, new RegExp(`type ${type}.*@qrcodesdk/${packageName}`));
      });
    }
  }

  test('generates an idiomatic Vue single-file component', () => {
    const preview = generatePlaygroundCode(createOptions('vue', 'image'));

    assert.equal(preview.lang, 'vue');
    assert.match(preview.code, /<script setup lang="ts">/);
    assert.match(preview.code, /from '@qrcodesdk\/vue'/);
    assert.match(preview.code, /ref="qrcode"/);
    assert.match(preview.code, /:payload="payload"/);
    assert.match(preview.code, /:options="options"/);
  });

  test('generates an idiomatic Svelte component', () => {
    const preview = generatePlaygroundCode(createOptions('svelte', 'image'));

    assert.equal(preview.lang, 'svelte');
    assert.match(preview.code, /<script lang="ts">/);
    assert.match(preview.code, /from '@qrcodesdk\/svelte'/);
    assert.match(preview.code, /bind:this={qrcode}/);
  });
});

describe('generated playground style options', () => {
  const styled: Partial<PlaygroundOptions> = {
    moduleShape: 'rounded',
    finderRingShape: 'extra-rounded',
    finderCenterShape: 'circle',
    finderColor: '#e11d48',
  };

  for (const packageName of ['react', 'vue', 'svelte', 'angular'] as const) {
    test(`${packageName} calls the style factories it imports`, () => {
      const {code} = generatePlaygroundCode({...createOptions(packageName, 'svg'), ...styled});

      assertStyleFactories(code, packageName, ['circle', 'finder', 'rounded']);
      assert.match(code, /modules: rounded\(\),/);
      assert.match(code, /finder: finder\(\{\s+ring: rounded\(\{radius: 1\}\),/);
      assert.match(code, /center: circle\(\),\s+color: '#e11d48',\s+\}\),/);
    });

    test(`${packageName} imports and configures the diagonal shape`, () => {
      const {code} = generatePlaygroundCode({
        ...createOptions(packageName, 'canvas'),
        moduleShape: 'diagonal-rounded',
        finderRingShape: 'square',
        finderCenterShape: 'square',
      });

      assertStyleFactories(code, packageName, ['diagonal']);
      assert.match(code, /modules: diagonal\(\{radius: 1\}\),/);
    });

    test(`${packageName} emits configured alignment styles`, () => {
      const styled = generatePlaygroundCode({
        ...createOptions(packageName, 'svg'),
        alignmentRingShape: 'extra-rounded',
        alignmentCenterShape: 'circle',
        alignmentColor: '#1d4ed8',
      }).code;

      assertStyleFactories(styled, packageName, ['alignment', 'circle', 'rounded']);
      assert.match(
        styled,
        /alignment: alignment\(\{\s+ring: rounded\(\{radius: 1\}\),\s+center: circle\(\),\s+color: '#1d4ed8',\s+\}\),/,
      );
    });

    test(`${packageName} keeps explicit square alignment shapes as an alignment part`, () => {
      const {code} = generatePlaygroundCode({
        ...createOptions(packageName, 'canvas'),
        moduleShape: 'circle',
        alignmentRingShape: 'square',
        alignmentCenterShape: 'square',
      });

      assertStyleFactories(code, packageName, ['alignment', 'circle']);
      assert.match(code, /alignment: alignment\(\),/);
    });

    test(`${packageName} emits a finder part for a finder color alone`, () => {
      const {code} = generatePlaygroundCode({
        ...createOptions(packageName, 'image'),
        finderColor: '#123456',
      });

      assertStyleFactories(code, packageName, ['finder']);
      assert.match(code, /finder: finder\(\{\s+color: '#123456',\s+\}\),/);
    });
  }

  test('merges factories into the sorted framework import', () => {
    const {code} = generatePlaygroundCode({
      ...createOptions('angular', 'svg'),
      moduleShape: 'rounded',
      finderColor: '#123456',
    });

    assert.match(
      code,
      /^import \{QRCodeSVG, type QRCodeSVGOptions, finder, rounded\} from '@qrcodesdk\/angular';$/m,
    );
  });

  test('wraps long imports from the framework package', () => {
    const {code} = generatePlaygroundCode(
      {...createOptions('react', 'svg'), ...styled},
      preparedImage,
    );

    assert.ok(
      code.includes(`import {
  type QRCodeDataImageURL,
  type QRCodeDownloadHandle,
  QRCodeSVG,
  type QRCodeSVGOptions,
  circle,
  finder,
  rounded,
  svgCenterImage,
} from '@qrcodesdk/react';`),
    );
  });
});

describe('generated string literals', () => {
  test('quotes payloads with single quotes and escapes script end tags', () => {
    assert.equal(quote("it's"), "'it\\'s'");
    assert.equal(quote('say "hi"'), `'say "hi"'`);
    assert.equal(quote('a\\b\n'), "'a\\\\b\\n'");
    assert.equal(quote('</script><script>'), "'<\\/script><script>'");
    for (const value of ["it's", 'say "hi"', 'a\\b\n', '</SCRIPT>', "\\'"]) {
      assert.equal(new Function(`return ${quote(value)};`)(), value);
    }
  });

  for (const packageName of ['vue', 'svelte'] as const) {
    test(`${packageName} keeps a payload with a script end tag inside the script block`, () => {
      const {code} = generatePlaygroundCode({
        ...createOptions(packageName, 'svg'),
        payload: '</script><h1>x</h1>',
      });
      assert.equal(code.match(/<\/script>/g)?.length, 1);
    });
  }
});
