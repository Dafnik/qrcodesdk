// Type-only and without a file extension, so the docs can import this module as well.
import type {SizeReport} from '../report-types';

/** A scenario may grow by this share of its gzip size before the check fails. */
export const BUDGET_RATIO = 0.01;
/** Growth below this many gzip bytes always passes, so tiny scenarios are not too strict. */
export const BUDGET_MIN_BYTES = 64;

export type BudgetResult = {
  readonly failures: readonly string[];
  readonly notes: readonly string[];
};

export function allowedGrowth(baselineGzip: number): number {
  return Math.max(BUDGET_MIN_BYTES, Math.ceil(baselineGzip * BUDGET_RATIO));
}

/** Compares the Vite gzip size of every scenario with the committed baseline. */
export function checkBudgets(current: SizeReport, baseline: SizeReport): BudgetResult {
  const failures: string[] = [];
  const notes: string[] = [];
  const previous = new Map(baseline.scenarios.map((scenario) => [scenario.id, scenario]));

  for (const scenario of current.scenarios) {
    for (const problem of scenario.problems) failures.push(`${scenario.id}: ${problem}`);
    const before = previous.get(scenario.id);
    if (!before) {
      failures.push(`${scenario.id}: not in the baseline. Update the baseline to add it.`);
      continue;
    }
    const growth = scenario.vite.total.gzip - before.vite.total.gzip;
    const allowed = allowedGrowth(before.vite.total.gzip);
    if (growth > allowed) {
      failures.push(
        `${scenario.id}: grew by ${growth} B gzip (${before.vite.total.gzip} B → ${scenario.vite.total.gzip} B), more than the allowed ${allowed} B.`,
      );
    } else if (growth < -allowed) {
      notes.push(
        `${scenario.id}: shrank by ${-growth} B gzip. Update the baseline to keep the gain.`,
      );
    }
  }
  for (const id of previous.keys()) {
    if (!current.scenarios.some((scenario) => scenario.id === id)) {
      notes.push(`${id}: in the baseline but no longer measured.`);
    }
  }
  return {failures, notes};
}
