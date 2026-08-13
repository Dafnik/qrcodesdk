import assert from 'node:assert/strict';
import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {test} from 'node:test';

import {assertReadmeCurrent, generateReadme} from './generate-readmes.mjs';

const GENERATE_COMMAND = 'pnpm turbo run generate-readmes --filter=docs';
const GENERATE_INSTRUCTION = `Run \`${GENERATE_COMMAND}\` to update`;

test('generates README banners and stale-file errors with the Turbo command', async (context) => {
  const docsRoot = await mkdtemp(path.join(tmpdir(), 'qrcodesdk-readmes-'));
  const contentRoot = path.join(docsRoot, 'src/content/docs');
  const sourceDirectory = path.join(contentRoot, 'packages');
  const source = path.join(sourceDirectory, 'example.mdx');
  const output = path.join(docsRoot, 'README.md');

  context.after(() => rm(docsRoot, {force: true, recursive: true}));

  await mkdir(sourceDirectory, {recursive: true});
  await writeFile(
    source,
    `---
title: '@example/package'
description: Example package.
packageName: '@example/package'
related: []
---

import PackageComponents from './package-components.astro';

Example package documentation.

<PackageComponents className={true} selector={true} />
`,
  );

  const {content} = await generateReadme(
    {
      id: 'example',
      source: 'src/content/docs/packages/example.mdx',
      output: 'README.md',
      codeLanguage: 'ts',
    },
    {contentRoot, docsRoot, workspaceRoot: docsRoot},
  );

  assert.ok(content.includes(GENERATE_INSTRUCTION));
  assert.ok(content.includes('`QRCodeSVG`'));
  assert.ok(content.includes('`qrcode-svg`'));
  assert.ok(content.includes('`className`'));
  assert.ok(content.includes('`string \\| number`'));
  await assert.rejects(assertReadmeCurrent(content, output, docsRoot), {
    message: `README.md is stale. Run \`${GENERATE_COMMAND}\`.`,
  });

  await writeFile(output, content);
  await assert.doesNotReject(assertReadmeCurrent(content, output, docsRoot));
});
