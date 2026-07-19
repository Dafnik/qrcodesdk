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

function adapter(
  id: BenchmarkAdapter['id'],
  value = 1,
  prepare?: BenchmarkAdapter['prepare'],
): BenchmarkAdapter {
  return {
    id,
    label: id,
    version: '1.0.0',
    ...(prepare === undefined ? {} : {prepare}),
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
    const prepare = vi.fn();
    const target = adapter('qrcodesdk', 7, prepare);

    expect(executeWorkload(target, 'matrix', workload)).toBe(42);
    expect(prepare).toHaveBeenCalledOnce();
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

  test('balances every adapter position across five samples', () => {
    const adapters = [
      adapter('qrcodesdk'),
      adapter('qrcode'),
      adapter('qrcode-generator-default'),
      adapter('qrcode-generator'),
      adapter('qrcode-generator-utf8'),
    ];
    const rotations = Array.from({length: 5}, (_, sampleIndex) =>
      rotateAdapters(adapters, sampleIndex),
    );

    for (const target of adapters) {
      const positions = rotations.map((rotation) => rotation.indexOf(target));
      expect(positions.sort()).toEqual([0, 1, 2, 3, 4]);
    }
  });

  test('prepares before timing and returns elapsed time and checksum', () => {
    const events: string[] = [];
    const target = adapter('qrcodesdk', 2, () => events.push('prepare'));
    const matrix = vi.mocked(target.matrix);
    matrix.mockImplementation(() => {
      events.push('operation');
      return 2;
    });
    const clock = vi.spyOn(process.hrtime, 'bigint');
    clock.mockImplementationOnce(() => {
      events.push('clock-start');
      return 1n;
    });
    clock.mockImplementationOnce(() => {
      events.push('clock-end');
      return 2n;
    });

    const measurement = timedWorkload(target, 'matrix', workload);

    expect(measurement.checksum).toBe(12);
    expect(measurement.elapsedMs).toBeGreaterThanOrEqual(0);
    expect(events).toEqual([
      'prepare',
      'clock-start',
      ...Array.from({length: 6}, () => 'operation'),
      'clock-end',
    ]);
    clock.mockRestore();
  });
});
