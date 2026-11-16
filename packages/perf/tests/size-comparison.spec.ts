import {expect, test} from 'vitest';

import baseline from '../baseline/size.json';
import {formatSizeComparison, parseSizeSummary} from '../src/size/comparison.ts';

function report() {
  return structuredClone(baseline);
}

test('compares all bundlers, split chunks and package sizes without enforcing budgets', () => {
  const before = report();
  const after = report();
  after.scenarios[0]!.vite.total.gzip += 100_000;
  after.scenarios[0]!.vite.initial.gzip += 100_000;
  after.packages[0]!.packed += 10;
  const markdown = formatSizeComparison(parseSizeSummary(before), parseSizeSummary(after));
  expect(markdown).toContain('+100,000 B');
  expect(markdown).toContain('initial gzip');
  expect(markdown).toContain('lazy gzip');
  expect(markdown).toContain('esbuild gzip');
  expect(markdown).toContain('webpack gzip');
  expect(markdown).toContain('+10 B');
  expect(markdown).toContain('Unchanged measurements');
  expect(markdown).toContain('informational');
});

test('reports additions, removals and bundler failures explicitly', () => {
  const before = parseSizeSummary(report());
  const after = parseSizeSummary(report());
  after.scenarios[0]!.id = 'new';
  after.scenarios[0]!.problems.push('webpack failed');
  delete after.scenarios[0]!.bundles.webpack;
  const markdown = formatSizeComparison(before, after);
  expect(markdown).toContain('New');
  expect(markdown).toContain('Removed');
  expect(markdown).toContain('webpack failed');
});

test('escapes artifact text so it cannot inject Markdown, HTML or mentions', () => {
  const after = parseSizeSummary(report());
  after.scenarios[0]!.id = '<script>|`@everyone\n';
  after.scenarios[0]!.problems = ['<img> @someone | bad'];
  const markdown = formatSizeComparison(parseSizeSummary(report()), after);
  expect(markdown).not.toContain('<script>');
  expect(markdown).not.toContain('<img>');
  expect(markdown).not.toContain('@everyone');
  expect(markdown).not.toContain('@someone');
  expect(markdown).toContain('&#124;');
});

test('rejects malformed, partial and ambiguous artifacts', () => {
  expect(() => parseSizeSummary({})).toThrow();
  const invalid = report();
  invalid.scenarios[0]!.vite.total.gzip = -1;
  expect(() => parseSizeSummary(invalid)).toThrow('byte count');
  const duplicate = report();
  duplicate.scenarios.push(duplicate.scenarios[0]!);
  expect(() => parseSizeSummary(duplicate)).toThrow('Duplicate');
  expect(() => parseSizeSummary({...report(), packages: []})).toThrow('incomplete');
  expect(() => parseSizeSummary({...report(), commit: '<script>'})).toThrow('commit');
  expect(() => parseSizeSummary({...report(), generatedAt: 'invalid'})).toThrow('date');
});
