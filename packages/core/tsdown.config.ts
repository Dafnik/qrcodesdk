import {defineConfig} from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    matrix: 'src/qrcode-builder.ts',
    svg: 'src/svg.ts',
    text: 'src/text.ts',
    error: 'src/error.ts',
    internal: 'src/internal.ts',
    'drawing/index': 'src/drawing/index.ts',
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
