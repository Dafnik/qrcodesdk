import angularLibraryConfig from '@repo/typescript-config/angular-library.json' with {type: 'json'};
import {describe, expect, test} from 'vitest';

describe('build configuration', () => {
  test('retains the Angular ES2022 library target', () => {
    expect(angularLibraryConfig.compilerOptions.target).toBe('ES2022');
  });
});
