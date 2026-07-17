/**
 * Returns the source shown in documentation code examples.
 *
 * Angular-only providers used to render examples inside Astro are omitted from
 * the displayed source. When client providers are present, the equivalent
 * bootstrapApplication call is appended so the example remains runnable.
 *
 * @param {string} filePath
 * @param {string} fileContent
 */
export function createExampleContent(filePath, fileContent) {
  const normalizedFileContent = fileContent.replace(/\t/g, '  ');
  const normalizedFilePath = filePath.replaceAll('\\', '/');

  if (normalizedFilePath.includes('/src/components/react/')) {
    return normalizedFileContent;
  }

  const filteredFileContent = normalizedFileContent
    .replace(/static clientProviders\s*=\s*\[.*?\];\n?/s, '')
    .replace(/static renderProviders\s*=\s*\[.*?\];\n?/s, '')
    .replace(/(?<=class\s+\w+\s+{\s*)\s*(?=\s*})/g, '');

  const neededProviders = normalizedFileContent
    .match(/static clientProviders\s*=\s*\[(.*?)\];/s)
    ?.at(1);

  if (!neededProviders) {
    return filteredFileContent;
  }

  const className = normalizedFileContent.match(/export class\s+(\w+)/)?.at(1);

  if (!className) {
    throw new Error(`Could not find an exported Angular class in ${filePath}.`);
  }

  const bootstrapApplication = `bootstrapApplication(${className}, {
  providers: [${neededProviders}],
}).catch((err) => console.error(err));`;

  return `${filteredFileContent}\n${bootstrapApplication}`;
}
