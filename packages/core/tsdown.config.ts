import {defineConfig} from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    matrix: 'src/matrix.ts',
    svg: 'src/svg.ts',
    style: 'src/style/index.ts',
    text: 'src/text.ts',
    error: 'src/error.ts',
    internal: 'src/internal.ts',
    'internal/gif': 'src/internal-gif.ts',
    'internal/jpeg': 'src/internal-jpeg.ts',
    'internal/webp': 'src/internal-webp.ts',
    payload: 'src/payload.ts',
  },
  dts: {
    generator: 'tsgo',
  },
  exports: true,
  fixedExtension: true,
  format: 'es',
  platform: 'neutral',
  sourcemap: true,
  target: 'es2020',
});
