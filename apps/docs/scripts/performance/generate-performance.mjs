import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {format, resolveConfig} from 'prettier';

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = path.resolve(SCRIPT_DIRECTORY, '../..');
const WORKSPACE_ROOT = path.resolve(DOCS_ROOT, '../..');
const DEFAULT_INPUT_PATH = path.join(WORKSPACE_ROOT, 'benchmark-results/latest.json');
const DEFAULT_OUTPUT_PATH = path.join(DOCS_ROOT, 'src/content/docs/learn/performance.md');
const CATEGORIES = [
  ['matrix', 'Matrix generation'],
  ['automatic', 'Automatic matrix generation'],
  ['svg', 'SVG generation'],
  ['styled-svg', 'Styled SVG generation'],
];
const LIBRARIES = [
  ['qrcodesdk', 'QRCodeSDK'],
  ['qrcode', 'qrcode'],
  ['qrcode-generator', 'qrcode-generator'],
  ['qr-code-styling', 'qr-code-styling'],
];
const LIBRARY_ORDER = new Map(LIBRARIES.map(([libraryId], index) => [libraryId, index]));
const LIBRARY_LABELS = new Map(LIBRARIES);

/**
 * @param {unknown} value
 * @param {string} label
 */
function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }

  return value;
}

/**
 * @param {unknown} value
 * @param {string} label
 */
function requireString(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }

  return value;
}

/**
 * @param {unknown} value
 * @param {string} label
 */
function requireFiniteNumber(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }

  return value;
}

/** @param {unknown} report */
export function validateBenchmarkReport(report) {
  const parsedReport = requireObject(report, 'Benchmark report');

  if (parsedReport.schemaVersion !== 5) {
    throw new Error(`Unsupported benchmark schema version: ${parsedReport.schemaVersion}.`);
  }

  requireString(parsedReport.generatedAt, 'generatedAt');
  const environment = requireObject(parsedReport.environment, 'environment');
  requireString(environment.node, 'environment.node');
  requireString(environment.platform, 'environment.platform');
  requireString(environment.architecture, 'environment.architecture');
  requireString(environment.cpuModel, 'environment.cpuModel');
  requireFiniteNumber(environment.cpuCount, 'environment.cpuCount');

  const libraries = requireObject(parsedReport.libraries, 'libraries');
  for (const [library, version] of Object.entries(libraries)) {
    requireString(version, `libraries.${library}`);
  }

  const configuration = requireObject(parsedReport.configuration, 'configuration');
  requireFiniteNumber(configuration.samples, 'configuration.samples');
  requireFiniteNumber(configuration.warmupStaticPasses, 'configuration.warmupStaticPasses');
  requireFiniteNumber(configuration.warmupExhaustivePasses, 'configuration.warmupExhaustivePasses');
  const svgConfiguration = requireObject(configuration.svg, 'configuration.svg');
  requireFiniteNumber(svgConfiguration.pixelsPerModule, 'configuration.svg.pixelsPerModule');
  requireFiniteNumber(svgConfiguration.quietZoneModules, 'configuration.svg.quietZoneModules');
  const styledSvgConfiguration = requireObject(configuration.styledSvg, 'configuration.styledSvg');
  requireFiniteNumber(styledSvgConfiguration.fixtureCount, 'configuration.styledSvg.fixtureCount');
  if (!Array.isArray(styledSvgConfiguration.multipliers)) {
    throw new Error('configuration.styledSvg.multipliers must be an array.');
  }
  for (const [index, multiplier] of styledSvgConfiguration.multipliers.entries()) {
    requireFiniteNumber(multiplier, `configuration.styledSvg.multipliers[${index}]`);
  }
  if (styledSvgConfiguration.dimensionsFromFixtures !== true) {
    throw new Error('configuration.styledSvg.dimensionsFromFixtures must be true.');
  }
  if (styledSvgConfiguration.automaticMaskSelection !== true) {
    throw new Error('configuration.styledSvg.automaticMaskSelection must be true.');
  }

  if (!Array.isArray(parsedReport.results) || parsedReport.results.length === 0) {
    throw new Error('results must be a non-empty array.');
  }

  for (const [index, result] of parsedReport.results.entries()) {
    const entry = requireObject(result, `results[${index}]`);
    requireString(entry.category, `results[${index}].category`);
    requireString(entry.workloadId, `results[${index}].workloadId`);
    requireString(entry.workloadLabel, `results[${index}].workloadLabel`);
    requireString(entry.libraryId, `results[${index}].libraryId`);
    requireString(entry.libraryLabel, `results[${index}].libraryLabel`);
    requireString(entry.libraryVersion, `results[${index}].libraryVersion`);
    requireFiniteNumber(entry.qrCodesPerSample, `results[${index}].qrCodesPerSample`);
    requireFiniteNumber(entry.medianMs, `results[${index}].medianMs`);
    requireFiniteNumber(entry.minMs, `results[${index}].minMs`);
    requireFiniteNumber(entry.maxMs, `results[${index}].maxMs`);
    requireFiniteNumber(entry.qrCodesPerSecond, `results[${index}].qrCodesPerSecond`);
  }

  return parsedReport;
}

/** @param {number} value */
function formatInteger(value) {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** @param {Record<string, any>} result */
function formatResultRow(result) {
  return `| ${result.workloadLabel} | ${formatInteger(result.qrCodesPerSample)} | ${result.libraryLabel} v${result.libraryVersion} | ${result.medianMs.toFixed(3)} | ${result.minMs.toFixed(3)}–${result.maxMs.toFixed(3)} | ${formatInteger(result.qrCodesPerSecond)} |`;
}

/** @param {Record<string, any>} left @param {Record<string, any>} right */
function compareLibraries(left, right) {
  const leftOrder = LIBRARY_ORDER.get(left.libraryId) ?? Number.MAX_SAFE_INTEGER;
  const rightOrder = LIBRARY_ORDER.get(right.libraryId) ?? Number.MAX_SAFE_INTEGER;

  return leftOrder - rightOrder || left.libraryLabel.localeCompare(right.libraryLabel);
}

/** @param {Record<string, any>[]} results */
function groupResultsByWorkload(results) {
  const workloads = new Map();

  for (const result of results) {
    const workloadResults = workloads.get(result.workloadId) ?? [];
    workloadResults.push(result);
    workloads.set(result.workloadId, workloadResults);
  }

  return [...workloads.values()];
}

/** @param {Record<string, any>} result */
function formatChartLibraryLabel(result) {
  return LIBRARY_LABELS.get(result.libraryId) ?? result.libraryLabel;
}

/** @param {Record<string, any>} left @param {Record<string, any>} right */
function compareThroughput(left, right) {
  return right.qrCodesPerSecond - left.qrCodesPerSecond || compareLibraries(left, right);
}

/** @param {number} maximum */
function chartAxisMaximum(maximum) {
  const magnitude = 10 ** Math.floor(Math.log10(maximum));
  const step = magnitude / 2;
  return Math.ceil((maximum * 1.1) / step) * step;
}

/**
 * @param {Record<string, any>[]} results
 * @param {string} categoryTitle
 */
function formatMermaidChart(results, categoryTitle) {
  const sortedResults = results.toSorted(compareThroughput);
  const [{workloadLabel, qrCodesPerSample}] = sortedResults;
  const libraryLabels = sortedResults.map(formatChartLibraryLabel);
  const throughput = sortedResults.map((result) => Math.round(result.qrCodesPerSecond));
  const yAxisMaximum = chartAxisMaximum(Math.max(...throughput));
  const accessibleValues = sortedResults
    .map(
      (result) =>
        `${formatChartLibraryLabel(result)} ${formatInteger(result.qrCodesPerSecond)} QR codes per second`,
    )
    .join(', ');
  const chartTitle = `${workloadLabel} — ${formatInteger(qrCodesPerSample)} QR codes/sample`;

  return `\`\`\`mermaid
---
config:
  xyChart:
    showDataLabel: true
    showDataLabelOutsideBar: true
---
xychart horizontal
  accTitle: ${categoryTitle}: ${chartTitle}
  accDescr: Throughput calculated from median time. ${accessibleValues}. Higher is better.
  title ${JSON.stringify(chartTitle)}
  x-axis "Library" [${libraryLabels.map((label) => JSON.stringify(label)).join(', ')}]
  y-axis "QR codes/second" 0 --> ${String(yAxisMaximum)}
  bar [${throughput.join(', ')}]
\`\`\``;
}

/**
 * @param {unknown} report
 * @param {{ inputPath?: string, outputPath?: string, workspaceRoot?: string }} [options]
 */
export async function generatePerformancePage(report, options = {}) {
  const parsedReport = validateBenchmarkReport(report);
  const inputPath = options.inputPath ?? DEFAULT_INPUT_PATH;
  const outputPath = options.outputPath ?? DEFAULT_OUTPUT_PATH;
  const workspaceRoot = options.workspaceRoot ?? WORKSPACE_ROOT;
  const environment = parsedReport.environment;
  const configuration = parsedReport.configuration;
  const libraryVersions = Object.entries(parsedReport.libraries)
    .map(([library, version]) => `\`${library}@${version}\``)
    .join(', ');
  const sections = CATEGORIES.map(([category, title]) => {
    const categoryResults = parsedReport.results.filter((result) => result.category === category);

    if (categoryResults.length === 0) {
      throw new Error(`No ${category} benchmark results were found.`);
    }

    const charts = groupResultsByWorkload(categoryResults)
      .map((results) => formatMermaidChart(results, title))
      .join('\n\n');
    const rows = categoryResults.map(formatResultRow).join('\n');

    return `## ${title}

${charts}

<details>
<summary>Exact benchmark data</summary>

| Workload | QR codes/sample | Library | Median (ms) | Min–max (ms) | QR codes/second |
| --- | ---: | --- | ---: | ---: | ---: |
${rows}

</details>`;
  }).join('\n\n');
  const sourcePath = path.relative(workspaceRoot, inputPath).split(path.sep).join('/');
  const markdown = `---
title: Performance
description: Matrix, automatic matrix, SVG, and styled SVG generation benchmark results for QRCodeSDK and its reference libraries.
docType: concept
---

<!-- Generated from ${sourcePath}. Run \`pnpm turbo run generate-performance --filter=docs\` to update. -->

The matrix, automatic matrix, and SVG benchmarks compare QRCodeSDK with **qrcode** and **qrcode-generator** using its stock text encoder. Styled SVG generation compares QRCodeSDK with **qr-code-styling**. Benchmarks are environment-specific and should be read as relative comparisons, not universal guarantees.

The matrix and SVG fixtures supply explicit versions and masks. The **qrcode-generator** rows use the repository patch that applies each fixture's mask and skips automatic mask evaluation. The automatic matrix fixtures omit both options so every library selects them.

Styled SVG generation uses all ${configuration.styledSvg.fixtureCount} shared styling fixtures at ${configuration.styledSvg.multipliers.join(', ')} repetitions. Both libraries select the mask automatically because **qr-code-styling** has no public mask option. Fixture module size and margin determine the matching pixel dimensions passed to **qr-code-styling**, which renders SVG through a shared JSDOM environment initialized before measurement.

## Benchmark environment

- Generated: \`${parsedReport.generatedAt}\`
- Runtime: \`${environment.node}\` on \`${environment.platform} ${environment.architecture}\`
- CPU: \`${environment.cpuModel}\` (${environment.cpuCount} logical cores)
- Libraries: ${libraryVersions}
- Samples: ${configuration.samples} timed samples after ${configuration.warmupStaticPasses} static warm-up passes and ${configuration.warmupExhaustivePasses} exhaustive warm-up pass${configuration.warmupExhaustivePasses === 1 ? '' : 'es'}
- SVG output: ${configuration.svg.pixelsPerModule} px/module with a ${configuration.svg.quietZoneModules}-module quiet zone
- Styled SVG fixtures: ${configuration.styledSvg.fixtureCount}, with fixture-derived dimensions and automatic mask selection

The charts show throughput calculated from the median time. Higher is better, and each chart lists the fastest library first. Expand the exact benchmark data beneath each section for median time, min–max range, and throughput.

${sections}
`;
  const prettierConfig = (await resolveConfig(outputPath)) ?? {};

  return format(markdown, {
    ...prettierConfig,
    filepath: outputPath,
    parser: 'markdown',
  });
}

/**
 * @param {string} expected
 * @param {string} outputPath
 */
export async function assertPerformancePageCurrent(expected, outputPath = DEFAULT_OUTPUT_PATH) {
  const current = await readFile(outputPath, 'utf8').catch(() => undefined);

  if (current !== expected) {
    throw new Error(
      `${path.relative(WORKSPACE_ROOT, outputPath)} is stale. Run \`pnpm turbo run generate-performance --filter=docs\`.`,
    );
  }
}

async function run() {
  const [mode, ...extraArguments] = process.argv.slice(2);

  if (extraArguments.length > 0 || (mode !== '--write' && mode !== '--check')) {
    throw new Error('Usage: node scripts/performance/generate-performance.mjs <--write|--check>');
  }

  const report = JSON.parse(await readFile(DEFAULT_INPUT_PATH, 'utf8'));
  const content = await generatePerformancePage(report);

  if (mode === '--check') {
    await assertPerformancePageCurrent(content);
    console.log(`${path.relative(WORKSPACE_ROOT, DEFAULT_OUTPUT_PATH)} is up to date.`);
    return;
  }

  await mkdir(path.dirname(DEFAULT_OUTPUT_PATH), {recursive: true});
  await writeFile(DEFAULT_OUTPUT_PATH, content);
  console.log(`Generated ${path.relative(WORKSPACE_ROOT, DEFAULT_OUTPUT_PATH)}.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
