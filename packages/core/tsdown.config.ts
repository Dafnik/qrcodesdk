import {defineConfig} from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/drawing/index.ts', 'src/payload.ts'],
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
