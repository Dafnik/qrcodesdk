import {defineConfig} from 'tsdown';

export default defineConfig({
  dts: false,
  entry: {
    index: './src/index.ts',
    'jpeg-index': './src/jpeg-index.ts',
  },
  exports: false,
});
