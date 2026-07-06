// @ts-check
import angular from '@analogjs/astro-angular';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
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
  site: 'https://qrcodesdk.dev',
  cacheDir: process.env.ASTRO_CACHE_DIR ?? './node_modules/.astro',
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
  vite: {
    cacheDir: process.env.VITE_CACHE_DIR ?? './node_modules/.vite',
    plugins: [includeContentPlugin(), tailwindcss()],
  },
  integrations: [
    starlight({
      customCss: ['./src/styles/global.css'],
      title: 'QRCodeSDK',
      sidebar: [
        {
          label: 'Start Here',
          items: [
            {label: 'Overview', slug: ''},
            {label: 'Installation', slug: 'guides/installation'},
          ],
        },
        {
          label: 'Choose Your Output',
          items: [
            {label: 'Render SVG', slug: 'renderers/core/svg'},
            {label: 'Render PNG in Node.js', slug: 'renderers/node/png'},
            {label: 'Render to Canvas', slug: 'renderers/browser/canvas'},
            {label: 'Render to an Image Element', slug: 'renderers/browser/image'},
            {label: 'Render Terminal Text', slug: 'renderers/core/text'},
          ],
        },
        {
          label: 'Customize',
          items: [{label: 'Customize QR Codes', slug: 'guides/customize'}],
        },
        {
          label: 'Advanced',
          items: [
            {label: 'Builder API', slug: 'libraries/core'},
            {label: 'Custom Renderers', slug: 'renderers'},
            {label: 'API Reference', slug: 'reference/api'},
          ],
        },
        {
          label: 'Packages',
          items: [
            {label: '@qrcodesdk/core', slug: 'libraries/core'},
            {label: '@qrcodesdk/browser', slug: 'libraries/browser'},
            {label: '@qrcodesdk/node', slug: 'libraries/node'},
            {label: '@qrcodesdk/angular', slug: 'libraries/angular'},
          ],
        },
      ],
    }),
    angular({
      useAngularHydration: true,
      vite: {
        transformFilter: (_code, id) => {
          return id.includes('src/components/angular'); // <- only transform Angular TypeScript files
        },
      },
    }),
  ],
});
