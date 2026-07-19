import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {format, resolveConfig} from 'prettier';

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = path.resolve(SCRIPT_DIRECTORY, '../..');
const WORKSPACE_ROOT = path.resolve(DOCS_ROOT, '../..');
const DEFAULT_INPUT_PATH = path.join(WORKSPACE_ROOT, 'benchmark-results/latest.json');
const DEFAULT_OUTPUT_PATH = path.join(DOCS_ROOT, 'src/content/docs/guides/performance.md');
const CATEGORIES = [
  ['matrix', 'Matrix generation'],
  ['svg', 'SVG generation'],
];
const LIBRARIES = [
  ['qrcodesdk', 'QRCodeSDK'],
  ['qrcode', 'qrcode'],
  ['qrcode-generator-default', 'generator default'],
  ['qrcode-generator', 'generator TextEncoder'],
  ['qrcode-generator-utf8', 'generator bundled UTF-8'],
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

  if (parsedReport.schemaVersion !== 2) {
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
    requireFiniteNumber(entry.timeVsQRCodeSDK, `results[${index}].timeVsQRCodeSDK`);
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
  return `| ${result.workloadLabel} | ${formatInteger(result.qrCodesPerSample)} | ${result.libraryLabel} v${result.libraryVersion} | ${result.medianMs.toFixed(3)} | ${result.minMs.toFixed(3)}–${result.maxMs.toFixed(3)} | ${formatInteger(result.qrCodesPerSecond)} | ${result.timeVsQRCodeSDK.toFixed(2)}× |`;
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

/**
 * @param {Record<string, any>[]} results
 * @param {string} categoryTitle
 * @param {number} yAxisMaximum
 */
function formatMermaidChart(results, categoryTitle, yAxisMaximum) {
  const sortedResults = results.toSorted(compareLibraries);
  const [{workloadLabel, qrCodesPerSample}] = sortedResults;
  const libraryLabels = sortedResults.map(formatChartLibraryLabel);
  const relativeTimes = sortedResults.map((result) => result.timeVsQRCodeSDK.toFixed(2));
  const accessibleValues = sortedResults
    .map(
      (result) => `${formatChartLibraryLabel(result)} ${result.timeVsQRCodeSDK.toFixed(2)} times`,
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
  accDescr: Relative median time compared with QRCodeSDK. ${accessibleValues}. Lower is better.
  title ${JSON.stringify(chartTitle)}
  x-axis "Library" [${libraryLabels.map((label) => JSON.stringify(label)).join(', ')}]
  y-axis "Time ÷ QRCodeSDK" 0 --> ${yAxisMaximum.toFixed(1)}
  bar [${relativeTimes.join(', ')}]
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

    const maximumRelativeTime = Math.max(
      ...categoryResults.map((result) => result.timeVsQRCodeSDK),
    );
    const yAxisMaximum = Math.ceil(maximumRelativeTime * 2) / 2 + 0.5;
    const charts = groupResultsByWorkload(categoryResults)
      .map((results) => formatMermaidChart(results, title, yAxisMaximum))
      .join('\n\n');
    const rows = categoryResults.map(formatResultRow).join('\n');

    return `## ${title}

${charts}

<details>
<summary>Exact benchmark data</summary>

| Workload | QR codes/sample | Library | Median (ms) | Min–max (ms) | QR codes/second | Time ÷ QRCodeSDK |
| --- | ---: | --- | ---: | ---: | ---: | ---: |
${rows}

</details>`;
  }).join('\n\n');
  const sourcePath = path.relative(workspaceRoot, inputPath).split(path.sep).join('/');
  const markdown = `---
title: Performance
description: Matrix and SVG generation benchmark results for QRCodeSDK and its reference libraries.
---

<!-- Generated from ${sourcePath}. Run \`pnpm turbo run generate-performance --filter=docs\` to update. -->

These results compare QRCodeSDK with **qrcode** and three **qrcode-generator** encoder configurations. Benchmarks are environment-specific and should be read as relative comparisons, not universal guarantees.

All **qrcode-generator** rows use the repository patch that applies each fixture's explicit mask and skips automatic mask evaluation. The **default** row uses the package's stock low-byte converter, **TextEncoder** uses the platform encoder, and **bundled UTF-8** uses the package's handwritten UTF-8 converter. The default converter truncates UTF-16 code units, so its Unicode byte fixtures do not encode content equivalent to the other rows. TextEncoder and bundled UTF-8 produce the same bytes for the valid Unicode fixtures.

## Benchmark environment

- Generated: \`${parsedReport.generatedAt}\`
- Runtime: \`${environment.node}\` on \`${environment.platform} ${environment.architecture}\`
- CPU: \`${environment.cpuModel}\` (${environment.cpuCount} logical cores)
- Libraries: ${libraryVersions}
- Samples: ${configuration.samples} timed samples after ${configuration.warmupStaticPasses} static warm-up passes and ${configuration.warmupExhaustivePasses} exhaustive warm-up pass${configuration.warmupExhaustivePasses === 1 ? '' : 'es'}
- SVG output: ${configuration.svg.pixelsPerModule} px/module with a ${configuration.svg.quietZoneModules}-module quiet zone

The charts show relative median time, where lower is better and QRCodeSDK is fixed at \`1.00×\`. Expand the exact benchmark data beneath each section for median time, min–max range, and throughput calculated from the median.

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
