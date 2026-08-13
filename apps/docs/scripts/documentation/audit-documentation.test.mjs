import assert from 'node:assert/strict';
import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {test} from 'node:test';

import {auditDocumentationBuild, auditDocumentationSource} from './audit-documentation.mjs';

test('reports missing metadata, broken routes, removed routes, and duplicate sidebar entries', async (context) => {
  const contentRoot = await mkdtemp(path.join(tmpdir(), 'qrcodesdk-documentation-source-'));
  context.after(() => rm(contentRoot, {force: true, recursive: true}));

  await writeFile(
    path.join(contentRoot, 'index.mdx'),
    `---
title: Overview
docType: overview
related:
  - ./missing.md
---

[Old](/advanced/customize/) and [broken](/missing/).
`,
  );
  await writeFile(path.join(contentRoot, 'other.md'), '---\ntitle: Other\n---\n');

  const sidebar = [
    {
      label: 'Start here',
      items: [
        {label: 'Overview', slug: ''},
        {label: 'Choose', slug: 'getting-started/choose-your-setup'},
        {label: 'Playground', slug: 'playground'},
        {label: 'Overview again', slug: ''},
      ],
    },
  ];
  const {issues} = await auditDocumentationSource({contentRoot, sidebar});

  assert.ok(issues.some((issue) => issue.includes('missing or invalid docType')));
  assert.ok(issues.some((issue) => issue.includes('related page does not exist')));
  assert.ok(issues.some((issue) => issue.includes('links to a removed route')));
  assert.ok(issues.some((issue) => issue.includes('does not resolve to an authored route')));
  assert.ok(issues.some((issue) => issue.includes('duplicate route')));
});

test('reports stale canonical and sitemap routes', async (context) => {
  const distRoot = await mkdtemp(path.join(tmpdir(), 'qrcodesdk-documentation-build-'));
  context.after(() => rm(distRoot, {force: true, recursive: true}));

  await mkdir(path.join(distRoot, 'guides/current'), {recursive: true});
  await writeFile(
    path.join(distRoot, 'guides/current/index.html'),
    '<link rel="canonical" href="https://qrcodesdk.dev/advanced/customize/">',
  );
  await writeFile(
    path.join(distRoot, 'sitemap-0.xml'),
    '<urlset><url><loc>https://qrcodesdk.dev/advanced/customize/</loc></url></urlset>',
  );

  const {issues} = await auditDocumentationBuild({
    authoredRoutes: new Set(['/guides/current/']),
    distRoot,
    siteOrigin: 'https://qrcodesdk.dev',
  });

  assert.ok(issues.some((issue) => issue.includes('canonical points to')));
  assert.ok(issues.some((issue) => issue.includes('canonical exposes')));
  assert.ok(issues.some((issue) => issue.includes('sitemap: route is outside')));
  assert.ok(issues.some((issue) => issue.includes('sitemap: missing built route')));
});
