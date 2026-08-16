import {config as baseConfig} from '@repo/eslint-config/base';
import svelte from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';

export default [
  ...baseConfig,
  ...svelte.configs['flat/recommended'],
  ...svelte.configs['flat/prettier'],
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        extraFileExtensions: ['.svelte'],
        parser: tseslint.parser,
      },
    },
    rules: {
      // Type references in Svelte TypeScript scripts are handled by svelte-check.
      'no-undef': 'off',
      // Browser renderers return DOM nodes that the adapter owns inside an otherwise empty wrapper.
      'svelte/no-dom-manipulating': 'off',
      // The SVG string is generated internally by @qrcodesdk/core, never accepted from consumers.
      'svelte/no-at-html-tags': 'off',
    },
  },
];
