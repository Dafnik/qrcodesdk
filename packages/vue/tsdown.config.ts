import {defineConfig} from 'tsdown';

export default defineConfig({
  dts: {
    tsgo: true,
  },
  exports: true,
  fixedExtension: true,
  format: 'es',
  platform: 'neutral',
  target: 'es2020',
});
