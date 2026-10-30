import {createBundleJsUrl} from './package-badges.mjs';

const FETCH_TIMEOUT_MS = 5_000;
const BUNDLE_FETCH_TIMEOUT_MS = 15_000;

/** The sidebar and the footer both render the package card, so share one request per package. */
/** @type {Map<string, Promise<PackageStats>>} */
const buildStatsCache = new Map();

/**
 * @typedef {{
 *   version?: string,
 *   installSize?: number,
 *   bundledSize?: number,
 *   monthlyDownloads?: number,
 * }} PackageStats
 */

/**
 * Fetches package stats at build time. npmx.dev provides the version and install size; monthly
 * downloads and the bundled size are not exposed by npmx, so they come from the npm downloads API
 * and bundlejs.
 *
 * @param {string} packageName
 * @returns {Promise<PackageStats>}
 */
export function fetchPackageStats(packageName) {
  let stats = buildStatsCache.get(packageName);
  if (!stats) {
    stats = fetchNpmxPackageStats(packageName);
    buildStatsCache.set(packageName, stats);
  }
  return stats;
}

/**
 * @param {string} packageName
 * @returns {Promise<PackageStats>}
 */
async function fetchNpmxPackageStats(packageName) {
  const [meta, installSize, monthlyDownloads, bundledSize] = await Promise.all([
    fetchJson(`https://npmx.dev/api/registry/package-meta/${packageName}`),
    fetchJson(`https://npmx.dev/api/registry/install-size/${packageName}`),
    fetchMonthlyDownloads(packageName),
    fetchBundledSize(packageName),
  ]);

  return {
    version: meta?.version,
    installSize: installSize?.totalSize,
    monthlyDownloads,
    bundledSize,
  };
}

/**
 * Fetches the package stats that can be refreshed in the browser. npmx.dev does not send CORS
 * headers, so the client refresh uses the npm registry instead and keeps the build-time install
 * size.
 *
 * @param {string} packageName
 * @returns {Promise<PackageStats>}
 */
export async function fetchClientPackageStats(packageName) {
  const [latest, monthlyDownloads, bundledSize] = await Promise.all([
    fetchJson(`https://registry.npmjs.org/${packageName}/latest`),
    fetchMonthlyDownloads(packageName),
    fetchBundledSize(packageName),
  ]);

  return {version: latest?.version, monthlyDownloads, bundledSize};
}

/** @param {string} packageName */
async function fetchMonthlyDownloads(packageName) {
  const data = await fetchJson(`https://api.npmjs.org/downloads/point/last-month/${packageName}`);
  return data?.downloads;
}

/** @param {string} packageName */
async function fetchBundledSize(packageName) {
  const data = await fetchJson(createBundleJsUrl(packageName), BUNDLE_FETCH_TIMEOUT_MS);
  return data?.size?.rawCompressedSize;
}

/**
 * @param {string} url
 * @param {number} [timeoutMs]
 * @returns {Promise<any>}
 */
async function fetchJson(url, timeoutMs = FETCH_TIMEOUT_MS) {
  try {
    const response = await fetch(url, {signal: AbortSignal.timeout(timeoutMs)});
    return response.ok ? await response.json() : undefined;
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    return undefined;
  }
}

/** @param {number | undefined} bytes */
export function formatBytes(bytes) {
  if (bytes === undefined) return '—';
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(1)} kB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

/** @param {number | undefined} count */
export function formatCount(count) {
  if (count === undefined) return '—';
  return new Intl.NumberFormat('en', {notation: 'compact', maximumFractionDigits: 1}).format(count);
}

/** @param {string | undefined} version */
export function formatVersion(version) {
  return version ? `v${version}` : '—';
}
