import {config} from '@repo/eslint-config/base';

export default [
  ...config,
  {
    ignores: ['dist/**', 'coverage/**', 'tests/__snapshots__/**'],
  },
];
