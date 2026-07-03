// @ts-check
import angular from '@analogjs/astro-angular';
import starlight from '@astrojs/starlight';
import {defineConfig} from 'astro/config';
import {readFileSync} from 'fs';

/**
 * @typedef {{ name: string, enforce: 'pre' | 'post', transform(code: string, id: string): void | { code: string } }} IncludeContentPlugin
 */

/**
 * @returns {IncludeContentPlugin[]}
 */
function includeContentPlugin() {
  /** @type {Map<string, string>} */
  const map = new Map();

  return [
    {
      name: 'pre-include-content',
      enforce: 'pre',
      /**
       * @param {string} _code
       * @param {string} id
       */
      transform(_code, id) {
        if (!id.includes('?includeContent') || id.includes('astro-entry')) return;

        const [filePath] = id.split('?');
        const fileContent = readFileSync(filePath, 'utf-8');

        if (map.has(filePath)) return;
        map.set(filePath, fileContent.replace(/\t/g, '  '));
      },
    },
    {
      name: 'post-include-content',
      enforce: 'post',
      /**
       * @param {string} code
       * @param {string} id
       */
      transform(code, id) {
        if (!id.includes('?includeContent') || id.includes('astro-entry')) return;
        const [filePath] = id.split('?');

        const fileContent = map.get(filePath);
        if (!fileContent) return;

        const filteredFileContent = fileContent
          .replace(/static clientProviders\s*=\s*\[.*?\];\n?/s, '')
          .replace(/static renderProviders\s*=\s*\[.*?\];\n?/s, '')
          .replace(/(?<=class\s+\w+\s+{\s*)\s*(?=\s*})/g, '');

        const neededProviders = fileContent
          .match(/static clientProviders\s*=\s*\[(.*?)\];/s)
          ?.at(1);
        const className = fileContent.match(/export class\s+(\w+)/)?.at(1);

        const bootstrapApplication = `bootstrapApplication(${className}, {
  providers: [${neededProviders}],
}).catch((err) => console.error(err));`;

        return {
          code: `
            ${code}
            export const content = ${JSON.stringify(`${filteredFileContent}${neededProviders ? `\n${bootstrapApplication}` : ''}`)};
            ${className ? `export default ${className};` : ''}
          `,
        };
      },
    },
  ];
}

// https://astro.build/config
export default defineConfig({
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
  vite: {
    esbuild: {
      jsxDev: true,
    },
    plugins: [includeContentPlugin()],
  },
  integrations: [
    starlight({
      title: 'QRCodeSDK',
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            {label: 'Overview', slug: ''},
            {label: 'Installation', slug: 'guides/installation'},
          ],
        },
        {
          label: 'Libraries',
          items: [
            {label: 'Core', slug: 'libraries/core'},
            {label: 'Node', slug: 'libraries/node'},
          ],
        },
        {
          label: 'Renderers',
          items: [
            {label: 'Overview', slug: 'renderers'},
            {
              label: 'Core',
              items: [
                {label: 'SVG', slug: 'renderers/core/svg'},
                {label: 'Text', slug: 'renderers/core/text'},
              ],
            },
            {
              label: 'Browser',
              items: [
                {label: 'Canvas', slug: 'renderers/browser/canvas'},
                {label: 'Image', slug: 'renderers/browser/image'},
              ],
            },
            {label: 'Node', items: [{label: 'PNG', slug: 'renderers/node/png'}]},
          ],
        },
        {
          label: 'Reference',
          items: [{label: 'API Reference', slug: 'reference/api'}],
        },
      ],
    }),
    angular({
      useAngularHydration: true,
      vite: {
        transformFilter: (_code, id) => {
          return id.includes('src/components'); // <- only transform Angular TypeScript files
        },
      },
    }),
  ],
});
