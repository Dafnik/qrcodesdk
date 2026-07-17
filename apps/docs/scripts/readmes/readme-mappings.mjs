/**
 * Add another object to generate an additional package README. For example:
 *
 * {
 *   id: 'react',
 *   source: 'src/content/docs/libs/react.mdx',
 *   output: '../../packages/react/README.md',
 *   codeLanguage: 'tsx',
 * }
 *
 * Paths are resolved from apps/docs. Imported preview wrappers only need to
 * expose one `?includeContent` source, as the existing Angular and React
 * wrappers already do.
 *
 * @type {Array<{
 *   id: string,
 *   source: string,
 *   output: string,
 *   codeLanguage: string,
 * }>}
 */
export const README_MAPPINGS = [
  {
    id: 'angular',
    source: 'src/content/docs/libs/angular.mdx',
    output: '../../packages/angular/README.md',
    codeLanguage: 'ts',
  },
  {
    id: 'react',
    source: 'src/content/docs/libs/react.mdx',
    output: '../../packages/react/README.md',
    codeLanguage: 'tsx',
  },
];
