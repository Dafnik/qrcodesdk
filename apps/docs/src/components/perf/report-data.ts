import type {
  ReportEnvironment,
  SizeReport,
  SpeedReport,
  SpeedRun,
  SpeedStatistics,
} from '@repo/perf/report-types';
import {type Change, compare} from '@repo/perf/statistics';

/*
 * Reports from `@repo/perf`. The committed baseline always exists. A local
 * `packages/perf/reports/*.json` from `report:size` or `report:speed` is shown instead, with the
 * baseline as the comparison. Globs keep the build working when no local report exists.
 */
const baselines = import.meta.glob<SizeReport | SpeedReport>(
  '../../../../../packages/perf/baseline/*.json',
  {eager: true, import: 'default'},
);
const latest = import.meta.glob<SizeReport | SpeedReport>(
  '../../../../../packages/perf/reports/*.json',
  {eager: true, import: 'default'},
);

function find<T extends SizeReport | SpeedReport>(
  files: Record<string, SizeReport | SpeedReport>,
  kind: T['kind'],
): T | undefined {
  return Object.values(files).find((report) => report.kind === kind) as T | undefined;
}

export type ReportSource<T> = {
  /** The report to show. */
  readonly report: T;
  /** The committed baseline, when the report is a local one. */
  readonly baseline?: T;
  readonly isLocal: boolean;
};

export function loadSizeReport(): ReportSource<SizeReport> | undefined {
  const baseline = find<SizeReport>(baselines, 'size');
  const local = find<SizeReport>(latest, 'size');
  if (local) return {report: local, baseline, isLocal: true};
  return baseline ? {report: baseline, isLocal: false} : undefined;
}

export function loadSpeedReport(): ReportSource<SpeedReport> | undefined {
  const baseline = find<SpeedReport>(baselines, 'speed');
  const local = find<SpeedReport>(latest, 'speed');
  if (local) return {report: local, baseline, isLocal: true};
  return baseline ? {report: baseline, isLocal: false} : undefined;
}

export function sameEnvironment(a: ReportEnvironment, b: ReportEnvironment): boolean {
  return (
    a.os === b.os &&
    a.cpu === b.cpu &&
    a.cores === b.cores &&
    a.node === b.node &&
    a.chromium === b.chromium
  );
}

export type SpeedComparison = {
  readonly ratio: number;
  readonly change: Change;
  readonly against: string;
};

/**
 * Compares a workload with the build measured in `--against` mode, or with the baseline run when
 * both come from the same machine and runtime.
 */
export function compareWorkload(
  run: SpeedRun,
  id: string,
  stats: SpeedStatistics | undefined,
  baselineRun: SpeedRun | undefined,
): SpeedComparison | undefined {
  if (!stats) return undefined;
  const workload = run.workloads.find((item) => item.id === id);
  if (run.against && workload?.against) {
    return {...compare(stats, workload.against), against: run.against.ref};
  }
  if (!baselineRun || !sameEnvironment(run.environment, baselineRun.environment)) return undefined;
  const before = baselineRun.workloads.find((item) => item.id === id)?.stats;
  return before ? {...compare(stats, before), against: 'baseline'} : undefined;
}

export function formatBytes(bytes: number): string {
  const value = Math.abs(bytes);
  const text = value < 1024 ? `${value} B` : `${(value / 1024).toFixed(2)} kB`;
  return bytes < 0 ? `-${text}` : text;
}

export function formatDelta(bytes: number): string {
  if (bytes === 0) return '±0 B';
  return `${bytes > 0 ? '+' : ''}${formatBytes(bytes)}`;
}

export function formatDuration(nanoseconds: number): string {
  if (nanoseconds < 1_000) return `${nanoseconds.toPrecision(3)} ns`;
  if (nanoseconds < 1_000_000) return `${(nanoseconds / 1_000).toPrecision(3)} µs`;
  if (nanoseconds < 1_000_000_000) return `${(nanoseconds / 1_000_000).toPrecision(3)} ms`;
  return `${(nanoseconds / 1_000_000_000).toPrecision(3)} s`;
}

export function formatPercent(ratio: number): string {
  return `${ratio > 0 ? '+' : ''}${(ratio * 100).toFixed(1)}%`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
}

export function describeEnvironment(environment: ReportEnvironment): string {
  return [
    environment.cpu,
    `${environment.cores} threads`,
    environment.os,
    `Node.js ${environment.node}`,
    ...(environment.chromium ? [`Chromium ${environment.chromium}`] : []),
  ].join(' · ');
}

/** Groups items by key, keeping the first-seen order of the groups. */
export function groupBy<T>(items: readonly T[], key: (item: T) => string): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const name = key(item);
    groups.set(name, [...(groups.get(name) ?? []), item]);
  }
  return [...groups];
}
