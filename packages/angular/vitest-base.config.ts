import {defineConfig} from 'vitest/config';

// gets added to Angular's internal vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      clean: false,
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
      reporter: [['json', {file: 'angular.json'}]],
      reportsDirectory: '../../.coverage/raw/angular',
    },
  },
});
