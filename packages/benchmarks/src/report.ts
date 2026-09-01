import {mkdir, writeFile} from 'node:fs/promises';
import {arch, cpus, platform, release} from 'node:os';
import {join} from 'node:path';

import type {BenchmarkCategory, BenchmarkLibrary, BenchmarkReport, BenchmarkResult} from './types';

export interface CreateBenchmarkReportOptions {
  readonly workspaceRoot: string;
  readonly libraries: readonly BenchmarkLibrary[];
  readonly results: readonly BenchmarkResult[];
  readonly checksum: number;
  readonly samples: number;
  readonly warmupStaticPasses: number;
  readonly warmupExhaustivePasses: number;
  readonly staticFixtureCount: number;
  readonly staticMultipliers: readonly number[];
  readonly exhaustiveFixtureCount: number;
  readonly svgPixelsPerModule: number;
  readonly svgQuietZoneModules: number;
  readonly stylingFixtureCount: number;
  readonly styledMultipliers: readonly number[];
  readonly generatedAt?: string;
}

export function createBenchmarkReport(options: CreateBenchmarkReportOptions): BenchmarkReport {
  const cpuList = cpus();

  return {
    schemaVersion: 5,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    environment: {
      node: process.version,
      platform: platform(),
      release: release(),
      architecture: arch(),
      cpuModel: cpuList[0]?.model ?? 'unknown',
      cpuCount: cpuList.length,
    },
    libraries: Object.fromEntries(
      options.libraries.map((library) => [library.id, library.version]),
    ) as BenchmarkReport['libraries'],
    configuration: {
      samples: options.samples,
      warmupStaticPasses: options.warmupStaticPasses,
      warmupExhaustivePasses: options.warmupExhaustivePasses,
      staticFixtureCount: options.staticFixtureCount,
      staticMultipliers: options.staticMultipliers,
      exhaustiveFixtureCount: options.exhaustiveFixtureCount,
      svg: {
        pixelsPerModule: options.svgPixelsPerModule,
        quietZoneModules: options.svgQuietZoneModules,
      },
      styledSvg: {
        fixtureCount: options.stylingFixtureCount,
        multipliers: options.styledMultipliers,
        dimensionsFromFixtures: true,
        automaticMaskSelection: true,
      },
    },
    results: options.results,
    checksum: options.checksum,
  };
}

export function serializeBenchmarkReport(report: BenchmarkReport): string {
  return `${JSON.stringify(report, undefined, 2)}\n`;
}

export async function writeBenchmarkReport(
  workspaceRoot: string,
  report: BenchmarkReport,
): Promise<string> {
  const outputDirectory = join(workspaceRoot, 'benchmark-results');
  const outputPath = join(outputDirectory, 'latest.json');
  await mkdir(outputDirectory, {recursive: true});
  await writeFile(outputPath, serializeBenchmarkReport(report), 'utf8');
  return outputPath;
}

export function printBenchmarkResults(results: readonly BenchmarkResult[]): void {
  const categories = [
    ['matrix', 'Matrix generation'],
    ['automatic', 'Automatic matrix generation'],
    ['svg', 'SVG generation'],
    ['styled-svg', 'Styled SVG generation'],
  ] as const satisfies readonly (readonly [BenchmarkCategory, string])[];

  for (const [category, title] of categories) {
    console.log(`\n${title}`);
    console.table(
      results
        .filter((result) => result.category === category)
        .map((result) => ({
          Workload: result.workloadLabel,
          'QRs/sample': result.qrCodesPerSample.toLocaleString('en-US'),
          Library: `${result.libraryLabel} v${result.libraryVersion}`,
          'Median (ms)': result.medianMs.toFixed(3),
          'Min–max (ms)': `${result.minMs.toFixed(3)}–${result.maxMs.toFixed(3)}`,
          'QR/s': Math.round(result.qrCodesPerSecond).toLocaleString('en-US'),
        })),
    );
  }
}
