import {defineConfig} from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/drawing/index.ts'],
  dts: {
    tsgo: true,
  },
  exports: true,
  fixedExtension: true,
  format: 'es',
  platform: 'neutral',
  sourcemap: true,
  target: 'es2020',
});
