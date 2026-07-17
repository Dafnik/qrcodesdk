import {QR_CODE_TEST_FIXTURES, TOTAL_QR_CODE_COMBINATIONS} from '@repo/core-testing';
import {fileURLToPath} from 'node:url';

import {BENCHMARK_ADAPTERS, SVG_PIXELS_PER_MODULE, SVG_QUIET_ZONE_MODULES} from './adapters';
import {createBenchmarkReport, printBenchmarkResults, writeBenchmarkReport} from './report';
import {executeWorkload, rotateAdapters, timedWorkload} from './runner';
import {calculateTimeRatio, summarizeSamples} from './statistics';
import type {
  BenchmarkCategory,
  BenchmarkLibraryId,
  BenchmarkResult,
  BenchmarkWorkload,
} from './types';
import {STATIC_MULTIPLIERS, createBenchmarkWorkloads} from './workloads';

const SAMPLE_COUNT = 5;
const WARMUP_STATIC_PASSES = 5;
const WORKSPACE_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const CATEGORIES = ['matrix', 'svg'] as const satisfies readonly BenchmarkCategory[];

async function main(): Promise<void> {
  const workloads = createBenchmarkWorkloads();
  const warmupWorkload: BenchmarkWorkload = {
    id: 'warmup',
    label: 'Warmup',
    fixtures: QR_CODE_TEST_FIXTURES,
    repetitions: WARMUP_STATIC_PASSES,
    qrCodesPerSample: QR_CODE_TEST_FIXTURES.length * WARMUP_STATIC_PASSES,
  };
  const samples = new Map<string, number[]>();
  const results: BenchmarkResult[] = [];
  let checksum = 0;

  console.log(
    `Warming ${String(BENCHMARK_ADAPTERS.length)} libraries with ${String(warmupWorkload.qrCodesPerSample)} QR codes per category…`,
  );
  for (const category of CATEGORIES) {
    for (const adapter of BENCHMARK_ADAPTERS) {
      checksum += executeWorkload(adapter, category, warmupWorkload);
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
          const key = `${category}:${workload.id}:${adapter.id}`;
          const adapterSamples = samples.get(key) ?? [];
          adapterSamples.push(measurement.elapsedMs);
          samples.set(key, adapterSamples);
        }
      }

      const summaries = new Map<BenchmarkLibraryId, ReturnType<typeof summarizeSamples>>();
      for (const adapter of BENCHMARK_ADAPTERS) {
        const adapterSamples = samples.get(`${category}:${workload.id}:${adapter.id}`) ?? [];
        summaries.set(adapter.id, summarizeSamples(adapterSamples, workload.qrCodesPerSample));
      }

      const sdkMedian = summaries.get('qrcodesdk')!.medianMs;
      for (const adapter of BENCHMARK_ADAPTERS) {
        const adapterSamples = samples.get(`${category}:${workload.id}:${adapter.id}`) ?? [];
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
