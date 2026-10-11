import {defineConfig} from 'tsdown';

export default defineConfig({
  dts: {
    generator: 'tsgo',
  },
  exports: true,
  fixedExtension: true,
  format: 'es',
  platform: 'browser',
  target: 'es2020',
});
