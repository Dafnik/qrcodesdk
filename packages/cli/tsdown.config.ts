import {defineConfig} from 'tsdown';

import packageJson from './package.json' with {type: 'json'};

export default defineConfig({
  define: {
    __QRCODESDK_CLI_VERSION__: JSON.stringify(packageJson.version),
  },
  dts: {
    tsgo: true,
  },
  exports: {
    bin: {
      qrc: './src/index.ts',
    },
  },
});
