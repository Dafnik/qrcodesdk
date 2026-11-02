import {config} from '@repo/eslint-config/base';
import angular from 'angular-eslint';

const withFiles = (configs, files) => configs.map((entry) => ({...entry, files}));
const angularTypeScriptFiles = ['src/**/*.ts'];

export default [
  ...config,
  {
    ignores: ['dist/**', '.angular/**', 'out-tsc/**', 'src/libs/ui/**'],
  },
  ...withFiles(angular.configs.tsRecommended, angularTypeScriptFiles),
  {
    files: angularTypeScriptFiles,
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        {type: 'element', prefix: 'app', style: 'kebab-case'},
      ],
    },
  },
  ...withFiles(
    [...angular.configs.templateRecommended, angular.configs.templateAccessibility.at(-1)],
    ['src/**/*.html'],
  ),
];
