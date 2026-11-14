import {defineConfig} from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'micro-decoder/index': 'src/micro-decoder/index.ts',
    'micro-decoder/node': 'src/micro-decoder/node.ts',
  },
  dts: {
    generator: 'tsgo',
  },
  exports: true,
});
