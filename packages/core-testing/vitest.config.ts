import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';

/** Core entry points by import path, mapped to their source files for coverage runs. */
const CORE_SOURCE_ENTRIES = {
  '@qrcodesdk/core': 'index.ts',
  '@qrcodesdk/core/error': 'error.ts',
  '@qrcodesdk/core/internal': 'internal.ts',
  '@qrcodesdk/core/internal/gif': 'internal-gif.ts',
  '@qrcodesdk/core/internal/jpeg': 'internal-jpeg.ts',
  '@qrcodesdk/core/internal/webp': 'internal-webp.ts',
  '@qrcodesdk/core/kanji': 'kanji.ts',
  '@qrcodesdk/core/matrix': 'matrix.ts',
  '@qrcodesdk/core/payload': 'payload.ts',
  '@qrcodesdk/core/segmenter': 'segmenter.ts',
  '@qrcodesdk/core/style': 'style/index.ts',
  '@qrcodesdk/core/svg': 'svg.ts',
  '@qrcodesdk/core/text': 'text.ts',
};

// Exact matches keep the root alias from also rewriting subpaths such as `@qrcodesdk/core/kanji`.
const coreSourceAliases = Object.entries(CORE_SOURCE_ENTRIES).map(([entry, source]) => ({
  find: new RegExp(`^${entry.replaceAll('/', '\\/')}$`),
  replacement: fileURLToPath(new URL(`../core/src/${source}`, import.meta.url)),
}));

export default defineConfig(({mode}) => ({
  resolve: {
    alias: mode === 'coverage' ? coreSourceAliases : [],
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
