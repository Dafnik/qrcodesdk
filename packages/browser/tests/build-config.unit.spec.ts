import {describe, expect, test} from 'vitest';

import config from '../tsdown.config';

describe('build configuration', () => {
  test('emits browser ES2020 ESM', () => {
    expect(config).toMatchObject({
      fixedExtension: true,
      format: 'es',
      platform: 'browser',
      target: 'es2020',
    });
  });
});
