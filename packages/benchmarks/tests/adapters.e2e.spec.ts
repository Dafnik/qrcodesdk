import {QR_CODE_TEST_FIXTURES} from '@repo/core-testing';
import {describe, expect, test} from 'vitest';

import {BENCHMARK_ADAPTERS} from '../src/adapters';

describe('benchmark adapters', () => {
  const fixture = QR_CODE_TEST_FIXTURES[0]!;

  test.each(BENCHMARK_ADAPTERS)('$label produces a native matrix result', (adapter) => {
    expect(adapter.matrix(fixture)).toBe(21);
  });

  test.each(BENCHMARK_ADAPTERS)('$label produces a non-empty SVG result', (adapter) => {
    expect(adapter.svg(fixture)).toBeGreaterThan(0);
  });
});
