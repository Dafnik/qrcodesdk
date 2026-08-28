import {QR_CODE_TEST_FIXTURES} from '@repo/core-testing';
import qrcodeGenerator from 'qrcode-generator';
import {describe, expect, test} from 'vitest';

import {ɵMODES} from '@qrcodesdk/core';

import {BENCHMARK_ADAPTERS} from '../src/adapters';
import {AUTOMATIC_QR_CODE_TEST_FIXTURES} from '../src/workloads';

describe('benchmark adapters', () => {
  const fixtures = ɵMODES.map((mode) =>
    QR_CODE_TEST_FIXTURES.find((fixture) => fixture.mode === mode)!,
  );

  test.each(BENCHMARK_ADAPTERS)(
    '$label produces native matrix results for every mode',
    (adapter) => {
      adapter.prepare?.();
      for (const fixture of fixtures) {
        expect(adapter.matrix(fixture)).toBe(17 + 4 * fixture.version!);
      }
    },
  );

  test.each(BENCHMARK_ADAPTERS)(
    '$label automatically selects a version and mask for every static fixture',
    (adapter) => {
      adapter.prepare?.();
      for (const fixture of AUTOMATIC_QR_CODE_TEST_FIXTURES) {
        expect(adapter.matrix(fixture)).toBeGreaterThan(0);
      }
    },
  );

  test.each(BENCHMARK_ADAPTERS)(
    '$label produces non-empty SVG results for every mode',
    (adapter) => {
      adapter.prepare?.();
      for (const fixture of fixtures) {
        expect(adapter.svg(fixture)).toBeGreaterThan(0);
      }
    },
  );

  test('restores the stock qrcode-generator byte converter before a workload', () => {
    const adapter = BENCHMARK_ADAPTERS.find(({id}) => id === 'qrcode-generator')!;
    qrcodeGenerator.stringToBytes = () => [999];

    adapter.prepare?.();

    expect(qrcodeGenerator.stringToBytes('ASCII')).toEqual([65, 83, 67, 73, 73]);
    expect(qrcodeGenerator.stringToBytes('é')).toEqual([233]);
  });
});
