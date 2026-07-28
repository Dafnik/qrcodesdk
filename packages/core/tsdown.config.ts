import {defineConfig} from 'tsdown';

export default defineConfig({
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
