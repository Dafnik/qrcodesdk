import assert from 'node:assert/strict';
import {mkdir, mkdtemp, readFile, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  assertReadmeCurrent,
  generateReadme,
  generateReadmes,
  validateReadmeMappings,
} from './generate-readmes.mjs';
import {README_MAPPINGS} from './readme-mappings.mjs';

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = path.resolve(SCRIPT_DIRECTORY, '../..');
const SOURCE_PATH = path.join(DOCS_ROOT, 'src/content/docs/libs/angular.mdx');
const ANGULAR_MAPPING = README_MAPPINGS[0];

test('generates a GitHub README from the canonical Angular MDX', async () => {
  const {content: readme} = await generateReadme(ANGULAR_MAPPING);
  const {content: secondReadme} = await generateReadme(ANGULAR_MAPPING);

  assert.equal(readme, secondReadme);
  assert.match(readme, /^<!-- Generated from apps\/docs\/src\/content\/docs\/libs\/angular\.mdx\./);
  assert.match(readme, /# @qrcodesdk\/angular/);
  assert.match(readme, /badge\/version\/@qrcodesdk\/angular/);
  assert.match(readme, /https:\/\/qrcodesdk\.dev\/playground\/\?pkg=angular/);
  assert.match(readme, /npm install @qrcodesdk\/angular @qrcodesdk\/core @qrcodesdk\/browser/);
  assert.match(readme, /pnpm add @qrcodesdk\/angular @qrcodesdk\/core @qrcodesdk\/browser/);
  assert.match(readme, /<summary>Other package managers<\/summary>/);
  assert.match(readme, /vp add @qrcodesdk\/angular/);
  assert.match(readme, /deno add @qrcodesdk\/angular/);
  assert.match(readme, /bun add @qrcodesdk\/angular/);
  assert.match(readme, /yarn add @qrcodesdk\/angular/);
  assert.match(readme, /export class QRCodeSVGExample/);
  assert.match(readme, /export class QRCodeImageExample/);
  assert.match(readme, /export class QRCodeCanvasExample/);
  assert.match(readme, /export class QRCodeDownloadImageExample/);
  assert.match(readme, /## Public API/);
  assert.match(readme, /https:\/\/qrcodesdk\.dev\/guides\/customize\//);
  assert.doesNotMatch(readme, /^---$/m);
  assert.doesNotMatch(readme, /^import .*\.astro';$/m);
  assert.doesNotMatch(readme, /<QRCode(?:SVG|Image|Canvas|DownloadImage) \/>/);
});

test('rejects unknown and dynamic MDX components', async () => {
  const fixtureRoot = await mkdtemp(path.join(tmpdir(), 'qrcodesdk-readme-'));
  const contentRoot = path.join(fixtureRoot, 'content');
  const unknownPath = path.join(contentRoot, 'unknown.mdx');
  const dynamicPath = path.join(contentRoot, 'dynamic.mdx');
  const outputPath = path.join(fixtureRoot, 'README.md');
  const frontmatter = `---
title: Test
packageName: '@qrcodesdk/test'
---
`;

  await mkdir(contentRoot, {recursive: true});
  await writeFile(unknownPath, `${frontmatter}\n<Unknown />\n`);
  await writeFile(
    dynamicPath,
    `${frontmatter}\nimport PackageManagerTabs from './tabs.astro';\n\n<PackageManagerTabs packages={packages} mode="add" />\n`,
  );

  await assert.rejects(
    generateReadme(
      {
        id: 'unknown',
        source: unknownPath,
        output: outputPath,
        codeLanguage: 'ts',
      },
      {
        docsRoot: fixtureRoot,
        workspaceRoot: fixtureRoot,
        contentRoot,
        siteUrl: 'https://example.com',
      },
    ),
    /Unsupported MDX component <Unknown>/,
  );
  await assert.rejects(
    generateReadme(
      {
        id: 'dynamic',
        source: dynamicPath,
        output: outputPath,
        codeLanguage: 'ts',
      },
      {
        docsRoot: fixtureRoot,
        workspaceRoot: fixtureRoot,
        contentRoot,
        siteUrl: 'https://example.com',
      },
    ),
    /Dynamic MDX expressions are not supported/,
  );
});

test('generates multiple framework mappings with mapping-specific code languages', async () => {
  const fixtureRoot = await mkdtemp(path.join(tmpdir(), 'qrcodesdk-readme-mappings-'));
  const mappings = [
    ANGULAR_MAPPING,
    {
      id: 'react',
      source: 'src/content/docs/libs/react.mdx',
      output: path.join(fixtureRoot, 'react.md'),
      codeLanguage: 'tsx',
    },
  ];
  const generated = await generateReadmes(mappings);

  assert.equal(generated.length, 2);
  assert.equal(generated[0].mapping.id, 'angular');
  assert.equal(generated[1].mapping.id, 'react');
  assert.match(generated[1].content, /```tsx\nimport \{\s*QRCodeSVG\s*\}/);
  assert.match(generated[1].content, /export default function QRCodeSVGExample/);
});

test('rejects duplicate and incomplete mappings', () => {
  assert.throws(
    () => validateReadmeMappings([ANGULAR_MAPPING, {...ANGULAR_MAPPING}]),
    /mapping id angular is duplicated/,
  );
  assert.throws(
    () =>
      validateReadmeMappings([
        {
          id: 'react',
          source: 'src/content/docs/libs/react.mdx',
          output: '../../packages/react/README.md',
        },
      ]),
    /codeLanguage must be a non-empty string/,
  );
});

test('detects a stale generated README', async () => {
  const fixtureRoot = await mkdtemp(path.join(tmpdir(), 'qrcodesdk-readme-check-'));
  const outputPath = path.join(fixtureRoot, 'README.md');

  await writeFile(outputPath, 'stale\n');
  await assert.rejects(assertReadmeCurrent('current\n', outputPath), /is stale/);
  await writeFile(outputPath, 'current\n');
  await assert.doesNotReject(assertReadmeCurrent('current\n', outputPath));

  assert.equal(await readFile(outputPath, 'utf8'), 'current\n');
});

test('reads the expected canonical source', async () => {
  const source = await readFile(SOURCE_PATH, 'utf8');
  assert.match(source, /title: '@qrcodesdk\/angular'/);
});
