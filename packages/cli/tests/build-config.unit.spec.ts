import {describe, expect, test} from 'vitest';

import config from '../tsdown.config';

describe('build configuration', () => {
  test('emits Node 22.12 ESM', () => {
    expect(config).toMatchObject({
      fixedExtension: true,
      format: 'es',
      platform: 'node',
      target: 'node22.12.0',
    });
  });
});
