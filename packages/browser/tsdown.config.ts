import {defineConfig} from 'tsdown';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/canvas.ts',
    'src/gif.ts',
    'src/image.ts',
    'src/jpeg.ts',
    'src/png.ts',
    'src/svg.ts',
    'src/webp.ts',
  ],
  dts: {
    generator: 'tsgo',
  },
  exports: true,
  fixedExtension: true,
  format: 'es',
  platform: 'browser',
  target: 'es2020',
});
