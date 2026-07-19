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
  qrCodesPerSample: 16,
  libraryId: 'qrcodesdk',
  libraryLabel: 'QRCodeSDK',
  libraryVersion: '1.2.3',
  samplesMs: [2, 1, 3, 2, 1, 3],
  medianMs: 2,
  minMs: 1,
  maxMs: 3,
  qrCodesPerSecond: 8000,
  timeVsQRCodeSDK: 1,
};
const REPORT = {
  schemaVersion: 2,
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
    'qrcode-generator-default': '2.0.4',
    'qrcode-generator': '2.0.4',
    'qrcode-generator-utf8': '2.0.4',
  },
  configuration: {
    samples: 6,
    warmupStaticPasses: 5,
    warmupExhaustivePasses: 1,
    staticFixtureCount: 16,
    staticMultipliers: [1],
    exhaustiveFixtureCount: 3840,
    svg: {
      pixelsPerModule: 8,
      quietZoneModules: 4,
    },
  },
  results: [
    {...RESULT, category: 'matrix'},
    {
      ...RESULT,
      category: 'matrix',
      libraryId: 'qrcode-generator-default',
      libraryLabel: 'qrcode-generator (default)',
      libraryVersion: '2.0.4',
    },
    {
      ...RESULT,
      category: 'matrix',
      libraryId: 'qrcode-generator',
      libraryLabel: 'qrcode-generator (TextEncoder)',
      libraryVersion: '2.0.4',
    },
    {
      ...RESULT,
      category: 'matrix',
      libraryId: 'qrcode-generator-utf8',
      libraryLabel: 'qrcode-generator (bundled UTF-8)',
      libraryVersion: '2.0.4',
    },
    {...RESULT, category: 'svg', medianMs: 4, qrCodesPerSecond: 4000},
  ],
  checksum: 123,
};

test('generates performance metadata and markdown tables', async () => {
  const markdown = await generatePerformancePage(REPORT, {
    inputPath: '/workspace/benchmark-results/latest.json',
    outputPath: '/workspace/apps/docs/src/content/docs/guides/performance.md',
    workspaceRoot: '/workspace',
  });

  assert.match(markdown, /^---\ntitle: Performance\n/);
  assert.match(markdown, /Generated from benchmark-results\/latest\.json/);
  assert.match(markdown, /pnpm turbo run generate-performance --filter=docs/);
  assert.match(markdown, /skips automatic mask evaluation/);
  assert.match(markdown, /default converter truncates UTF-16 code units/);
  assert.match(
    markdown,
    /6 timed samples after 5 static warm-up passes and 1 exhaustive warm-up pass/,
  );
  assert.match(markdown, /## Matrix generation/);
  assert.match(markdown, /## SVG generation/);
  assert.match(markdown, /\| Static fixtures ×1 \|\s+16 \| QRCodeSDK v1\.2\.3\s+\|\s+2\.000/);
  assert.match(markdown, /\| Static fixtures ×1 \|\s+16 \| QRCodeSDK v1\.2\.3\s+\|\s+4\.000/);
  assert.match(markdown, /qrcode-generator \(default\) v2\.0\.4/);
  assert.match(markdown, /qrcode-generator \(TextEncoder\) v2\.0\.4/);
  assert.match(markdown, /qrcode-generator \(bundled UTF-8\) v2\.0\.4/);
  assert.match(markdown, /\|\s+8,000 \|\s+1\.00× \|/);
});

test('rejects unsupported or incomplete benchmark reports', () => {
  assert.throws(
    () => validateBenchmarkReport({...REPORT, schemaVersion: 1}),
    /Unsupported benchmark schema version: 1/,
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
