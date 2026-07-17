import {readFileSync} from 'fs';

import {createExampleContent} from './example-content.mjs';

/**
 * @typedef {{ name: string, enforce: 'pre' | 'post', transform(code: string, id: string): void | { code: string } }} IncludeContentPlugin
 * @returns {IncludeContentPlugin[]}
 */
export function includeContentPlugin() {
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
        map.set(filePath, createExampleContent(filePath, fileContent));
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

        const className = fileContent.match(/export class\s+(\w+)/)?.at(1);

        return {
          code: `
            ${code}
            export const content = ${JSON.stringify(fileContent)};
            ${className ? `export default ${className};` : ''}
          `,
        };
      },
    },
  ];
}
