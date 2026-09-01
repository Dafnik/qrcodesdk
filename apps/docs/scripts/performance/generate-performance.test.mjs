import assert from 'node:assert/strict';
import {mkdtemp, readFile, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {test} from 'node:test';

import {
  assertPerformancePageCurrent,
  generatePerformancePage,
  validateBenchmarkReport,
} from './generate-performance.mjs';

const RESULT = {
  workloadId: 'static-1',
  workloadLabel: 'Static fixtures ×1',
  qrCodesPerSample: 17,
  libraryId: 'qrcodesdk',
  libraryLabel: 'QRCodeSDK',
  libraryVersion: '1.2.3',
  samplesMs: [2, 1, 3, 2, 1],
  medianMs: 2,
  minMs: 1,
  maxMs: 3,
  qrCodesPerSecond: 8500,
};
const REPORT = {
  schemaVersion: 5,
  generatedAt: '2026-07-17T21:07:54.996Z',
  environment: {
    node: 'v24.18.0',
    platform: 'darwin',
    release: '25.5.0',
    architecture: 'arm64',
    cpuModel: 'Apple M2 Pro',
    cpuCount: 12,
  },
  libraries: {
    qrcodesdk: '1.2.3',
    qrcode: '1.5.4',
    'qrcode-generator': '2.0.4',
    'qr-code-styling': '1.9.2',
  },
  configuration: {
    samples: 3,
    warmupStaticPasses: 5,
    warmupExhaustivePasses: 1,
    staticFixtureCount: 17,
    staticMultipliers: [1],
    exhaustiveFixtureCount: 3840,
    svg: {
      pixelsPerModule: 8,
      quietZoneModules: 4,
    },
    styledSvg: {
      fixtureCount: 60,
      multipliers: [1, 10, 50],
      dimensionsFromFixtures: true,
      automaticMaskSelection: true,
    },
  },
  results: [
    {...RESULT, category: 'matrix'},
    {
      ...RESULT,
      category: 'matrix',
      libraryId: 'qrcode',
      libraryLabel: 'qrcode',
      libraryVersion: '1.5.4',
      qrCodesPerSecond: 12_000,
    },
    {
      ...RESULT,
      category: 'matrix',
      libraryId: 'qrcode-generator',
      libraryLabel: 'qrcode-generator',
      libraryVersion: '2.0.4',
      qrCodesPerSecond: 4_000,
    },
    {
      ...RESULT,
      category: 'matrix',
      workloadId: 'static-5',
      workloadLabel: 'Static fixtures ×5',
      qrCodesPerSample: 85,
      qrCodesPerSecond: 42_500,
    },
    {...RESULT, category: 'automatic'},
    {...RESULT, category: 'svg', medianMs: 4, qrCodesPerSecond: 4000},
    {
      ...RESULT,
      category: 'styled-svg',
      workloadId: 'styled-1',
      workloadLabel: 'Styled fixtures ×1',
      qrCodesPerSample: 60,
    },
    {
      ...RESULT,
      category: 'styled-svg',
      workloadId: 'styled-1',
      workloadLabel: 'Styled fixtures ×1',
      qrCodesPerSample: 60,
      libraryId: 'qr-code-styling',
      libraryLabel: 'qr-code-styling',
      libraryVersion: '1.9.2',
      qrCodesPerSecond: 1_000,
    },
  ],
  checksum: 123,
};

test('generates accessible Mermaid charts and collapsible exact benchmark tables', async () => {
  const markdown = await generatePerformancePage(REPORT, {
    inputPath: '/workspace/benchmark-results/latest.json',
    outputPath: '/workspace/apps/docs/src/content/docs/learn/performance.md',
    workspaceRoot: '/workspace',
  });

  assert.match(markdown, /^---\ntitle: Performance\n/);
  assert.match(markdown, /docType: concept/);
  assert.match(markdown, /Generated from benchmark-results\/latest\.json/);
  assert.match(markdown, /pnpm turbo run generate-performance --filter=docs/);
  assert.match(markdown, /skips automatic mask evaluation/);
  assert.match(markdown, /automatic matrix fixtures omit both options/);
  assert.match(markdown, /qrcode-generator\*\* using its stock text encoder/);
  assert.doesNotMatch(markdown, /TextEncoder|bundled UTF-8/);
  assert.match(markdown, /all 60 shared styling fixtures at 1, 10, 50 repetitions/);
  assert.match(markdown, /qr-code-styling\*\* has no public mask option/);
  assert.match(
    markdown,
    /3 timed samples after 5 static warm-up passes and 1 exhaustive warm-up pass/,
  );
  assert.match(markdown, /## Matrix generation/);
  assert.match(markdown, /## Automatic matrix generation/);
  assert.match(markdown, /## SVG generation/);
  assert.match(markdown, /## Styled SVG generation/);
  assert.equal(markdown.match(/```mermaid/g)?.length, 5);
  assert.match(markdown, /xychart horizontal/);
  assert.match(markdown, /showDataLabel: true/);
  assert.match(markdown, /showDataLabelOutsideBar: true/);
  assert.match(markdown, /accTitle: Matrix generation: Static fixtures ×1 — 17 QR codes\/sample/);
  assert.match(
    markdown,
    /accTitle: Automatic matrix generation: Static fixtures ×1 — 17 QR codes\/sample/,
  );
  assert.match(markdown, /accDescr: Throughput calculated from median time\./);
  assert.match(markdown, /Higher is better\./);
  assert.match(markdown, /x-axis "Library" \["qrcode", "QRCodeSDK", "qrcode-generator"\]/);
  assert.match(markdown, /x-axis "Library" \["QRCodeSDK", "qr-code-styling"\]/);
  assert.match(markdown, /y-axis "QR codes\/second" 0 --> 15000/);
  assert.match(markdown, /bar \[12000, 8500, 4000\]/);
  assert.ok(
    markdown.indexOf('title "Static fixtures ×1') < markdown.indexOf('title "Static fixtures ×5'),
  );
  assert.equal(markdown.match(/<summary>Exact benchmark data<\/summary>/g)?.length, 4);
  assert.match(markdown, /\| Static fixtures ×1 \|\s+17 \| QRCodeSDK v1\.2\.3\s+\|\s+2\.000/);
  assert.match(markdown, /\| Static fixtures ×1 \|\s+17 \| QRCodeSDK v1\.2\.3\s+\|\s+4\.000/);
  assert.match(markdown, /qrcode-generator v2\.0\.4/);
  assert.match(markdown, /qr-code-styling v1\.9\.2/);
  assert.match(markdown, /\|\s+8,500 \|/);
  assert.doesNotMatch(markdown, /Time ÷ QRCodeSDK|timeVsQRCodeSDK|1\.00×/);
});

test('rejects unsupported or incomplete benchmark reports', () => {
  assert.throws(
    () => validateBenchmarkReport({...REPORT, schemaVersion: 4}),
    /Unsupported benchmark schema version: 4/,
  );
  assert.throws(() => validateBenchmarkReport({...REPORT, results: []}), /non-empty array/);
  assert.throws(
    () =>
      validateBenchmarkReport({
        ...REPORT,
        configuration: {...REPORT.configuration, svg: undefined},
      }),
    /configuration\.svg must be an object/,
  );
  assert.throws(
    () =>
      validateBenchmarkReport({
        ...REPORT,
        configuration: {...REPORT.configuration, warmupExhaustivePasses: undefined},
      }),
    /configuration\.warmupExhaustivePasses must be a finite number/,
  );
  assert.throws(
    () =>
      validateBenchmarkReport({
        ...REPORT,
        configuration: {...REPORT.configuration, styledSvg: undefined},
      }),
    /configuration\.styledSvg must be an object/,
  );
});

test('detects a stale generated performance page', async () => {
  const fixtureRoot = await mkdtemp(path.join(tmpdir(), 'qrcodesdk-performance-'));
  const outputPath = path.join(fixtureRoot, 'performance.md');

  await writeFile(outputPath, 'stale\n');
  await assert.rejects(assertPerformancePageCurrent('current\n', outputPath), /is stale/);
  await writeFile(outputPath, 'current\n');
  await assert.doesNotReject(assertPerformancePageCurrent('current\n', outputPath));
  assert.equal(await readFile(outputPath, 'utf8'), 'current\n');
});
