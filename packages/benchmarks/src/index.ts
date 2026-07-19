import {QR_CODE_TEST_FIXTURES, TOTAL_QR_CODE_COMBINATIONS} from '@repo/core-testing';
import {fileURLToPath} from 'node:url';

import {BENCHMARK_ADAPTERS, SVG_PIXELS_PER_MODULE, SVG_QUIET_ZONE_MODULES} from './adapters';
import {createBenchmarkReport, printBenchmarkResults, writeBenchmarkReport} from './report';
import {executeWorkload, rotateAdapters, timedWorkload} from './runner';
import {calculateTimeRatio, summarizeSamples} from './statistics';
import type {BenchmarkCategory, BenchmarkLibraryId, BenchmarkResult} from './types';
import {
  STATIC_MULTIPLIERS,
  WARMUP_EXHAUSTIVE_PASSES,
  WARMUP_STATIC_PASSES,
  createBenchmarkWarmupWorkloads,
  createBenchmarkWorkloads,
} from './workloads';

const SAMPLE_COUNT = 5;
const WORKSPACE_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const CATEGORIES = ['matrix', 'svg'] as const satisfies readonly BenchmarkCategory[];
type BenchmarkSampleKey = `${BenchmarkCategory}:${string}:${BenchmarkLibraryId}`;

function benchmarkSampleKey(
  category: BenchmarkCategory,
  workloadId: string,
  libraryId: BenchmarkLibraryId,
): BenchmarkSampleKey {
  return `${category}:${workloadId}:${libraryId}`;
}

async function main(): Promise<void> {
  const workloads = createBenchmarkWorkloads();
  const warmupWorkloads = createBenchmarkWarmupWorkloads();
  const samples = new Map<BenchmarkSampleKey, number[]>();
  const results: BenchmarkResult[] = [];
  let checksum = 0;

  for (const category of CATEGORIES) {
    for (const workload of warmupWorkloads) {
      console.log(
        `[${category}] ${workload.label}: ${String(workload.qrCodesPerSample)} QR codes per library…`,
      );
      for (const adapter of BENCHMARK_ADAPTERS) {
        checksum += executeWorkload(adapter, category, workload);
      }
    }
  }

  for (const category of CATEGORIES) {
    for (const workload of workloads) {
      for (let sampleIndex = 0; sampleIndex < SAMPLE_COUNT; sampleIndex += 1) {
        const adapters = rotateAdapters(BENCHMARK_ADAPTERS, sampleIndex);
        console.log(
          `[${category}] ${workload.label}: sample ${String(sampleIndex + 1)}/${String(SAMPLE_COUNT)} (${adapters.map(({label}) => label).join(' → ')})`,
        );

        for (const adapter of adapters) {
          const measurement = timedWorkload(adapter, category, workload);
          checksum += measurement.checksum;
          const key = benchmarkSampleKey(category, workload.id, adapter.id);
          const adapterSamples = samples.get(key) ?? [];
          adapterSamples.push(measurement.elapsedMs);
          samples.set(key, adapterSamples);
        }
      }

      const summaries = new Map<BenchmarkLibraryId, ReturnType<typeof summarizeSamples>>();
      for (const adapter of BENCHMARK_ADAPTERS) {
        const adapterSamples =
          samples.get(benchmarkSampleKey(category, workload.id, adapter.id)) ?? [];
        summaries.set(adapter.id, summarizeSamples(adapterSamples, workload.qrCodesPerSample));
      }

      const sdkMedian = summaries.get('qrcodesdk')!.medianMs;
      for (const adapter of BENCHMARK_ADAPTERS) {
        const adapterSamples =
          samples.get(benchmarkSampleKey(category, workload.id, adapter.id)) ?? [];
        const summary = summaries.get(adapter.id)!;
        results.push({
          category,
          workloadId: workload.id,
          workloadLabel: workload.label,
          qrCodesPerSample: workload.qrCodesPerSample,
          libraryId: adapter.id,
          libraryLabel: adapter.label,
          libraryVersion: adapter.version,
          samplesMs: adapterSamples,
          ...summary,
          timeVsQRCodeSDK: calculateTimeRatio(summary.medianMs, sdkMedian),
        });
      }
    }
  }

  const report = createBenchmarkReport({
    workspaceRoot: WORKSPACE_ROOT,
    adapters: BENCHMARK_ADAPTERS,
    results,
    checksum,
    samples: SAMPLE_COUNT,
    warmupStaticPasses: WARMUP_STATIC_PASSES,
    warmupExhaustivePasses: WARMUP_EXHAUSTIVE_PASSES,
    staticFixtureCount: QR_CODE_TEST_FIXTURES.length,
    staticMultipliers: STATIC_MULTIPLIERS,
    exhaustiveFixtureCount: TOTAL_QR_CODE_COMBINATIONS,
    svgPixelsPerModule: SVG_PIXELS_PER_MODULE,
    svgQuietZoneModules: SVG_QUIET_ZONE_MODULES,
  });

  printBenchmarkResults(results);
  const outputPath = await writeBenchmarkReport(WORKSPACE_ROOT, report);
  console.log(`\nJSON results: ${outputPath}`);
  console.log(`Consumption checksum: ${String(checksum)}`);
}

await main();
