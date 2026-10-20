import {spawnSync} from 'node:child_process';
import {copyFile, glob, mkdir, rm} from 'node:fs/promises';
import path from 'node:path';

function run(args) {
  const result = spawnSync('pnpm', args, {stdio: 'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`pnpm ${args.join(' ')} failed with ${result.signal ?? result.status}`);
  }
}

await rm('.coverage', {recursive: true, force: true});
await rm('coverage', {recursive: true, force: true});
await mkdir('.coverage/raw', {recursive: true});
await mkdir('.coverage/merge', {recursive: true});
await mkdir('coverage', {recursive: true});

run(['turbo', 'run', 'test:coverage:raw']);

let reports = 0;
for await (const file of glob('.coverage/raw/*/*.json')) {
  await copyFile(file, path.join('.coverage/merge', `${reports++}.json`));
}
if (reports === 0) throw new Error('No raw coverage reports were generated');

run(['exec', 'nyc', 'merge', '.coverage/merge', 'coverage/coverage-final.json']);
run([
  'exec',
  'nyc',
  'report',
  '--temp-dir',
  'coverage',
  '--report-dir',
  'coverage',
  '--reporter=text-summary',
  '--reporter=html',
  '--reporter=lcov',
]);
