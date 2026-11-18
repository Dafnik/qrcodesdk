import {config} from '@repo/eslint-config/react-internal';

export default [
  ...config,
  {
    // The React Native consumer loads its Babel and Metro configuration as CommonJS.
    files: ['runtime/consumer/**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        __dirname: 'readonly',
        module: 'writable',
        process: 'readonly',
        require: 'readonly',
      },
    },
    rules: {'@typescript-eslint/no-require-imports': 'off'},
  },
  {
    // Untyped host components that stand in for native views in the Hermes smoke bundle.
    files: ['runtime/consumer/stubs/**/*.js'],
    rules: {'react/prop-types': 'off'},
  },
];
