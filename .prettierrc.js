module.exports = {
  plugins: [
    '@trivago/prettier-plugin-sort-imports',
    'prettier-plugin-organize-attributes',
    'prettier-plugin-tailwindcss',
    'prettier-plugin-sort-json',
    'prettier-plugin-astro',
  ],
  printWidth: 100,
  singleQuote: true,
  bracketSpacing: false,
  bracketSameLine: true,
  htmlWhitespaceSensitivity: 'ignore',
  importOrder: [
    '^@angular/(.*)$',
    '^@angular/cdk(/.*)?$',
    '^rxjs',
    '<THIRD_PARTY_MODULES>',
    '^@qrcodesdk/(.*)$',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderParserPlugins: ['typescript', 'decorators-legacy'],
  jsonRecursiveSort: true,
  overrides: [
    {
      files: ['*.tsx'],
      options: {
        parser: 'babel-ts',
      },
    },
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
  ],
};
