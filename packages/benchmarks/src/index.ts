import {QR_CODE_TEST_FIXTURES, TOTAL_QR_CODE_COMBINATIONS} from '@repo/core-testing';
import {fileURLToPath} from 'node:url';

import {BENCHMARK_ADAPTERS, SVG_PIXELS_PER_MODULE, SVG_QUIET_ZONE_MODULES} from './adapters';
import {createBenchmarkReport, printBenchmarkResults, writeBenchmarkReport} from './report';
import {executeWorkload, rotateAdapters, timedWorkload} from './runner';
import {calculateTimeRatio, summarizeSamples} from './statistics';
import type {BenchmarkCategory, BenchmarkLibraryId, BenchmarkResult} from './types';
import {
  BENCHMARK_SAMPLE_COUNT,
  STATIC_MULTIPLIERS,
  WARMUP_EXHAUSTIVE_PASSES,
  WARMUP_STATIC_PASSES,
  createAutomaticBenchmarkWarmupWorkloads,
  createAutomaticBenchmarkWorkloads,
  createBenchmarkWarmupWorkloads,
  createBenchmarkWorkloads,
} from './workloads';

const WORKSPACE_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
type BenchmarkSampleKey = `${BenchmarkCategory}:${string}:${BenchmarkLibraryId}`;

type BenchmarkSuite = {
  readonly category: BenchmarkCategory;
  readonly workloads: ReturnType<typeof createBenchmarkWorkloads>;
  readonly warmupWorkloads: ReturnType<typeof createBenchmarkWarmupWorkloads>;
};

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
  const suites: readonly BenchmarkSuite[] = [
    {category: 'matrix', workloads, warmupWorkloads},
    {
      category: 'automatic',
      workloads: createAutomaticBenchmarkWorkloads(),
      warmupWorkloads: createAutomaticBenchmarkWarmupWorkloads(),
    },
    {category: 'svg', workloads, warmupWorkloads},
  ];
  const samples = new Map<BenchmarkSampleKey, number[]>();
  const results: BenchmarkResult[] = [];
  let checksum = 0;

  for (const {category, warmupWorkloads: categoryWarmupWorkloads} of suites) {
    for (const workload of categoryWarmupWorkloads) {
      console.log(
        `[${category}] ${workload.label}: ${String(workload.qrCodesPerSample)} QR codes per library…`,
      );
      for (const adapter of BENCHMARK_ADAPTERS) {
        checksum += executeWorkload(adapter, category, workload);
      }
    }
  }

  for (const {category, workloads: categoryWorkloads} of suites) {
    for (const workload of categoryWorkloads) {
      for (let sampleIndex = 0; sampleIndex < BENCHMARK_SAMPLE_COUNT; sampleIndex += 1) {
        const adapters = rotateAdapters(BENCHMARK_ADAPTERS, sampleIndex);
        console.log(
          `[${category}] ${workload.label}: sample ${String(sampleIndex + 1)}/${String(BENCHMARK_SAMPLE_COUNT)} (${adapters.map(({label}) => label).join(' → ')})`,
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
    samples: BENCHMARK_SAMPLE_COUNT,
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
