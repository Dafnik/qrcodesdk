import {defineConfig} from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'decoder/index': 'src/decoder/index.ts',
    'decoder/node': 'src/decoder/node.ts',
  },
  dts: {
    generator: 'tsgo',
  },
  exports: true,
});
