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

  if (parsedReport.schemaVersion !== 1) {
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
  const svgConfiguration = requireObject(configuration.svg, 'configuration.svg');
  requireFiniteNumber(svgConfiguration.pixelsPerModule, 'configuration.svg.pixelsPerModule');
  requireFiniteNumber(svgConfiguration.quietZoneModules, 'configuration.svg.quietZoneModules');

  if (!Array.isArray(parsedReport.results) || parsedReport.results.length === 0) {
    throw new Error('results must be a non-empty array.');
  }

  for (const [index, result] of parsedReport.results.entries()) {
    const entry = requireObject(result, `results[${index}]`);
    requireString(entry.category, `results[${index}].category`);
    requireString(entry.workloadLabel, `results[${index}].workloadLabel`);
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
  const gitRevision =
    typeof parsedReport.gitRevision === 'string' && parsedReport.gitRevision.length > 0
      ? `- Git revision: \`${parsedReport.gitRevision}\`\n`
      : '';
  const sections = CATEGORIES.map(([category, title]) => {
    const rows = parsedReport.results
      .filter((result) => result.category === category)
      .map(formatResultRow)
      .join('\n');

    if (rows.length === 0) {
      throw new Error(`No ${category} benchmark results were found.`);
    }

    return `## ${title}

| Workload | QR codes/sample | Library | Median (ms) | Min–max (ms) | QR codes/second | Time ÷ QRCodeSDK |
| --- | ---: | --- | ---: | ---: | ---: | ---: |
${rows}`;
  }).join('\n\n');
  const sourcePath = path.relative(workspaceRoot, inputPath).split(path.sep).join('/');
  const markdown = `---
title: Performance
description: Matrix and SVG generation benchmark results for QRCodeSDK and its reference libraries.
---

<!-- Generated from ${sourcePath}. Run \`pnpm --filter docs generate-performance\` to update. -->

These results compare QRCodeSDK with the two reference libraries used by the correctness suite. Benchmarks are environment-specific and should be read as relative comparisons, not universal guarantees.

## Benchmark environment

- Generated: \`${parsedReport.generatedAt}\`
${gitRevision}- Runtime: \`${environment.node}\` on \`${environment.platform} ${environment.architecture}\`
- CPU: \`${environment.cpuModel}\` (${environment.cpuCount} logical cores)
- Libraries: ${libraryVersions}
- Samples: ${configuration.samples} timed samples after ${configuration.warmupStaticPasses} static warmup passes
- SVG output: ${configuration.svg.pixelsPerModule} px/module with a ${configuration.svg.quietZoneModules}-module quiet zone

Lower median time and relative time are better. Throughput is calculated from the median. QRCodeSDK is fixed at \`1.00×\` in the relative-time column.

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
      `${path.relative(WORKSPACE_ROOT, outputPath)} is stale. Run \`pnpm --filter docs generate-performance\`.`,
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
