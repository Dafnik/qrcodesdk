/**
 * JSON shapes of the size and speed reports. The docs read them through
 * `@repo/perf/report-types`, so keep these types free of runtime imports.
 */

export type ReportEnvironment = {
  readonly os: string;
  readonly cpu: string;
  readonly cores: number;
  readonly memoryGB: number;
  readonly node: string;
  readonly chromium?: string;
};

export type FeatureInfo = {readonly id: string; readonly title: string};
export type CodeAreaInfo = {
  readonly id: string;
  readonly title: string;
  readonly optional: boolean;
  readonly sdk: boolean;
};

/* -------------------------------------------------------------------------------------------- */
/* Size                                                                                         */
/* -------------------------------------------------------------------------------------------- */

export type SizeBundler = 'vite' | 'esbuild' | 'webpack';

/** Minified, gzip, and Brotli bytes. */
export type Sizes = {readonly min: number; readonly gzip: number; readonly brotli: number};

export type SizeModule = {readonly path: string; readonly area: string; readonly bytes: number};

export type SizeChunk = {
  readonly name: string;
  readonly kind: 'initial' | 'lazy';
  readonly sizes: Sizes;
  /** Minified bytes of each source module in this chunk, largest first. */
  readonly modules: readonly SizeModule[];
};

export type SizeDuplicate = {
  readonly path: string;
  readonly chunks: readonly string[];
  readonly bytes: number;
};

export type ViteBundleResult = {
  readonly total: Sizes;
  readonly initial: Sizes;
  readonly lazy: Sizes;
  /** Minified bytes attributed to QRCodeSDK packages. */
  readonly sdkBytes: number;
  /** Minified bytes per code area, across all chunks. */
  readonly areas: Readonly<Record<string, number>>;
  readonly chunks: readonly SizeChunk[];
  readonly duplicates: readonly SizeDuplicate[];
};

export type CheckBundleResult = {
  readonly total: Sizes;
  readonly initial: Sizes;
  readonly lazy: Sizes;
  readonly chunkCount: number;
};

export type SizeScenarioResult = {
  readonly id: string;
  readonly title: string;
  readonly group: string;
  readonly description: string;
  readonly features: readonly string[];
  /** Scenario that this one adds a feature to. The feature cost is the difference. */
  readonly baseline?: string;
  readonly vite: ViteBundleResult;
  readonly esbuild?: CheckBundleResult;
  readonly webpack?: CheckBundleResult;
  /** Problems such as an unexpected optional area. Empty when the scenario passes. */
  readonly problems: readonly string[];
  /** Differences between bundlers worth a look, such as a feature that only one keeps. */
  readonly warnings: readonly string[];
};

export type PackageSizeResult = {
  readonly name: string;
  readonly version: string;
  /** Compressed tarball bytes. */
  readonly packed: number;
  readonly unpacked: number;
  readonly files: number;
};

export type SizeReport = {
  readonly schemaVersion: 1;
  readonly kind: 'size';
  readonly generatedAt: string;
  readonly commit: string;
  readonly environment: ReportEnvironment;
  readonly tools: Readonly<Record<string, string>>;
  readonly features: readonly FeatureInfo[];
  readonly areas: readonly CodeAreaInfo[];
  readonly scenarios: readonly SizeScenarioResult[];
  readonly packages: readonly PackageSizeResult[];
};

/* -------------------------------------------------------------------------------------------- */
/* Speed                                                                                        */
/* -------------------------------------------------------------------------------------------- */

export type SpeedTarget = 'node' | 'browser';

/** Per-operation timings in nanoseconds. */
export type SpeedStatistics = {
  readonly samples: number;
  /** Operations per timed sample. */
  readonly batch: number;
  readonly mean: number;
  readonly median: number;
  readonly p75: number;
  readonly p99: number;
  readonly min: number;
  readonly max: number;
  /** Operations per second, from the median. */
  readonly hz: number;
  /** Relative margin of error of the mean at 95% confidence, in percent. */
  readonly rme: number;
};

export type SpeedWorkloadResult = {
  readonly id: string;
  readonly title: string;
  readonly group: string;
  readonly features: readonly string[];
  readonly target: SpeedTarget;
  readonly stats?: SpeedStatistics;
  /** Measurement of the comparison build in `--against` mode. */
  readonly against?: SpeedStatistics;
  readonly error?: string;
};

export type SpeedRun = {
  readonly target: SpeedTarget;
  readonly environment: ReportEnvironment;
  readonly workloads: readonly SpeedWorkloadResult[];
  /** Set in `--against` mode: the git ref and commit measured as `against`. */
  readonly against?: {readonly ref: string; readonly commit: string};
};

export type SpeedReport = {
  readonly schemaVersion: 1;
  readonly kind: 'speed';
  readonly generatedAt: string;
  readonly commit: string;
  readonly features: readonly FeatureInfo[];
  readonly groups: readonly {readonly id: string; readonly title: string}[];
  readonly runs: readonly SpeedRun[];
};
