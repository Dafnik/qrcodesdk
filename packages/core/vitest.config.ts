import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      clean: false,
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
      reporter: [['json', {file: 'core.json'}]],
      reportsDirectory: '../../.coverage/raw/core',
    },
  },
});
