import {readFileSync} from 'fs';

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

        if (filePath.includes('/src/components/react/')) {
          return {
            code: `
              ${code}
              export const content = ${JSON.stringify(fileContent)};
            `,
          };
        }

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
