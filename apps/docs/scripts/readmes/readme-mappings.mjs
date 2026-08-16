/**
 * Add another object to generate an additional package README. For example:
 *
 * {
 *   id: 'react',
 *   source: 'src/content/docs/packages/react.mdx',
 *   output: '../../packages/react/README.md',
 *   codeLanguage: 'tsx',
 * }
 *
 * Paths are resolved from apps/docs. Imported preview wrappers only need to
 * expose one `?includeContent` source, as the Angular, React, Svelte, and Vue
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
    source: 'src/content/docs/packages/angular.mdx',
    output: '../../packages/angular/README.md',
    codeLanguage: 'ts',
  },
  {
    id: 'core',
    source: 'src/content/docs/packages/core.mdx',
    output: '../../packages/core/README.md',
    codeLanguage: 'ts',
  },
  {
    id: 'cli',
    source: 'src/content/docs/packages/cli.mdx',
    output: '../../packages/cli/README.md',
    codeLanguage: 'ts',
  },
  {
    id: 'react',
    source: 'src/content/docs/packages/react.mdx',
    output: '../../packages/react/README.md',
    codeLanguage: 'tsx',
  },
  {
    id: 'node',
    source: 'src/content/docs/packages/node.mdx',
    output: '../../packages/node/README.md',
    codeLanguage: 'ts',
  },
  {
    id: 'browser',
    source: 'src/content/docs/packages/browser.mdx',
    output: '../../packages/browser/README.md',
    codeLanguage: 'ts',
  },
  {
    id: 'vue',
    source: 'src/content/docs/packages/vue.mdx',
    output: '../../packages/vue/README.md',
    codeLanguage: 'vue',
  },
  {
    id: 'svelte',
    source: 'src/content/docs/packages/svelte.mdx',
    output: '../../packages/svelte/README.md',
    codeLanguage: 'svelte',
  },
];
