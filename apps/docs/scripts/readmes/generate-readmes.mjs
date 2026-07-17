import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {URL, fileURLToPath, pathToFileURL} from 'node:url';
import {format, resolveConfig} from 'prettier';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import {unified} from 'unified';
import {parse as parseYaml} from 'yaml';

import {createExampleContent} from '../../example-content.mjs';
import {createPackageManagerCommands} from '../../package-manager-commands.mjs';
import {README_MAPPINGS} from './readme-mappings.mjs';

// cspell:ignore mdxjs

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = path.resolve(SCRIPT_DIRECTORY, '../..');
const WORKSPACE_ROOT = path.resolve(DOCS_ROOT, '../..');
const SITE_URL = 'https://qrcodesdk.dev';

const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkMdx)
  .use(remarkGfm)
  .use(remarkStringify, {
    bullet: '-',
    fences: true,
    listItemIndent: 'one',
  });

/**
 * @param {string} source
 * @param {string} [sourcePath]
 */
export function parseFrontmatter(source, sourcePath = 'MDX document') {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);

  if (!match) {
    throw new Error(`${sourcePath} must start with YAML frontmatter.`);
  }

  const data = parseYaml(match[1]);

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`${sourcePath} has invalid YAML frontmatter.`);
  }

  return {
    data,
    body: source.slice(match[0].length),
  };
}

/**
 * @param {{ id: string, source: string, output: string, codeLanguage: string }} mapping
 * @param {{
 *   docsRoot?: string,
 *   contentRoot?: string,
 *   siteUrl?: string,
 *   workspaceRoot?: string,
 * }} [options]
 */
export async function generateReadme(mapping, options = {}) {
  validateReadmeMappings([mapping]);

  const docsRoot = options.docsRoot ?? DOCS_ROOT;
  const contentRoot = options.contentRoot ?? path.join(docsRoot, 'src/content/docs');
  const siteUrl = options.siteUrl ?? SITE_URL;
  const workspaceRoot = options.workspaceRoot ?? path.resolve(docsRoot, '../..');
  const {sourcePath, outputPath, codeLanguage} = resolveReadmeMapping(mapping, docsRoot);
  const source = await readFile(sourcePath, 'utf8');
  const {data: frontmatter, body} = parseFrontmatter(source, sourcePath);
  const title = requireString(frontmatter.title, 'frontmatter.title', sourcePath);
  const packageName = requireString(frontmatter.packageName, 'frontmatter.packageName', sourcePath);
  const related = parseRelated(frontmatter.related, sourcePath);
  const imports = collectDefaultImports(markdownProcessor.parse(body), sourcePath);
  const tree = markdownProcessor.parse(body);
  const relatedDocuments = await resolveRelatedDocuments({
    related,
    sourcePath,
    contentRoot,
    siteUrl,
  });
  const playground = relatedDocuments.find(({id}) => id === 'playground');

  tree.children = await transformChildren(tree.children, {
    sourcePath,
    packageName,
    imports,
    playground,
    codeLanguage,
  });

  absolutizeLinks(tree, {sourcePath, contentRoot, siteUrl});

  tree.children.unshift(
    {
      type: 'html',
      value: `<!-- Generated from ${toPosixPath(path.relative(workspaceRoot, sourcePath))}. Run \`pnpm --filter docs generate-readmes\` to update. -->`,
    },
    {
      type: 'heading',
      depth: 1,
      children: [{type: 'text', value: title}],
    },
  );

  tree.children.push(
    {
      type: 'heading',
      depth: 2,
      children: [{type: 'text', value: 'Documentation'}],
    },
    {
      type: 'list',
      ordered: false,
      spread: false,
      children: [
        createLinkListItem(title, createDocumentUrl(sourcePath, contentRoot, siteUrl)),
        ...relatedDocuments
          .filter(({id}) => id !== 'playground')
          .map(({title: relatedTitle, url}) => createLinkListItem(relatedTitle, url)),
      ],
    },
  );

  const markdown = markdownProcessor.stringify(tree);
  const prettierConfig = (await resolveConfig(outputPath)) ?? {};
  const content = await format(markdown, {
    ...prettierConfig,
    filepath: outputPath,
    parser: 'markdown',
  });

  return {content, mapping, outputPath, sourcePath};
}

/**
 * @param {typeof README_MAPPINGS} [mappings]
 * @param {{ docsRoot?: string, contentRoot?: string, siteUrl?: string, workspaceRoot?: string }} [options]
 */
export async function generateReadmes(mappings = README_MAPPINGS, options) {
  validateReadmeMappings(mappings);

  return Promise.all(mappings.map((mapping) => generateReadme(mapping, options)));
}

/**
 * @param {string} generatedReadme
 * @param {string} outputPath
 * @param {string} [workspaceRoot]
 */
export async function assertReadmeCurrent(
  generatedReadme,
  outputPath,
  workspaceRoot = WORKSPACE_ROOT,
) {
  const currentReadme = await readFile(outputPath, 'utf8').catch(() => undefined);

  if (currentReadme !== generatedReadme) {
    throw new Error(
      `${toPosixPath(path.relative(workspaceRoot, outputPath))} is stale. Run \`pnpm --filter docs generate-readmes\`.`,
    );
  }
}

/**
 * @param {Array<{ id: string, source: string, output: string, codeLanguage: string }>} mappings
 */
export function validateReadmeMappings(mappings) {
  if (!Array.isArray(mappings) || mappings.length === 0) {
    throw new Error('README_MAPPINGS must contain at least one mapping.');
  }

  const ids = new Set();
  const outputs = new Set();

  for (const mapping of mappings) {
    const id = requireString(mapping?.id, 'README mapping id');
    requireString(mapping?.source, `README mapping ${id} source`);
    const output = requireString(mapping?.output, `README mapping ${id} output`);
    requireString(mapping?.codeLanguage, `README mapping ${id} codeLanguage`);

    if (ids.has(id)) {
      throw new Error(`README mapping id ${id} is duplicated.`);
    }

    if (outputs.has(output)) {
      throw new Error(`README mapping output ${output} is duplicated.`);
    }

    ids.add(id);
    outputs.add(output);
  }
}

/**
 * @param {{ id: string, source: string, output: string, codeLanguage: string }} mapping
 * @param {string} docsRoot
 */
function resolveReadmeMapping(mapping, docsRoot) {
  return {
    codeLanguage: mapping.codeLanguage,
    outputPath: path.resolve(docsRoot, mapping.output),
    sourcePath: path.resolve(docsRoot, mapping.source),
  };
}

/**
 * @param {Array<Record<string, any>>} children
 * @param {{
 *   sourcePath: string,
 *   packageName: string,
 *   imports: Map<string, string>,
 *   playground?: { url: string },
 *   codeLanguage: string,
 * }} context
 */
async function transformChildren(children, context) {
  /** @type {Array<Record<string, any>>} */
  const transformed = [];

  for (const node of children) {
    if (node.type === 'mdxjsEsm') {
      continue;
    }

    if (node.type === 'mdxJsxFlowElement') {
      transformed.push(...(await transformComponent(node, context)));
      continue;
    }

    if (node.type.startsWith('mdx')) {
      throw unsupportedMdxError(node, context.sourcePath);
    }

    if (Array.isArray(node.children)) {
      node.children = await transformChildren(node.children, context);
    }

    transformed.push(node);
  }

  return transformed;
}

/**
 * @param {Record<string, any>} node
 * @param {{
 *   sourcePath: string,
 *   packageName: string,
 *   imports: Map<string, string>,
 *   playground?: { url: string },
 *   codeLanguage: string,
 * }} context
 */
async function transformComponent(node, context) {
  const componentName = node.name;

  if (!componentName) {
    throw unsupportedMdxError(node, context.sourcePath);
  }

  if (componentName === 'PackageBadges') {
    assertNoAttributes(node, context.sourcePath);

    return createBadgeNodes(context.packageName, context.playground?.url);
  }

  if (componentName === 'PackageManagerTabs') {
    return createPackageManagerNodes(readStaticAttributes(node, context.sourcePath));
  }

  const importPath = context.imports.get(componentName);

  if (importPath) {
    assertNoAttributes(node, context.sourcePath);

    return [
      {
        type: 'code',
        lang: context.codeLanguage,
        value: await readPreviewContent(context.sourcePath, importPath),
      },
    ];
  }

  throw new Error(
    `Unsupported MDX component <${componentName}> at ${formatPosition(node, context.sourcePath)}. Add an explicit README transformation before using it.`,
  );
}

/**
 * @param {string} sourcePath
 * @param {string} wrapperImport
 */
async function readPreviewContent(sourcePath, wrapperImport) {
  const wrapperPath = path.resolve(path.dirname(sourcePath), wrapperImport);
  const wrapperSource = await readFile(wrapperPath, 'utf8');
  const includeContentImports = [
    ...wrapperSource.matchAll(/from\s+(['"])(?<source>[^'"]+\?includeContent)\1/g),
  ];

  if (includeContentImports.length !== 1) {
    throw new Error(
      `${wrapperPath} must import exactly one source file with ?includeContent for README generation.`,
    );
  }

  const includedImport = includeContentImports[0].groups?.source;

  if (!includedImport) {
    throw new Error(`Could not resolve the ?includeContent import in ${wrapperPath}.`);
  }

  const includedPath = path.resolve(path.dirname(wrapperPath), includedImport.split('?')[0]);
  const includedSource = await readFile(includedPath, 'utf8');

  return createExampleContent(includedPath, includedSource).trimEnd();
}

/** @param {Record<string, any>} tree @param {{ sourcePath: string, contentRoot: string, siteUrl: string }} options */
function absolutizeLinks(tree, {sourcePath, contentRoot, siteUrl}) {
  visit(tree, (node) => {
    if (node.type !== 'link' || typeof node.url !== 'string') return;
    if (/^(?:[a-z]+:|#)/i.test(node.url)) return;

    if (node.url.startsWith('/')) {
      node.url = `${siteUrl}${node.url}`;
      return;
    }

    const suffixIndex = node.url.search(/[?#]/);
    const pathname = suffixIndex === -1 ? node.url : node.url.slice(0, suffixIndex);
    const suffix = suffixIndex === -1 ? '' : node.url.slice(suffixIndex);

    if (/\.(?:md|mdx|mdoc)$/i.test(pathname)) {
      node.url = createDocumentUrl(
        path.resolve(path.dirname(sourcePath), pathname),
        contentRoot,
        siteUrl,
        suffix,
      );
      return;
    }

    node.url = new URL(node.url, createDocumentUrl(sourcePath, contentRoot, siteUrl)).href;
  });
}

/**
 * @param {{ related: string[], sourcePath: string, contentRoot: string, siteUrl: string }} options
 */
async function resolveRelatedDocuments({related, sourcePath, contentRoot, siteUrl}) {
  return Promise.all(
    related.map(async (relatedPath) => {
      const suffixIndex = relatedPath.search(/[?#]/);
      const pathname = suffixIndex === -1 ? relatedPath : relatedPath.slice(0, suffixIndex);
      const suffix = suffixIndex === -1 ? '' : relatedPath.slice(suffixIndex);
      const targetPath = path.resolve(path.dirname(sourcePath), pathname);
      const targetSource = await readFile(targetPath, 'utf8');
      const {data} = parseFrontmatter(targetSource, targetPath);
      const title = requireString(data.title, 'frontmatter.title', targetPath);
      const id = createDocumentId(targetPath, contentRoot);

      return {
        id,
        title,
        url: createDocumentUrl(targetPath, contentRoot, siteUrl, suffix),
      };
    }),
  );
}

/** @param {Record<string, any>} tree @param {string} sourcePath */
function collectDefaultImports(tree, sourcePath) {
  const imports = new Map();

  for (const node of tree.children) {
    if (node.type !== 'mdxjsEsm') continue;

    const importPattern = /import\s+([A-Za-z_$][\w$]*)\s+from\s+(['"])([^'"]+)\2\s*;?/g;
    const matches = [...node.value.matchAll(importPattern)];
    const unsupportedEsm = node.value.replace(importPattern, '').trim();

    if (matches.length === 0 || unsupportedEsm.length > 0) {
      throw new Error(
        `Only default MDX imports are supported at ${formatPosition(node, sourcePath)}.`,
      );
    }

    for (const match of matches) {
      imports.set(match[1], match[3]);
    }
  }

  return imports;
}

/** @param {Record<string, any>} node @param {string} sourcePath */
function readStaticAttributes(node, sourcePath) {
  /** @type {Record<string, unknown>} */
  const attributes = {};

  for (const attribute of node.attributes ?? []) {
    if (attribute.type !== 'mdxJsxAttribute') {
      throw new Error(
        `Spread attributes are not supported at ${formatPosition(attribute, sourcePath)}.`,
      );
    }

    if (attribute.value === null || typeof attribute.value === 'string') {
      attributes[attribute.name] = attribute.value ?? true;
      continue;
    }

    const expression = attribute.value.data?.estree?.body?.at(0)?.expression;
    attributes[attribute.name] = evaluateStaticExpression(expression, attribute, sourcePath);
  }

  return attributes;
}

/**
 * @param {Record<string, any> | undefined} expression
 * @param {Record<string, any>} node
 * @param {string} sourcePath
 * @returns {unknown}
 */
function evaluateStaticExpression(expression, node, sourcePath) {
  if (!expression) {
    throw new Error(`Could not parse a static expression at ${formatPosition(node, sourcePath)}.`);
  }

  if (expression.type === 'Literal') {
    return expression.value;
  }

  if (expression.type === 'ArrayExpression') {
    return expression.elements.map((element) => {
      if (!element) {
        throw new Error(`Array holes are not supported at ${formatPosition(node, sourcePath)}.`);
      }

      return evaluateStaticExpression(element, node, sourcePath);
    });
  }

  throw new Error(
    `Dynamic MDX expressions are not supported at ${formatPosition(node, sourcePath)}.`,
  );
}

/** @param {Record<string, unknown>} attributes */
function createPackageManagerNodes(attributes) {
  const packages = requireStringArray(attributes.packages, 'PackageManagerTabs packages');
  const mode = requireString(attributes.mode, 'PackageManagerTabs mode');
  const command = optionalString(attributes.command, 'PackageManagerTabs command');
  const args =
    attributes.args === undefined
      ? []
      : requireStringArray(attributes.args, 'PackageManagerTabs args');
  const commands = createPackageManagerCommands({packages, mode, command, args});
  const visible = commands.filter(({id}) => id === 'npm' || id === 'pnpm');
  const collapsed = commands.filter(({id}) => id !== 'npm' && id !== 'pnpm');

  return [
    ...visible.map(({command: value}) => ({type: 'code', lang: 'sh', value})),
    {type: 'html', value: '<details>\n<summary>Other package managers</summary>'},
    ...collapsed.flatMap(({label, command: value}) => [
      {
        type: 'paragraph',
        children: [{type: 'strong', children: [{type: 'text', value: label}]}],
      },
      {type: 'code', lang: 'sh', value},
    ]),
    {type: 'html', value: '</details>'},
  ];
}

/** @param {string} packageName @param {string | undefined} playgroundUrl */
function createBadgeNodes(packageName, playgroundUrl) {
  const color = '7469B6';
  const packageUrl = `https://npmx.dev/package/${packageName}`;
  const badges = [
    ['npm version', 'version'],
    ['npm bundle size', 'size'],
    ['npm downloads per month', 'downloads-month'],
  ].map(([label, endpoint]) => ({
    type: 'link',
    url: packageUrl,
    children: [
      {
        type: 'image',
        alt: label,
        url: `https://npmx.dev/api/registry/badge/${endpoint}/${packageName}?color=${color}&style=shieldsio`,
      },
    ],
  }));
  const badgeChildren = badges.flatMap((badge, index) =>
    index === 0 ? [badge] : [{type: 'text', value: ' '}, badge],
  );
  const nodes = [{type: 'paragraph', children: badgeChildren}];

  if (playgroundUrl) {
    nodes.push({
      type: 'paragraph',
      children: [
        {
          type: 'strong',
          children: [
            {
              type: 'link',
              url: playgroundUrl,
              children: [{type: 'text', value: 'Live Demo'}],
            },
          ],
        },
      ],
    });
  }

  return nodes;
}

/** @param {string} title @param {string} url */
function createLinkListItem(title, url) {
  return {
    type: 'listItem',
    spread: false,
    children: [
      {
        type: 'paragraph',
        children: [{type: 'link', url, children: [{type: 'text', value: title}]}],
      },
    ],
  };
}

/** @param {string} filePath @param {string} contentRoot */
function createDocumentId(filePath, contentRoot) {
  return path
    .relative(contentRoot, filePath)
    .split(path.sep)
    .join('/')
    .replace(/\.(?:md|mdx|mdoc)$/i, '')
    .replace(/\/index$/, '');
}

/**
 * @param {string} filePath
 * @param {string} contentRoot
 * @param {string} siteUrl
 * @param {string} [suffix]
 */
function createDocumentUrl(filePath, contentRoot, siteUrl, suffix = '') {
  const id = createDocumentId(filePath, contentRoot);
  return `${siteUrl}/${id.length > 0 ? `${id}/` : ''}${suffix}`;
}

/** @param {unknown} related @param {string} sourcePath */
function parseRelated(related, sourcePath) {
  if (related === undefined) return [];

  try {
    return requireStringArray(related, 'frontmatter.related');
  } catch (error) {
    throw new Error(`${sourcePath}: ${error.message}`, {cause: error});
  }
}

/** @param {unknown} value @param {string} label @param {string} [sourcePath] */
function requireString(value, label, sourcePath) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${sourcePath ? `${sourcePath}: ` : ''}${label} must be a non-empty string.`);
  }

  return value;
}

/** @param {unknown} value @param {string} label */
function optionalString(value, label) {
  if (value === undefined) return undefined;
  return requireString(value, label);
}

/** @param {unknown} value @param {string} label */
function requireStringArray(value, label) {
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string')) {
    throw new Error(`${label} must be an array of strings.`);
  }

  return value;
}

/** @param {Record<string, any>} node @param {string} sourcePath */
function assertNoAttributes(node, sourcePath) {
  if ((node.attributes?.length ?? 0) > 0) {
    throw new Error(
      `<${node.name}> does not support README attributes at ${formatPosition(node, sourcePath)}.`,
    );
  }
}

/** @param {Record<string, any>} node @param {string} sourcePath */
function unsupportedMdxError(node, sourcePath) {
  return new Error(
    `Unsupported ${node.type} at ${formatPosition(node, sourcePath)}. Add an explicit README transformation before using it.`,
  );
}

/** @param {Record<string, any>} node @param {string} sourcePath */
function formatPosition(node, sourcePath) {
  const line = node.position?.start?.line;
  const column = node.position?.start?.column;
  return line && column ? `${sourcePath}:${line}:${column}` : sourcePath;
}

/** @param {Record<string, any>} node @param {(node: Record<string, any>) => void} visitor */
function visit(node, visitor) {
  visitor(node);

  for (const child of node.children ?? []) {
    visit(child, visitor);
  }
}

/** @param {string} value */
function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

async function run() {
  const [mode, ...extraArguments] = process.argv.slice(2);

  if (extraArguments.length > 0 || (mode !== '--write' && mode !== '--check')) {
    throw new Error('Usage: node scripts/readmes/generate-readmes.mjs <--write|--check>');
  }

  const generatedReadmes = await generateReadmes();

  if (mode === '--write') {
    for (const {content, outputPath} of generatedReadmes) {
      await writeFile(outputPath, content);
      console.log(`Generated ${toPosixPath(path.relative(WORKSPACE_ROOT, outputPath))}.`);
    }

    return;
  }

  for (const {content, outputPath} of generatedReadmes) {
    await assertReadmeCurrent(content, outputPath);
    console.log(`${toPosixPath(path.relative(WORKSPACE_ROOT, outputPath))} is up to date.`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
