import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      clean: false,
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
      reporter: [['json', {file: 'node.json'}]],
      reportsDirectory: '../../.coverage/raw/node',
    },
  },
});
