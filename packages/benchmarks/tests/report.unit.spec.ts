import {describe, expect, test} from 'vitest';

import {createBenchmarkReport, serializeBenchmarkReport} from '../src/report';
import type {BenchmarkLibrary, BenchmarkResult} from '../src/types';

const libraries: BenchmarkLibrary[] = [
  ['qrcodesdk', 'QRCodeSDK'],
  ['qrcode', 'qrcode'],
  ['qrcode-generator', 'qrcode-generator'],
  ['qr-code-styling', 'qr-code-styling'],
].map(([id, label]) => ({
  id: id as BenchmarkLibrary['id'],
  label: label!,
  version: '1.0.0',
}));

const result: BenchmarkResult = {
  category: 'matrix',
  workloadId: 'static-1',
  workloadLabel: 'Static fixtures ×1',
  qrCodesPerSample: 17,
  libraryId: 'qrcodesdk',
  libraryLabel: 'QRCodeSDK',
  libraryVersion: '1.0.0',
  samplesMs: [1, 2, 3],
  medianMs: 3,
  minMs: 1,
  maxMs: 5,
  qrCodesPerSecond: 17_000 / 3,
};

describe('benchmark report', () => {
  test('serializes stable metadata, configuration, samples, and checksum fields', () => {
    const report = createBenchmarkReport({
      workspaceRoot: process.cwd(),
      libraries,
      results: [result, {...result, category: 'styled-svg', libraryId: 'qr-code-styling'}],
      checksum: 123,
      samples: 3,
      warmupStaticPasses: 5,
      warmupExhaustivePasses: 1,
      staticFixtureCount: 17,
      staticMultipliers: [1, 5, 10, 100],
      exhaustiveFixtureCount: 3_840,
      svgPixelsPerModule: 8,
      svgQuietZoneModules: 4,
      stylingFixtureCount: 60,
      styledMultipliers: [1, 10, 50],
      generatedAt: '2026-07-17T00:00:00.000Z',
    });
    const serialized = serializeBenchmarkReport(report);
    const parsed = JSON.parse(serialized) as typeof report;

    expect(parsed).toMatchObject({
      schemaVersion: 5,
      generatedAt: '2026-07-17T00:00:00.000Z',
      libraries: {
        qrcodesdk: '1.0.0',
        qrcode: '1.0.0',
        'qrcode-generator': '1.0.0',
        'qr-code-styling': '1.0.0',
      },
      configuration: {
        samples: 3,
        warmupStaticPasses: 5,
        warmupExhaustivePasses: 1,
        exhaustiveFixtureCount: 3_840,
        svg: {pixelsPerModule: 8, quietZoneModules: 4},
        styledSvg: {
          fixtureCount: 60,
          multipliers: [1, 10, 50],
          dimensionsFromFixtures: true,
          automaticMaskSelection: true,
        },
      },
      checksum: 123,
    });
    expect(parsed.environment.node).toBe(process.version);
    expect(parsed.results[0]?.samplesMs).toEqual([1, 2, 3]);
    expect(serialized.endsWith('\n')).toBe(true);
  });
});
