import type {QRCodeStylingFixture, QRCodeTestFixture} from '@repo/core-testing';
import {describe, expect, test, vi} from 'vitest';

import {
  executeStyledWorkload,
  executeWorkload,
  rotateAdapters,
  timedStyledWorkload,
  timedWorkload,
} from '../src/runner';
import type {BenchmarkAdapter, BenchmarkWorkload, StyledSVGAdapter} from '../src/types';

const fixture: QRCodeTestFixture = {
  name: 'fixture',
  data: '1',
  mode: 'numeric',
  version: 1,
  mask: 0,
};
const stylingFixture: QRCodeStylingFixture = {
  name: 'styled-fixture',
  data: '1',
  matrixOptions: {version: 1, mode: 'numeric'},
  styling: {moduleSize: 5, quietZone: 4},
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

function styledAdapter(
  id: StyledSVGAdapter['id'],
  value = 1,
  prepare?: StyledSVGAdapter['prepare'],
): StyledSVGAdapter {
  return {
    id,
    label: id,
    version: '1.0.0',
    ...(prepare === undefined ? {} : {prepare}),
    styledSvg: vi.fn(async () => value),
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

  test('uses matrix generation for automatic fixtures', () => {
    const target = adapter('qrcodesdk', 7);

    expect(executeWorkload(target, 'automatic', workload)).toBe(42);
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

  test('balances every adapter position across a complete rotation', () => {
    const adapters = [adapter('qrcodesdk'), adapter('qrcode'), adapter('qrcode-generator')];
    const rotations = Array.from({length: adapters.length}, (_, sampleIndex) =>
      rotateAdapters(adapters, sampleIndex),
    );

    for (const target of adapters) {
      const positions = rotations.map((rotation) => rotation.indexOf(target));
      expect(positions.sort()).toEqual([0, 1, 2]);
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

  test('awaits styled SVG generation and accumulates its checksum', async () => {
    const target = styledAdapter('qrcodesdk', 7);
    const workload: BenchmarkWorkload<QRCodeStylingFixture> = {
      id: 'styled-test',
      label: 'Styled test',
      fixtures: [stylingFixture, stylingFixture],
      repetitions: 3,
      qrCodesPerSample: 6,
    };

    await expect(executeStyledWorkload(target, workload)).resolves.toBe(42);
    expect(target.styledSvg).toHaveBeenCalledTimes(6);
  });

  test('prepares styled adapters before starting the timer', async () => {
    const events: string[] = [];
    const target = styledAdapter('qrcodesdk', 2, async () => {
      events.push('prepare');
    });
    vi.mocked(target.styledSvg).mockImplementation(async () => {
      events.push('operation');
      return 2;
    });
    const workload: BenchmarkWorkload<QRCodeStylingFixture> = {
      id: 'styled-test',
      label: 'Styled test',
      fixtures: [stylingFixture],
      repetitions: 1,
      qrCodesPerSample: 1,
    };
    const clock = vi.spyOn(process.hrtime, 'bigint');
    clock.mockImplementationOnce(() => {
      events.push('clock-start');
      return 1n;
    });
    clock.mockImplementationOnce(() => {
      events.push('clock-end');
      return 2n;
    });

    await expect(timedStyledWorkload(target, workload)).resolves.toMatchObject({checksum: 2});
    expect(events).toEqual(['prepare', 'clock-start', 'operation', 'clock-end']);
    clock.mockRestore();
  });

  test('propagates styled SVG generation failures', async () => {
    const target = styledAdapter('qr-code-styling');
    vi.mocked(target.styledSvg).mockRejectedValue(new Error('render failed'));
    const workload: BenchmarkWorkload<QRCodeStylingFixture> = {
      id: 'styled-test',
      label: 'Styled test',
      fixtures: [stylingFixture],
      repetitions: 1,
      qrCodesPerSample: 1,
    };

    await expect(executeStyledWorkload(target, workload)).rejects.toThrow('render failed');
  });
});
