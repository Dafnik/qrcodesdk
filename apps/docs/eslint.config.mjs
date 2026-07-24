import {config} from '@repo/eslint-config/base';

export default [
  ...config,
  {
    ignores: [
      'dist/**',
      '.astro/**',
      '.astro-cache/**',
      '.vite-cache/**',
      'src/env.d.ts',
      'src/libs/ui',
    ],
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
