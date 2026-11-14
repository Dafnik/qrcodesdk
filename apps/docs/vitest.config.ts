import {defineConfig} from 'vitest/config';

// Only the QR code explanation tests run in Vitest: they import private core source modules
// with imports that omit file extensions, which the Node test runner cannot resolve.
export default defineConfig({
  test: {
    include: ['src/components/explain/**/*.test.ts'],
    benchmark: {include: ['src/components/explain/**/*.bench.ts']},
  },
});
