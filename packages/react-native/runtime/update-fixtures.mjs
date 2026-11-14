import {spawnSync} from 'node:child_process';
import {readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const fixturesDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

for (const name of await readdir(fixturesDirectory)) {
  const directory = path.join(fixturesDirectory, name);
  // React Native packages declare `react-native: *` peers that npm's strict peer resolution
  // satisfies with the latest release, so the fixtures use legacy peer resolution.
  const result = spawnSync(
    'npm',
    [
      'install',
      '--package-lock-only',
      '--ignore-scripts',
      '--legacy-peer-deps',
      '--no-audit',
      '--no-fund',
      '--workspaces=false',
    ],
    {cwd: directory, stdio: 'inherit'},
  );
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Lockfile generation failed for ${directory}`);
}
