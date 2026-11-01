import {defineConfig} from 'tsdown';

export default defineConfig({
  // Declaration files cannot contain directives.
  banner: {js: "'use client';"},
  dts: {
    generator: 'tsgo',
  },
  exports: true,
  fixedExtension: true,
  format: 'es',
  platform: 'neutral',
  target: 'es2020',
});
