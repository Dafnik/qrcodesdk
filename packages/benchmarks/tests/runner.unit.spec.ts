import type {QRCodeTestFixture} from '@repo/core-testing';
import {describe, expect, test, vi} from 'vitest';

import {executeWorkload, rotateAdapters, timedWorkload} from '../src/runner';
import type {BenchmarkAdapter, BenchmarkWorkload} from '../src/types';

const fixture: QRCodeTestFixture = {
  name: 'fixture',
  data: '1',
  mode: 'numeric',
  version: 1,
  mask: 0,
};

function adapter(id: BenchmarkAdapter['id'], value = 1): BenchmarkAdapter {
  return {
    id,
    label: id,
    version: '1.0.0',
    matrix: vi.fn(() => value),
    svg: vi.fn(() => value * 2),
  };
}

describe('benchmark runner', () => {
  const workload: BenchmarkWorkload = {
    id: 'test',
    label: 'Test',
    fixtures: [fixture, fixture],
    repetitions: 3,
    qrCodesPerSample: 6,
  };

  test('executes each fixture for every repetition and consumes results', () => {
    const target = adapter('qrcodesdk', 7);

    expect(executeWorkload(target, 'matrix', workload)).toBe(42);
    expect(target.matrix).toHaveBeenCalledTimes(6);
    expect(target.svg).not.toHaveBeenCalled();
  });

  test('rotates library order without mutating the source list', () => {
    const adapters = [adapter('qrcodesdk'), adapter('qrcode'), adapter('qrcode-generator')];

    expect(rotateAdapters(adapters, 1).map(({id}) => id)).toEqual([
      'qrcode',
      'qrcode-generator',
      'qrcodesdk',
    ]);
    expect(adapters.map(({id}) => id)).toEqual(['qrcodesdk', 'qrcode', 'qrcode-generator']);
  });

  test('returns elapsed time and checksum for a timed workload', () => {
    const measurement = timedWorkload(adapter('qrcodesdk', 2), 'matrix', workload);

    expect(measurement.checksum).toBe(12);
    expect(measurement.elapsedMs).toBeGreaterThanOrEqual(0);
  });
});
