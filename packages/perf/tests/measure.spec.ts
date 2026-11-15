import {encode} from '@jridgewell/sourcemap-codec';
import {describe, expect, test} from 'vitest';

import {codeAreaOf} from '../src/areas.ts';
import {WORKSPACE_ROOT} from '../src/paths.ts';
import {attributeBytes, normalizeSource} from '../src/size/measure.ts';

describe('attributeBytes', () => {
  test('attributes each generated segment to its source and the rest to unmapped bytes', () => {
    const code = 'abcde\nfg';
    const map = {
      sources: ['a.ts', 'b.ts'],
      mappings: encode([
        [
          [0, 0, 0, 0],
          [3, 1, 0, 0],
        ],
        [[1, 0, 0, 0]],
      ]),
    };
    const bytes = attributeBytes(code, map, (source) => source);
    expect(Object.fromEntries(bytes)).toEqual({'a.ts': 4, 'b.ts': 2, '(unmapped)': 2});
  });

  test('counts multi-byte characters as UTF-8 bytes', () => {
    const map = {sources: ['k.ts'], mappings: encode([[[0, 0, 0, 0]]])};
    expect(attributeBytes('漢', map, (source) => source).get('k.ts')).toBe(3);
  });
});

describe('normalizeSource', () => {
  test('collapses third-party files to their package', () => {
    expect(
      normalizeSource(
        `${WORKSPACE_ROOT}/node_modules/.pnpm/react-dom@19.3.1/node_modules/react-dom/cjs/react-dom.js`,
      ),
    ).toBe('node_modules/react-dom/');
    expect(
      normalizeSource(
        `${WORKSPACE_ROOT}/node_modules/.pnpm/@angular+core@22/node_modules/@angular/core/fesm2022/core.mjs`,
      ),
    ).toBe('node_modules/@angular/core/');
    expect(normalizeSource(`${WORKSPACE_ROOT}/packages/core/src/svg.ts`)).toBe(
      'packages/core/src/svg.ts',
    );
  });
});

describe('codeAreaOf', () => {
  test.each([
    ['packages/core/src/micro/encode.ts', 'core:micro'],
    ['packages/core/src/micro.ts', 'core:micro'],
    ['packages/core/src/kanji/table.ts', 'core:kanji-table'],
    ['packages/core/src/matrix/kanji.ts', 'core:matrix'],
    ['packages/core/src/shape-path.ts', 'core:custom-shape'],
    ['packages/browser/src/image-base.ts', 'browser:image'],
    ['packages/browser/src/image.ts', 'browser:download'],
    ['node_modules/@vue/runtime-core/', 'framework:vue'],
    ['node_modules/react-dom/', 'framework:react'],
    ['node_modules/@angular/core/', 'framework:angular'],
    ['(unmapped)', 'other'],
  ])('%s belongs to %s', (source, area) => {
    expect(codeAreaOf(source).id).toBe(area);
  });
});
