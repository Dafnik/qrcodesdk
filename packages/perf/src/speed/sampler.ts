/**
 * Timing loop shared by the Node.js and browser runners. It runs in the measured runtime, so it
 * has no imports.
 */

export type SamplerOptions = {
  /** Time spent running the workload before measuring, in milliseconds. */
  readonly warmupMs: number;
  /** Minimum measuring time, in milliseconds. */
  readonly timeMs: number;
  readonly minSamples: number;
  readonly maxSamples: number;
  /** Each sample runs the workload enough times to take at least this long. */
  readonly batchMs: number;
};

export const DEFAULT_SAMPLER_OPTIONS: SamplerOptions = {
  warmupMs: 300,
  timeMs: 1_000,
  minSamples: 20,
  maxSamples: 1_000,
  batchMs: 10,
};

export const QUICK_SAMPLER_OPTIONS: SamplerOptions = {
  warmupMs: 50,
  timeMs: 150,
  minSamples: 10,
  maxSamples: 200,
  batchMs: 5,
};

export type SampleResult = {
  /** Nanoseconds per operation, one entry per batch. */
  readonly samples: number[];
  readonly batch: number;
};

let sink: unknown;

/** Returns the last result so the runtime cannot prove the work unused. */
export function consumeSink(): unknown {
  return sink;
}

/**
 * Measures `run` in batches. `now` returns milliseconds with sub-millisecond precision.
 */
export function sample(
  run: () => unknown,
  now: () => number,
  options: SamplerOptions,
): SampleResult {
  const time = (count: number) => {
    const start = now();
    for (let index = 0; index < count; index++) sink = run();
    return now() - start;
  };

  let batch = 1;
  for (
    let elapsed = time(batch);
    elapsed < options.batchMs && batch < 1 << 24;
    elapsed = time(batch)
  ) {
    const estimate =
      elapsed > 0 ? Math.ceil((batch * options.batchMs * 1.2) / elapsed) : batch * 10;
    batch = Math.min(batch * 100, Math.max(batch * 2, estimate));
  }

  const warmupEnd = now() + options.warmupMs;
  while (now() < warmupEnd) time(batch);

  const samples: number[] = [];
  const start = now();
  while (
    samples.length < options.maxSamples &&
    (samples.length < options.minSamples || now() - start < options.timeMs)
  ) {
    samples.push((time(batch) * 1e6) / batch);
  }
  return {samples, batch};
}
