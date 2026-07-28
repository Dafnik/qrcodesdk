import {playwright} from '@vitest/browser-playwright';
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      tsdown: fileURLToPath(new URL('./tests/tsdown-shim.ts', import.meta.url)),
    },
  },
  test: {
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{browser: 'chromium'}],
    },
    coverage: {
      clean: false,
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
      reporter: [['json', {file: 'browser.json'}]],
      reportsDirectory: '../../.coverage/raw/browser',
    },
  },
});
