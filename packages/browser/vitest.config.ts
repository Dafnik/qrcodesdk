import {playwright} from '@vitest/browser-playwright';
import {defineConfig} from 'vitest/config';

export default defineConfig({
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
