import {defineConfig} from 'vitest/config';

export default defineConfig(({mode}) => ({
  test: {
    testTimeout: mode === 'coverage' ? 30_000 : undefined,
    coverage: {
      clean: false,
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
      reporter: [['json', {file: 'node.json'}]],
      reportsDirectory: '../../.coverage/raw/node',
    },
  },
}));
