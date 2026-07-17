import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';

export default defineConfig(({mode}) => ({
  resolve: {
    alias:
      mode === 'coverage'
        ? {'@qrcodesdk/core': fileURLToPath(new URL('../core/src/index.ts', import.meta.url))}
        : {},
  },
  test: {
    coverage: {
      allowExternal: true,
      clean: false,
      exclude: ['**/packages/core-testing/src/**', '**/packages/core-testing/tests/**'],
      provider: 'v8',
      reporter: [['json', {file: 'core-testing.json'}]],
      reportsDirectory: '../../.coverage/raw/core-testing',
    },
  },
}));
