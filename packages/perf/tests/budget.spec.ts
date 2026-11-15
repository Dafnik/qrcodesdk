import {expect, test} from 'vitest';

import type {SizeReport, SizeScenarioResult} from '../src/report-types.ts';
import {allowedGrowth, checkBudgets} from '../src/size/budget.ts';

function scenario(id: string, gzip: number, problems: string[] = []): SizeScenarioResult {
  const sizes = {min: gzip * 3, gzip, brotli: gzip};
  return {
    id,
    title: id,
    group: 'Test',
    description: '',
    features: [],
    vite: {
      total: sizes,
      initial: sizes,
      lazy: {min: 0, gzip: 0, brotli: 0},
      sdkBytes: 0,
      areas: {},
      chunks: [],
      duplicates: [],
    },
    problems,
    warnings: [],
  };
}

function report(...scenarios: SizeScenarioResult[]): SizeReport {
  return {
    schemaVersion: 1,
    kind: 'size',
    generatedAt: '',
    commit: '',
    environment: {os: '', cpu: '', cores: 1, memoryGB: 1, node: ''},
    tools: {},
    features: [],
    areas: [],
    scenarios,
    packages: [],
  };
}

test('allows 1% or 64 bytes of growth, whichever is larger', () => {
  expect(allowedGrowth(1_000)).toBe(64);
  expect(allowedGrowth(20_000)).toBe(200);
});

test('fails on growth beyond the budget, inclusion problems, and new scenarios', () => {
  const baseline = report(scenario('small', 1_000), scenario('large', 20_000), scenario('gone', 1));
  const current = report(
    scenario('small', 1_064),
    scenario('large', 20_201, ['contains core:micro (10 B) without using it']),
    scenario('new', 10),
  );
  const {failures, notes} = checkBudgets(current, baseline);
  expect(failures).toEqual([
    'large: contains core:micro (10 B) without using it',
    expect.stringContaining('large: grew by 201 B gzip'),
    'new: not in the baseline. Update the baseline to add it.',
  ]);
  expect(notes).toEqual(['gone: in the baseline but no longer measured.']);
});

test('notes savings so the baseline can keep them', () => {
  const {failures, notes} = checkBudgets(report(scenario('a', 900)), report(scenario('a', 1_000)));
  expect(failures).toEqual([]);
  expect(notes).toEqual(['a: shrank by 100 B gzip. Update the baseline to keep the gain.']);
});
