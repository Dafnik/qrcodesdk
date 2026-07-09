import {config} from '@repo/eslint-config/base';
import angular from 'angular-eslint';

const withFiles = (configs, files) => configs.map((entry) => ({...entry, files}));

export default [
  ...config,
  {
    ignores: ['dist/**', '.angular/**', 'out-tsc/**'],
  },
  ...withFiles(angular.configs.tsRecommended, ['src/**/*.ts']),
  {
    files: ['src/**/*.ts'],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: '',
          style: 'kebab-case',
        },
      ],
    },
  },
  ...withFiles(
    [...angular.configs.templateRecommended, angular.configs.templateAccessibility.at(-1)],
    ['src/**/*.html'],
  ),
];
