import path from 'node:path';
import {fileURLToPath} from 'node:url';

/** Root of the `@repo/perf` package. */
export const PERF_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/** Root of the workspace that this package belongs to. */
export const WORKSPACE_ROOT = path.resolve(PERF_ROOT, '..', '..');
/** Ignored working directory for generated apps, bundles, and baseline checkouts. */
export const CACHE_ROOT = path.join(PERF_ROOT, '.cache');
/** Ignored directory for the latest generated reports. */
export const REPORTS_ROOT = path.join(PERF_ROOT, 'reports');
/** Committed baseline reports. */
export const BASELINE_ROOT = path.join(PERF_ROOT, 'baseline');

/** Workspace-relative POSIX path, for stable report output across machines. */
export function toWorkspacePath(absolutePath: string, root = WORKSPACE_ROOT): string {
  return path.relative(root, absolutePath).split(path.sep).join('/');
}
