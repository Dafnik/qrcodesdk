import {describe, expect, test} from 'vitest';

import config from '../tsdown.config';

describe('build configuration', () => {
  test('emits Node 22 ESM', () => {
    expect(config).toMatchObject({
      fixedExtension: true,
      format: 'es',
      platform: 'node',
      target: 'node22.0.0',
    });
  });
});
