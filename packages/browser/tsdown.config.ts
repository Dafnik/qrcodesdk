import {defineConfig} from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/canvas.ts', 'src/image.ts', 'src/svg.ts'],
  dts: {
    generator: 'tsgo',
  },
  exports: true,
  fixedExtension: true,
  format: 'es',
  platform: 'browser',
  target: 'es2020',
});
