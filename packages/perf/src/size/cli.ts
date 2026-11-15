/**
 * Builds every size scenario as a production app and writes `reports/size.json`.
 *
 *   node src/size/cli.ts                    Vite with source-map attribution, esbuild and webpack checks
 *   node src/size/cli.ts --check            Vite only; fails on inclusion problems or budget overruns
 *   node src/size/cli.ts --update-baseline  Also writes `baseline/size.json`
 *   node src/size/cli.ts --only=svg,canvas  Limits the run to some scenarios
 */
import {mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import {parseArgs} from 'node:util';

import {getCodeArea} from '../areas.ts';
import {areaInfos, featureInfos, getCommit, getEnvironment} from '../environment.ts';
import {formatBytes, formatDelta, printTable, stringifyReport} from '../format.ts';
import {BASELINE_ROOT, CACHE_ROOT, REPORTS_ROOT} from '../paths.ts';
import type {
  CheckBundleResult,
  SizeBundler,
  SizeReport,
  SizeScenarioResult,
  ViteBundleResult,
} from '../report-types.ts';
import {checkBudgets} from './budget.ts';
import {build, toolVersions} from './bundlers.ts';
import {summarizeCheck, summarizeVite} from './measure.ts';
import {measurePackages} from './packages.ts';
import {SIZE_SCENARIOS, type SizeScenario, validateScenarios} from './scenarios.ts';

const {values} = parseArgs({
  options: {
    check: {type: 'boolean', default: false},
    'update-baseline': {type: 'boolean', default: false},
    only: {type: 'string'},
    bundlers: {type: 'string'},
  },
});

const BASELINE_FILE = path.join(BASELINE_ROOT, 'size.json');
const REPORT_FILE = path.join(REPORTS_ROOT, 'size.json');
const APPS_ROOT = path.join(CACHE_ROOT, 'size');
const ALL_BUNDLERS: readonly SizeBundler[] = ['vite', 'esbuild', 'webpack'];
const bundlers: readonly SizeBundler[] = values.bundlers
  ? (values.bundlers.split(',') as SizeBundler[])
  : values.check
    ? ['vite']
    : ALL_BUNDLERS;
if (!bundlers.includes('vite')) throw new Error('The size report always needs the vite bundler');

validateScenarios(SIZE_SCENARIOS);
// A selected scenario also builds its baseline chain, so its feature cost stays visible.
const only = new Set(values.only?.split(','));
for (const id of only) {
  let scenario = SIZE_SCENARIOS.find((candidate) => candidate.id === id);
  if (!scenario) throw new Error(`Unknown size scenario: ${id}`);
  while (scenario?.baseline) {
    only.add(scenario.baseline);
    scenario = SIZE_SCENARIOS.find((candidate) => candidate.id === scenario!.baseline);
  }
}
const scenarios = values.only
  ? SIZE_SCENARIOS.filter((scenario) => only.has(scenario.id))
  : SIZE_SCENARIOS;
if (values['update-baseline'] && values.only) {
  throw new Error('--update-baseline needs every scenario. Remove --only.');
}

async function writeApp(scenario: SizeScenario): Promise<string> {
  const directory = path.join(APPS_ROOT, scenario.id);
  await rm(directory, {recursive: true, force: true});
  await mkdir(directory, {recursive: true});
  await writeFile(
    path.join(directory, 'index.html'),
    '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>QRCodeSDK</title></head>' +
      '<body><script type="module" src="./main.js"></script></body></html>\n',
  );
  await writeFile(path.join(directory, 'main.js'), `${scenario.main}\n`);
  for (const [name, source] of Object.entries(scenario.files ?? {})) {
    await writeFile(path.join(directory, name), `${source}\n`);
  }
  return directory;
}

function inclusionProblems(scenario: SizeScenario, vite: ViteBundleResult): string[] {
  const expected = new Set(scenario.expect ?? []);
  const problems: string[] = [];
  for (const id of expected) {
    getCodeArea(id);
    if (!vite.areas[id]) problems.push(`expected ${id}, but the bundle does not contain it`);
  }
  for (const [id, bytes] of Object.entries(vite.areas)) {
    if (getCodeArea(id).optional && !expected.has(id)) {
      problems.push(`contains ${id} (${bytes} B) without using it`);
    }
  }
  return problems;
}

type Measured = {
  scenario: SizeScenario;
  vite: ViteBundleResult;
  checks: Partial<Record<SizeBundler, CheckBundleResult>>;
  errors: string[];
};

async function measureScenario(scenario: SizeScenario): Promise<Measured> {
  const appDir = await writeApp(scenario);
  const request = {appDir, framework: scenario.framework};
  const vite = summarizeVite(await build('vite', request));
  const checks: Partial<Record<SizeBundler, CheckBundleResult>> = {};
  const errors: string[] = [];
  for (const bundler of bundlers) {
    if (bundler === 'vite' || (scenario.bundlers && !scenario.bundlers.includes(bundler))) continue;
    try {
      checks[bundler] = summarizeCheck(await build(bundler, request));
    } catch (error) {
      errors.push(`${bundler} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return {scenario, vite, checks, errors};
}

/**
 * Flags a feature that costs much more with esbuild or webpack than with Vite. That usually means
 * one of them cannot tree shake something.
 */
function bundlerWarnings(item: Measured, byId: Map<string, Measured>): string[] {
  const base = item.scenario.baseline ? byId.get(item.scenario.baseline) : undefined;
  if (!base) return [];
  const viteDelta = item.vite.total.gzip - base.vite.total.gzip;
  const warnings: string[] = [];
  for (const [bundler, result] of Object.entries(item.checks) as [
    SizeBundler,
    CheckBundleResult,
  ][]) {
    const baseResult = base.checks[bundler];
    if (!baseResult) continue;
    const delta = result.total.gzip - baseResult.total.gzip;
    if (delta - viteDelta > Math.max(512, Math.abs(viteDelta) * 0.25)) {
      warnings.push(
        `${bundler} adds ${formatBytes(delta)} gzip over ${base.scenario.id}, Vite adds ${formatBytes(viteDelta)}`,
      );
    }
  }
  return warnings;
}

async function pool<T, R>(items: readonly T[], limit: number, task: (item: T) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({length: Math.min(limit, items.length)}, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await task(items[index]!);
      }
    }),
  );
  return results;
}

async function readReport(file: string): Promise<SizeReport | undefined> {
  try {
    return JSON.parse(await readFile(file, 'utf8')) as SizeReport;
  } catch {
    return undefined;
  }
}

const started = performance.now();
console.log(`Building ${scenarios.length} scenarios with ${bundlers.join(', ')}…`);
const measured = await pool(
  scenarios,
  Math.max(1, Math.min(4, os.availableParallelism() - 1)),
  async (scenario) => {
    const result = await measureScenario(scenario);
    process.stdout.write('.');
    return result;
  },
);
process.stdout.write('\n');

const byId = new Map(measured.map((item) => [item.scenario.id, item]));
const results: SizeScenarioResult[] = measured.map((item) => ({
  id: item.scenario.id,
  title: item.scenario.title,
  group: item.scenario.group,
  description: item.scenario.description,
  features: item.scenario.features,
  ...(item.scenario.baseline ? {baseline: item.scenario.baseline} : {}),
  vite: item.vite,
  ...(item.checks.esbuild ? {esbuild: item.checks.esbuild} : {}),
  ...(item.checks.webpack ? {webpack: item.checks.webpack} : {}),
  problems: [...inclusionProblems(item.scenario, item.vite), ...item.errors],
  warnings: bundlerWarnings(item, byId),
}));

const report: SizeReport = {
  schemaVersion: 1,
  kind: 'size',
  generatedAt: new Date().toISOString(),
  commit: getCommit(),
  environment: getEnvironment(),
  tools: toolVersions(),
  features: featureInfos(),
  areas: areaInfos(),
  scenarios: results,
  packages: values.check ? [] : await measurePackages(),
};

const baseline = await readReport(BASELINE_FILE);
const previous = new Map(baseline?.scenarios.map((scenario) => [scenario.id, scenario]));
printTable(
  [
    'Scenario',
    'Vite gzip',
    'Feature cost',
    'SDK min',
    'vs baseline',
    'esbuild gzip',
    'webpack gzip',
  ],
  results.map((result) => {
    const base = result.baseline ? byId.get(result.baseline) : undefined;
    const before = previous.get(result.id);
    return [
      `${result.problems.length ? '✗ ' : ''}${result.id}`,
      formatBytes(result.vite.total.gzip),
      base ? formatDelta(result.vite.total.gzip - base.vite.total.gzip) : '',
      formatBytes(result.vite.sdkBytes),
      before ? formatDelta(result.vite.total.gzip - before.vite.total.gzip) : 'new',
      result.esbuild ? formatBytes(result.esbuild.total.gzip) : '',
      result.webpack ? formatBytes(result.webpack.total.gzip) : '',
    ];
  }),
);

for (const result of results) {
  for (const problem of result.problems) console.log(`✗ ${result.id}: ${problem}`);
  for (const warning of result.warnings) console.log(`! ${result.id}: ${warning}`);
}
if (report.packages.length) {
  printTable(
    ['Package', 'Packed', 'Unpacked', 'Files'],
    report.packages.map((item) => [
      item.name,
      formatBytes(item.packed),
      formatBytes(item.unpacked),
      String(item.files),
    ]),
  );
}

// A partial run updates its scenarios in the previous local report and keeps the others.
const previousLocal = values.only ? await readReport(REPORT_FILE) : undefined;
const localReport: SizeReport = previousLocal
  ? {
      ...report,
      scenarios: SIZE_SCENARIOS.map(
        (scenario) =>
          results.find((result) => result.id === scenario.id) ??
          previousLocal.scenarios.find((result) => result.id === scenario.id),
      ).filter((result) => result !== undefined),
      packages: report.packages.length ? report.packages : previousLocal.packages,
    }
  : report;
await mkdir(REPORTS_ROOT, {recursive: true});
await writeFile(REPORT_FILE, stringifyReport(localReport));
console.log(
  `Wrote ${path.relative(process.cwd(), REPORT_FILE)} in ${((performance.now() - started) / 1000).toFixed(1)} s`,
);

if (values['update-baseline']) {
  if (results.some((result) => result.problems.length)) {
    throw new Error('Cannot update the size baseline: some scenarios have measurement problems.');
  }
  if (bundlers.length !== ALL_BUNDLERS.length) {
    throw new Error('--update-baseline needs every bundler. Remove --check and --bundlers.');
  }
  await mkdir(BASELINE_ROOT, {recursive: true});
  await writeFile(BASELINE_FILE, stringifyReport(report));
  console.log(`Updated ${path.relative(process.cwd(), BASELINE_FILE)}`);
} else if (values.check) {
  if (!baseline) throw new Error(`${BASELINE_FILE} is missing. Run report:size --update-baseline.`);
  const {failures, notes} = checkBudgets(report, baseline);
  for (const note of notes) console.log(`note: ${note}`);
  if (failures.length) {
    for (const failure of failures) console.error(`✗ ${failure}`);
    console.error(
      'Size check failed. If the growth is intended, run `pnpm turbo run report:size --filter=@repo/perf -- --update-baseline` and commit the baseline.',
    );
    process.exitCode = 1;
  } else {
    console.log('Size check passed.');
  }
} else if (results.some((result) => result.problems.length)) {
  process.exitCode = 1;
}
