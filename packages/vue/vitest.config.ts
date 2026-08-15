import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      clean: false,
      include: ['src/**/*.ts'],
      provider: 'v8',
      reporter: [['json', {file: 'vue.json'}]],
      reportsDirectory: '../../.coverage/raw/vue',
    },
    environment: 'jsdom',
  },
});
