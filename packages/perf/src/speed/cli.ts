/**
 * Measures the speed workloads in Node.js or Chromium and writes `reports/speed.json`.
 *
 *   node src/speed/cli.ts --target=node
 *   node src/speed/cli.ts --target=browser
 *   node src/speed/cli.ts --target=node --against=main      Interleaves a build of `main`
 *   node src/speed/cli.ts --target=node --only=matrix/,svg/  Workload id prefixes
 *   node src/speed/cli.ts --target=node --quick             Shorter sampling, for smoke runs
 *   node src/speed/cli.ts --target=node --update-baseline   Also writes `baseline/speed.json`
 */
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {parseArgs} from 'node:util';

import {featureInfos, getCommit, getEnvironment, sameEnvironment} from '../environment.ts';
import {formatDuration, formatPercent, printTable, stringifyReport} from '../format.ts';
import {BASELINE_ROOT, REPORTS_ROOT, WORKSPACE_ROOT} from '../paths.ts';
import type {
  SpeedReport,
  SpeedRun,
  SpeedStatistics,
  SpeedTarget,
  SpeedWorkloadResult,
} from '../report-types.ts';
import {prepareAgainst} from './against.ts';
import {type GroupBundle, type Variant, bundleGroup} from './bundle.ts';
import {type Runner, type WorkloadInfo, createBrowserRunner, createNodeRunner} from './runners.ts';
import {DEFAULT_SAMPLER_OPTIONS, QUICK_SAMPLER_OPTIONS} from './sampler.ts';
import {compare, summarize} from './statistics.ts';
import {WORKLOAD_GROUPS, WORKLOAD_GROUP_TITLES, type WorkloadGroupId} from './workloads/index.ts';

const {values} = parseArgs({
  options: {
    target: {type: 'string'},
    against: {type: 'string'},
    only: {type: 'string'},
    quick: {type: 'boolean', default: false},
    rounds: {type: 'string'},
    'update-baseline': {type: 'boolean', default: false},
  },
});

const target = values.target as SpeedTarget;
if (target !== 'node' && target !== 'browser')
  throw new Error('Pass --target=node or --target=browser');
if (values['update-baseline'] && (values.against || values.only || values.quick)) {
  throw new Error('--update-baseline needs a full run without --against, --only, or --quick');
}
const only = values.only?.split(',');
const options = values.quick ? QUICK_SAMPLER_OPTIONS : DEFAULT_SAMPLER_OPTIONS;
// Alternating builds over several rounds spreads drift, such as thermal throttling, over both.
const rounds = Number(values.rounds ?? (values.against ? 3 : 1));

const REPORT_FILE = path.join(REPORTS_ROOT, 'speed.json');
const BASELINE_FILE = path.join(BASELINE_ROOT, 'speed.json');

async function readReport(file: string): Promise<SpeedReport | undefined> {
  try {
    return JSON.parse(await readFile(file, 'utf8')) as SpeedReport;
  } catch {
    return undefined;
  }
}

/**
 * Replaces the run of the same target. A partial run with `--only` replaces just its workloads
 * when the earlier run is from the same environment and comparison.
 */
function mergeRun(report: SpeedReport | undefined, run: SpeedRun, partial = false): SpeedReport {
  const previous = report?.runs.find((item) => item.target === run.target);
  if (
    partial &&
    previous &&
    sameEnvironment(previous.environment, run.environment) &&
    previous.against?.commit === run.against?.commit
  ) {
    const replaced = new Map(run.workloads.map((item) => [item.id, item]));
    const kept = previous.workloads.filter((item) => !replaced.has(item.id));
    run = {...run, workloads: [...kept, ...run.workloads]};
  }
  return {
    schemaVersion: 1,
    kind: 'speed',
    generatedAt: new Date().toISOString(),
    commit: getCommit(),
    features: featureInfos(),
    groups: Object.entries(WORKLOAD_GROUP_TITLES).map(([id, title]) => ({id, title})),
    runs: [...(report?.runs.filter((item) => item.target !== run.target) ?? []), run].sort((a, b) =>
      a.target.localeCompare(b.target),
    ),
  };
}

const variants: Variant[] = [{name: 'current', root: WORKSPACE_ROOT}];
let against: {ref: string; commit: string} | undefined;
if (values.against) {
  const prepared = await prepareAgainst(values.against);
  variants.push({name: 'against', root: prepared.root});
  against = {ref: values.against, commit: prepared.commit.slice(0, 12)};
}

const started = performance.now();
console.log(`Bundling ${WORKLOAD_GROUPS.length} workload groups for ${target}…`);
const bundles = new Map<string, GroupBundle>();
for (const variant of variants) {
  for (const group of WORKLOAD_GROUPS) {
    const bundle = await bundleGroup(group, target, variant);
    if (!bundle.ok && variant.name === 'current') throw new Error(`${group}: ${bundle.error}`);
    if (!bundle.ok)
      console.log(`! ${group} is not available in ${values.against}: ${bundle.error}`);
    bundles.set(`${variant.name}:${group}`, bundle);
  }
}

const runner: Runner = target === 'node' ? createNodeRunner() : await createBrowserRunner();
const environment = getEnvironment(runner.version);
const baselineReport = against ? undefined : await readReport(BASELINE_FILE);
const baselineRun = baselineReport?.runs.find((run) => run.target === target);
const baselineComparable = baselineRun
  ? sameEnvironment(baselineRun.environment, environment)
  : false;
const baselineById = new Map(
  baselineComparable ? baselineRun!.workloads.map((item) => [item.id, item]) : [],
);
if (baselineRun && !baselineComparable) {
  console.log(
    `The baseline was measured on ${baselineRun.environment.cpu} (${baselineRun.environment.node}${baselineRun.environment.chromium ? `, Chromium ${baselineRun.environment.chromium}` : ''}). ` +
      'Deltas are hidden. Use --against=<git ref> to compare on this machine.',
  );
}

type Planned = {group: WorkloadGroupId; info: WorkloadInfo};
const planned: Planned[] = [];
for (const group of WORKLOAD_GROUPS) {
  const bundle = bundles.get(`current:${group}`)!;
  if (!bundle.ok) continue;
  for (const info of await runner.list(bundle.entry)) {
    if (info.targets && !info.targets.includes(target)) continue;
    if (only && !only.some((prefix) => info.id.startsWith(prefix))) continue;
    planned.push({group, info});
  }
}
console.log(
  `Measuring ${planned.length} workloads, ${rounds} round${rounds === 1 ? '' : 's'} each…`,
);

const results: SpeedWorkloadResult[] = [];
const rows: string[][] = [];
for (const [index, {group, info}] of planned.entries()) {
  const samples: Record<Variant['name'], number[]> = {current: [], against: []};
  const batches: Record<Variant['name'], number> = {current: 0, against: 0};
  let error: string | undefined;
  let againstError: string | undefined;
  for (let round = 0; round < rounds; round++) {
    const order = round % 2 === 0 ? variants : [...variants].reverse();
    for (const variant of order) {
      const bundle = bundles.get(`${variant.name}:${group}`)!;
      if (!bundle.ok) {
        againstError = bundle.error;
        continue;
      }
      try {
        const result = await runner.run(bundle.entry, info.id, options);
        samples[variant.name].push(...result.samples);
        batches[variant.name] ||= result.batch;
      } catch (caught) {
        const message = caught instanceof Error ? caught.message.split('\n')[0]! : String(caught);
        if (variant.name === 'current') error = message;
        else againstError = message;
      }
    }
  }
  const stats = samples.current.length ? summarize(samples.current, batches.current) : undefined;
  const againstStats: SpeedStatistics | undefined = samples.against.length
    ? summarize(samples.against, batches.against)
    : undefined;
  results.push({
    id: info.id,
    title: info.title,
    group,
    features: info.features,
    target,
    ...(stats ? {stats} : {}),
    ...(againstStats ? {against: againstStats} : {}),
    ...(error
      ? {error}
      : againstError && against
        ? {error: `${against.ref}: ${againstError}`}
        : {}),
  });
  const reference = againstStats ?? baselineById.get(info.id)?.stats;
  const comparison = stats && reference ? compare(stats, reference) : undefined;
  const row = [
    info.id,
    stats ? formatDuration(stats.median) : 'error',
    stats ? `±${stats.rme.toFixed(1)}%` : '',
    stats ? Math.round(stats.hz).toLocaleString('en-US') : '',
    comparison
      ? `${formatPercent(comparison.ratio)}${comparison.change === 'slower' ? ' ▲ slower' : comparison.change === 'faster' ? ' ▼ faster' : ''}`
      : '',
  ];
  rows.push(row);
  console.log(
    `[${index + 1}/${planned.length}] ${row.filter(Boolean).join('  ')}${error ? `  ${error}` : ''}`,
  );
}
await runner.close();

console.log('');
printTable(
  ['Workload', 'Median', 'RME', 'ops/s', against ? `vs ${against.ref}` : 'vs baseline'],
  rows,
);

const run: SpeedRun = {target, environment, workloads: results, ...(against ? {against} : {})};
await mkdir(REPORTS_ROOT, {recursive: true});
await writeFile(
  REPORT_FILE,
  stringifyReport(mergeRun(await readReport(REPORT_FILE), run, only !== undefined)),
);
console.log(
  `Wrote ${path.relative(process.cwd(), REPORT_FILE)} in ${((performance.now() - started) / 1000).toFixed(0)} s`,
);

if (values['update-baseline']) {
  await mkdir(BASELINE_ROOT, {recursive: true});
  await writeFile(BASELINE_FILE, stringifyReport(mergeRun(baselineReport, run)));
  console.log(`Updated the ${target} run in ${path.relative(process.cwd(), BASELINE_FILE)}`);
}
if (results.some((result) => result.error && !result.stats)) process.exitCode = 1;
