import {svelte} from '@sveltejs/vite-plugin-svelte';
import {svelteTesting} from '@testing-library/svelte/vite';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  plugins: [svelte(), svelteTesting()],
  test: {
    coverage: {
      clean: false,
      include: ['src/**/*.{ts,svelte}'],
      provider: 'v8',
      reporter: [['json', {file: 'svelte.json'}]],
      reportsDirectory: '../../.coverage/raw/svelte',
    },
    environment: 'jsdom',
  },
});
