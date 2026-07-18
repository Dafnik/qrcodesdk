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
  samplesMs: [2, 1, 3],
  medianMs: 2,
  minMs: 1,
  maxMs: 3,
  qrCodesPerSecond: 8000,
  timeVsQRCodeSDK: 1,
};
const REPORT = {
  schemaVersion: 1,
  generatedAt: '2026-07-17T21:07:54.996Z',
  gitRevision: 'abc123',
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
  },
  configuration: {
    samples: 3,
    warmupStaticPasses: 5,
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
  assert.match(markdown, /Git revision: `abc123`/);
  assert.match(markdown, /## Matrix generation/);
  assert.match(markdown, /## SVG generation/);
  assert.match(markdown, /\| Static fixtures ×1 \|\s+16 \| QRCodeSDK v1\.2\.3 \|\s+2\.000/);
  assert.match(markdown, /\| Static fixtures ×1 \|\s+16 \| QRCodeSDK v1\.2\.3 \|\s+4\.000/);
  assert.match(markdown, /\|\s+8,000 \|\s+1\.00× \|/);
});

test('rejects unsupported or incomplete benchmark reports', () => {
  assert.throws(
    () => validateBenchmarkReport({...REPORT, schemaVersion: 2}),
    /Unsupported benchmark schema version: 2/,
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
