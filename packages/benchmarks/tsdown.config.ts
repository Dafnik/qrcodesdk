import {defineConfig} from 'tsdown';

export default defineConfig({
  dts: false,
  entry: {
    index: './src/index.ts',
  },
  exports: false,
});
