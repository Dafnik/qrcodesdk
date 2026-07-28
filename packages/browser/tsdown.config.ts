import {defineConfig} from 'tsdown';

export default defineConfig({
  dts: {
    tsgo: true,
  },
  exports: true,
  fixedExtension: true,
  format: 'es',
  platform: 'browser',
  target: 'es2020',
});
