import {execFileSync} from 'node:child_process';
import os from 'node:os';
import process from 'node:process';

import {CODE_AREAS, FEATURES} from './areas.ts';
import {WORKSPACE_ROOT} from './paths.ts';
import type {CodeAreaInfo, FeatureInfo, ReportEnvironment} from './report-types.ts';

export function getEnvironment(chromium?: string): ReportEnvironment {
  const cpus = os.cpus();
  return {
    os: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: cpus[0]?.model.trim() ?? 'unknown',
    cores: cpus.length,
    memoryGB: Math.round(os.totalmem() / 1024 ** 3),
    node: process.version,
    ...(chromium ? {chromium} : {}),
  };
}

/**
 * Whether timings from two environments are comparable. Speed comparisons against the committed
 * baseline are only meaningful on the same machine and runtime.
 */
export function sameEnvironment(a: ReportEnvironment, b: ReportEnvironment): boolean {
  return (
    a.os === b.os &&
    a.cpu === b.cpu &&
    a.cores === b.cores &&
    a.node === b.node &&
    a.chromium === b.chromium
  );
}

export function getCommit(cwd = WORKSPACE_ROOT): string {
  try {
    const commit = execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], {
      cwd,
      encoding: 'utf8',
    });
    // Untracked files, such as a baseline being written, do not change the measured packages.
    const dirty = execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], {
      cwd,
      encoding: 'utf8',
    });
    return `${commit.trim()}${dirty.trim() ? '-dirty' : ''}`;
  } catch {
    return 'unknown';
  }
}

export function featureInfos(): FeatureInfo[] {
  return Object.entries(FEATURES).map(([id, title]) => ({id, title}));
}

export function areaInfos(): CodeAreaInfo[] {
  return CODE_AREAS.map(({id, title, optional, sdk}) => ({
    id,
    title,
    optional: optional ?? false,
    sdk: sdk ?? false,
  }));
}
