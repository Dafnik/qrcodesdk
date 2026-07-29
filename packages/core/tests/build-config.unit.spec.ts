import {describe, expect, test} from 'vitest';

import config from '../tsdown.config';

describe('build configuration', () => {
  test('emits runtime-neutral ES2020 ESM', () => {
    expect(config).toMatchObject({
      fixedExtension: true,
      format: 'es',
      platform: 'neutral',
      sourcemap: true,
      target: 'es2020',
    });
  });
});
