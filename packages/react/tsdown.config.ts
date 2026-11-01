import {defineConfig} from 'tsdown';

export default defineConfig({
  banner: "'use client';",
  dts: {
    generator: 'tsgo',
  },
  exports: true,
  fixedExtension: true,
  format: 'es',
  platform: 'neutral',
  target: 'es2020',
});
