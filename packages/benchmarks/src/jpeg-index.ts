import {mkdir, writeFile} from 'node:fs/promises';
import {arch, cpus, platform, release} from 'node:os';
import {fileURLToPath} from 'node:url';

import qrcodeSDKPackage from '@qrcodesdk/core/package.json' with {type: 'json'};

import {
  JPEG_PIXELS_PER_MODULE,
  JPEG_QUALITY,
  JPEG_QUIET_ZONE_MODULES,
  JPEG_WARMUP_PASSES,
  createJPEGBenchmarkWorkloads,
  executeJPEGWorkload,
  timedJPEGWorkload,
} from './jpeg';
import {summarizeSamples} from './statistics';
import {BENCHMARK_SAMPLE_COUNT} from './workloads';

const workloads = createJPEGBenchmarkWorkloads();
let checksum = 0;

for (const workload of workloads) {
  checksum += executeJPEGWorkload({...workload, repetitions: JPEG_WARMUP_PASSES});
}

const results = workloads.map((workload) => {
  const samplesMs: number[] = [];
  for (let sample = 0; sample < BENCHMARK_SAMPLE_COUNT; sample += 1) {
    const measurement = timedJPEGWorkload(workload);
    samplesMs.push(measurement.elapsedMs);
    checksum += measurement.checksum;
  }
  const {version, color, image} = workload.fixtures[0]!;
  return {
    workloadId: workload.id,
    workloadLabel: workload.label,
    version,
    color,
    width: image.width,
    height: image.height,
    qrCodesPerSample: workload.qrCodesPerSample,
    samplesMs,
    ...summarizeSamples(samplesMs, workload.qrCodesPerSample),
  };
});

console.table(
  results.map((result) => ({
    Workload: result.workloadLabel,
    'QRs/sample': result.qrCodesPerSample,
    'Median (ms)': result.medianMs.toFixed(3),
    'Min–max (ms)': `${result.minMs.toFixed(3)}–${result.maxMs.toFixed(3)}`,
    'QR/s': Math.round(result.qrCodesPerSecond),
  })),
);

const cpuList = cpus();
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  libraryVersion: qrcodeSDKPackage.version,
  environment: {
    node: process.version,
    platform: platform(),
    release: release(),
    architecture: arch(),
    cpuModel: cpuList[0]?.model ?? 'unknown',
    cpuCount: cpuList.length,
  },
  options: {
    quality: JPEG_QUALITY,
    pixelsPerModule: JPEG_PIXELS_PER_MODULE,
    quietZoneModules: JPEG_QUIET_ZONE_MODULES,
    warmupPasses: JPEG_WARMUP_PASSES,
    samples: BENCHMARK_SAMPLE_COUNT,
    operation: 'encode-prepared-rgba',
  },
  results,
  checksum,
};
const outputDirectory = new URL('../../../benchmark-results/', import.meta.url);
const outputPath = new URL('latest-jpeg.json', outputDirectory);
await mkdir(outputDirectory, {recursive: true});
await writeFile(outputPath, `${JSON.stringify(report, undefined, 2)}\n`, 'utf8');
console.log(`\nJSON results: ${fileURLToPath(outputPath)}`);
console.log(`Consumption checksum: ${String(checksum)}`);
