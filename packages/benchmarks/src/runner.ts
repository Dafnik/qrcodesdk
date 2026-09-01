import type {
  BenchmarkAdapter,
  BenchmarkWorkload,
  StandardBenchmarkCategory,
  StyledSVGAdapter,
} from './types';

export function rotateAdapters<TAdapter>(
  adapters: readonly TAdapter[],
  offset: number,
): TAdapter[] {
  const index = offset % adapters.length;
  return [...adapters.slice(index), ...adapters.slice(0, index)];
}

export async function executeStyledWorkload(
  adapter: StyledSVGAdapter,
  workload: BenchmarkWorkload<Parameters<StyledSVGAdapter['styledSvg']>[0]>,
): Promise<number> {
  await adapter.prepare?.();
  return executePreparedStyledWorkload(adapter, workload);
}

async function executePreparedStyledWorkload(
  adapter: StyledSVGAdapter,
  workload: BenchmarkWorkload<Parameters<StyledSVGAdapter['styledSvg']>[0]>,
): Promise<number> {
  let checksum = 0;

  for (let repetition = 0; repetition < workload.repetitions; repetition += 1) {
    for (const fixture of workload.fixtures) {
      checksum += await adapter.styledSvg(fixture);
    }
  }

  return checksum;
}

export async function timedStyledWorkload(
  adapter: StyledSVGAdapter,
  workload: BenchmarkWorkload<Parameters<StyledSVGAdapter['styledSvg']>[0]>,
): Promise<{readonly elapsedMs: number; readonly checksum: number}> {
  await adapter.prepare?.();
  const start = process.hrtime.bigint();
  const checksum = await executePreparedStyledWorkload(adapter, workload);
  const elapsedNanoseconds = process.hrtime.bigint() - start;

  return {
    elapsedMs: Number(elapsedNanoseconds) / 1_000_000,
    checksum,
  };
}

export function executeWorkload(
  adapter: BenchmarkAdapter,
  category: StandardBenchmarkCategory,
  workload: BenchmarkWorkload,
): number {
  adapter.prepare?.();
  return executePreparedWorkload(adapter, category, workload);
}

function executePreparedWorkload(
  adapter: BenchmarkAdapter,
  category: StandardBenchmarkCategory,
  workload: BenchmarkWorkload,
): number {
  const operation = category === 'svg' ? adapter.svg : adapter.matrix;
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
  category: StandardBenchmarkCategory,
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
