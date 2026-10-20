import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const directory = process.env['QRCODESDK_PACKAGES'];
assert.ok(
  directory && path.isAbsolute(directory),
  'QRCODESDK_PACKAGES must be an absolute directory',
);
await mkdir(directory, {recursive: true});

for (const name of ['core', 'browser', 'node', 'cli', 'react', 'angular', 'vue', 'svelte']) {
  const result = spawnSync(
    'pnpm',
    ['--dir', `packages/${name}`, 'pack', '--pack-destination', directory],
    {
      stdio: 'inherit',
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Packing @qrcodesdk/${name} failed`);
}
