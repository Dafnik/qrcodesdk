import {describe, expect, test} from 'vitest';

import {createBenchmarkReport, serializeBenchmarkReport} from '../src/report';
import type {BenchmarkAdapter, BenchmarkResult} from '../src/types';

const adapters: BenchmarkAdapter[] = [
  ['qrcodesdk', 'QRCodeSDK'],
  ['qrcode', 'qrcode'],
  ['qrcode-generator-default', 'qrcode-generator (default)'],
  ['qrcode-generator', 'qrcode-generator (TextEncoder)'],
  ['qrcode-generator-utf8', 'qrcode-generator (bundled UTF-8)'],
].map(([id, label]) => ({
  id: id as BenchmarkAdapter['id'],
  label: label!,
  version: '1.0.0',
  matrix: () => 1,
  svg: () => 1,
}));

const result: BenchmarkResult = {
  category: 'matrix',
  workloadId: 'static-1',
  workloadLabel: 'Static fixtures ×1',
  qrCodesPerSample: 16,
  libraryId: 'qrcodesdk',
  libraryLabel: 'QRCodeSDK',
  libraryVersion: '1.0.0',
  samplesMs: [1, 2, 3, 4, 5, 6],
  medianMs: 3.5,
  minMs: 1,
  maxMs: 6,
  qrCodesPerSecond: 16_000 / 3.5,
  timeVsQRCodeSDK: 1,
};

describe('benchmark report', () => {
  test('serializes stable metadata, configuration, samples, and checksum fields', () => {
    const report = createBenchmarkReport({
      workspaceRoot: process.cwd(),
      adapters,
      results: [result],
      checksum: 123,
      samples: 6,
      warmupStaticPasses: 5,
      warmupExhaustivePasses: 1,
      staticFixtureCount: 16,
      staticMultipliers: [1, 5, 10, 100, 500],
      exhaustiveFixtureCount: 3_840,
      svgPixelsPerModule: 8,
      svgQuietZoneModules: 4,
      generatedAt: '2026-07-17T00:00:00.000Z',
    });
    const serialized = serializeBenchmarkReport(report);
    const parsed = JSON.parse(serialized) as typeof report;

    expect(parsed).toMatchObject({
      schemaVersion: 2,
      generatedAt: '2026-07-17T00:00:00.000Z',
      libraries: {
        qrcodesdk: '1.0.0',
        qrcode: '1.0.0',
        'qrcode-generator': '1.0.0',
        'qrcode-generator-default': '1.0.0',
        'qrcode-generator-utf8': '1.0.0',
      },
      configuration: {
        samples: 6,
        warmupStaticPasses: 5,
        warmupExhaustivePasses: 1,
        exhaustiveFixtureCount: 3_840,
        svg: {pixelsPerModule: 8, quietZoneModules: 4},
      },
      checksum: 123,
    });
    expect(parsed.environment.node).toBe(process.version);
    expect(parsed.results[0]?.samplesMs).toEqual([1, 2, 3, 4, 5, 6]);
    expect(serialized.endsWith('\n')).toBe(true);
  });
});
