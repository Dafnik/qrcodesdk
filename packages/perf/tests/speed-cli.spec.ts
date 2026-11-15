import {beforeEach, expect, test, vi} from 'vitest';

const mocks = vi.hoisted(() => ({
  values: {} as Record<string, string | boolean>,
  writeFile: vi.fn(),
  run: vi.fn(),
  bundle: vi.fn(),
}));
vi.mock('node:util', async (original) => ({
  ...(await original<typeof import('node:util')>()),
  parseArgs: () => ({values: mocks.values}),
}));
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(),
  readFile: vi.fn().mockRejectedValue(new Error('missing')),
  writeFile: mocks.writeFile,
}));
vi.mock('../src/speed/bundle.ts', () => ({bundleGroup: mocks.bundle}));
vi.mock('../src/speed/workloads/index.ts', () => ({
  WORKLOAD_GROUPS: ['matrix'],
  WORKLOAD_GROUP_TITLES: {matrix: 'Matrix'},
}));
vi.mock('../src/speed/runners.ts', () => ({
  createNodeRunner: () => ({
    list: async () => [{id: 'matrix/test', title: 'Test', features: ['matrix']}],
    run: mocks.run,
    close: vi.fn(),
  }),
  createBrowserRunner: vi.fn(),
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mocks.values = {target: 'node', 'update-baseline': true};
  mocks.bundle.mockResolvedValue({ok: true, entry: 'entry.js'});
  mocks.run.mockResolvedValue({samples: [100, 101, 102], batch: 1});
});

test.each(['0', '-1', 'NaN', '1.5', 'Infinity'])(
  'rejects invalid round count %s before bundling',
  async (rounds) => {
    mocks.values['rounds'] = rounds;
    await expect(import('../src/speed/cli.ts')).rejects.toThrow('--rounds');
    expect(mocks.bundle).not.toHaveBeenCalled();
    expect(mocks.writeFile).not.toHaveBeenCalled();
  },
);

test('preserves the baseline when a workload fails, but writes local diagnostics', async () => {
  mocks.run.mockRejectedValue(new Error('workload failed'));
  await expect(import('../src/speed/cli.ts')).rejects.toThrow('every workload must succeed');
  expect(mocks.writeFile).toHaveBeenCalledTimes(1);
  expect(mocks.writeFile.mock.calls[0]![0]).toMatch(/reports\/speed.json$/);
});

test('promotes successful measurements to the baseline', async () => {
  await import('../src/speed/cli.ts');
  expect(mocks.writeFile).toHaveBeenCalledTimes(2);
  expect(mocks.writeFile.mock.calls[1]![0]).toMatch(/baseline\/speed.json$/);
});
