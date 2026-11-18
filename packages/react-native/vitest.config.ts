import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';

const mock = (name: string) => fileURLToPath(new URL(`tests/mocks/${name}.tsx`, import.meta.url));

export default defineConfig({
  resolve: {
    // Host components stand in for the native views, so tests run in jsdom.
    alias: {
      'react-native-svg': mock('react-native-svg'),
      'react-native': mock('react-native'),
    },
  },
  test: {
    coverage: {
      clean: false,
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
      reporter: [['json', {file: 'react-native.json'}]],
      reportsDirectory: '../../.coverage/raw/react-native',
    },
    environment: 'jsdom',
    unstubGlobals: true,
  },
});
