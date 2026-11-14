import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {parse as parseYaml} from 'yaml';

import {assertRelatedPagesResolved, resolveRelatedPages} from './related-pages.mjs';

const DOCS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CONTENT_DIRECTORY = 'src/content/docs';

/** @param {string} id @param {string} filePath @param {string[]} [related] */
function document(id, filePath, related) {
  return {id, filePath, data: {title: `Title of ${id}`, related}};
}

const documents = [
  document(
    'getting-started/choose-your-setup',
    'src/content/docs/getting-started/choose-your-setup.mdx',
  ),
  document('reference/custom-renderers', 'src/content/docs/reference/custom-renderers.md'),
  document('reference/renderers', 'src/content/docs/reference/renderers/index.mdx'),
  document('reference/renderers/svg', 'src/content/docs/reference/renderers/svg.md'),
  document('playground', 'src/content/docs/playground.mdx'),
];

test('resolves related paths of an index page from its source directory', () => {
  const index = document('reference/renderers', 'src/content/docs/reference/renderers/index.mdx', [
    '../../getting-started/choose-your-setup.mdx',
    '../custom-renderers.md',
    './svg.md',
  ]);

  const {resolved, unresolved} = resolveRelatedPages(index, documents);

  assert.deepEqual(unresolved, []);
  assert.deepEqual(
    resolved.map(({id}) => id),
    ['getting-started/choose-your-setup', 'reference/custom-renderers', 'reference/renderers/svg'],
  );
});

test('resolves a related index page and keeps query strings and fragments', () => {
  const page = document('reference/renderers/svg', 'src/content/docs/reference/renderers/svg.md', [
    './index.mdx#overview',
    '../../playground.mdx?package=react',
  ]);

  const {resolved} = resolveRelatedPages(page, documents);

  assert.deepEqual(
    resolved.map(({id, suffix}) => [id, suffix]),
    [
      ['reference/renderers', '#overview'],
      ['playground', '?package=react'],
    ],
  );
});

test('reports related paths that do not match a source file', () => {
  const page = document('reference/renderers', 'src/content/docs/reference/renderers/index.mdx', [
    '../getting-started/choose-your-setup.mdx',
  ]);

  const {resolved, unresolved} = resolveRelatedPages(page, documents);

  assert.deepEqual(resolved, []);
  assert.deepEqual(unresolved, ['../getting-started/choose-your-setup.mdx']);
  assert.throws(() => assertRelatedPagesResolved(page, unresolved), /do not exist/);
});

test('every related path in the documentation resolves', async () => {
  const contentRoot = path.join(DOCS_ROOT, CONTENT_DIRECTORY);
  const files = (await readdir(contentRoot, {recursive: true})).filter((file) =>
    /\.mdx?$/.test(file),
  );
  const contentDocuments = await Promise.all(
    files.map(async (file) => {
      const source = await readFile(path.join(contentRoot, file), 'utf8');
      const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
      const filePath = path.posix.join(CONTENT_DIRECTORY, file.split(path.sep).join('/'));
      return {
        id: filePath.replace(/\.mdx?$/, ''),
        filePath,
        data: parseYaml(frontmatter) ?? {},
      };
    }),
  );

  const failures = contentDocuments.flatMap((page) => {
    const {unresolved} = resolveRelatedPages(page, contentDocuments);
    return unresolved.map((relatedPath) => `${page.filePath}: ${relatedPath}`);
  });

  assert.deepEqual(failures, []);
});
