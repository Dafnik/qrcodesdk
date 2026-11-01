import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      clean: false,
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
      reporter: [['json', {file: 'react.json'}]],
      reportsDirectory: '../../.coverage/raw/react',
    },
    environment: 'jsdom',
    unstubGlobals: true,
  },
});
