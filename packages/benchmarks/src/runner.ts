import type {BenchmarkAdapter, BenchmarkCategory, BenchmarkWorkload} from './types';

export function rotateAdapters(
  adapters: readonly BenchmarkAdapter[],
  offset: number,
): BenchmarkAdapter[] {
  const index = offset % adapters.length;
  return [...adapters.slice(index), ...adapters.slice(0, index)];
}

export function executeWorkload(
  adapter: BenchmarkAdapter,
  category: BenchmarkCategory,
  workload: BenchmarkWorkload,
): number {
  adapter.prepare?.();
  return executePreparedWorkload(adapter, category, workload);
}

function executePreparedWorkload(
  adapter: BenchmarkAdapter,
  category: BenchmarkCategory,
  workload: BenchmarkWorkload,
): number {
  const operation = category === 'matrix' ? adapter.matrix : adapter.svg;
  let checksum = 0;

  for (let repetition = 0; repetition < workload.repetitions; repetition += 1) {
    for (const fixture of workload.fixtures) {
      checksum += operation(fixture);
    }
  }

  return checksum;
}

export function timedWorkload(
  adapter: BenchmarkAdapter,
  category: BenchmarkCategory,
  workload: BenchmarkWorkload,
): {readonly elapsedMs: number; readonly checksum: number} {
  adapter.prepare?.();
  const start = process.hrtime.bigint();
  const checksum = executePreparedWorkload(adapter, category, workload);
  const elapsedNanoseconds = process.hrtime.bigint() - start;

  return {
    elapsedMs: Number(elapsedNanoseconds) / 1_000_000,
    checksum,
  };
}
