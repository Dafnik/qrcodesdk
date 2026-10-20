import {spawnSync} from 'node:child_process';
import {readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const runtimeDirectory = path.dirname(fileURLToPath(import.meta.url));
const fixturesDirectory = path.join(runtimeDirectory, 'fixtures');
const fixtures = await readdir(fixturesDirectory);

for (const directory of fixtures
  .filter((name) => name !== 'templates')
  .map((name) => path.join(fixturesDirectory, name))) {
  const result = spawnSync(
    'npm',
    [
      'install',
      '--package-lock-only',
      '--ignore-scripts',
      '--strict-peer-deps',
      '--no-audit',
      '--no-fund',
      '--workspaces=false',
    ],
    {cwd: directory, stdio: 'inherit'},
  );
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Lockfile generation failed for ${directory}`);
}
