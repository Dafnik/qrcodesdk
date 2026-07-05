import {config} from '@repo/eslint-config/base';

export default [
  ...config,
  {
    ignores: ['dist/**', '.astro/**', '.astro-cache/**', '.vite-cache/**', 'src/env.d.ts'],
  },
  {
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
      },
    },
  },
];
