import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {expect, test} from 'vitest';

import {build} from '../src/size/bundlers.ts';
import {summarizeCheck} from '../src/size/measure.ts';

test('esbuild keeps dynamically imported entry chunks out of the initial download', async () => {
  const appDir = await mkdtemp(path.join(os.tmpdir(), 'perf-split-'));
  try {
    await writeFile(path.join(appDir, 'main.js'), "globalThis.load = () => import('./lazy.js');");
    await writeFile(path.join(appDir, 'lazy.js'), 'export const value = Math.random();');
    const output = await build('esbuild', {appDir});
    expect(output.chunks.filter((chunk) => chunk.isEntry)).toHaveLength(1);
    const result = summarizeCheck(output);
    expect(result.lazy.min).toBeGreaterThan(0);
    expect(result.initial.min).toBeLessThan(result.total.min);
  } finally {
    await rm(appDir, {recursive: true, force: true});
  }
});
