import {defineConfig} from 'tsdown';

export default defineConfig({
  dts: {
    tsgo: true,
  },
  exports: true,
  fixedExtension: true,
  format: 'es',
  platform: 'node',
  target: 'node22.0.0',
});
