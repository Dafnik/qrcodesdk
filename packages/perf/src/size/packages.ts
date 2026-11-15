import {execFile} from 'node:child_process';
import path from 'node:path';
import {promisify} from 'node:util';

import {WORKSPACE_ROOT} from '../paths.ts';
import type {PackageSizeResult} from '../report-types.ts';

const run = promisify(execFile);

/** Directories that `npm publish` packs, following each package's `publishConfig.directory`. */
const PUBLISHED = [
  'packages/core',
  'packages/browser',
  'packages/node',
  'packages/react',
  'packages/vue',
  'packages/svelte',
  'packages/angular/dist/angular',
  'packages/cli',
];

type PackResult = {
  name: string;
  version: string;
  size: number;
  unpackedSize: number;
  entryCount: number;
};

/** Measures the published package size of every QRCodeSDK package, without packing to disk. */
export async function measurePackages(): Promise<PackageSizeResult[]> {
  return Promise.all(
    PUBLISHED.map(async (directory) => {
      const {stdout} = await run('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
        cwd: path.join(WORKSPACE_ROOT, directory),
        maxBuffer: 16 * 1024 * 1024,
      });
      const [result] = JSON.parse(stdout) as PackResult[];
      if (!result) throw new Error(`npm pack returned nothing for ${directory}`);
      return {
        name: result.name,
        version: result.version,
        packed: result.size,
        unpacked: result.unpackedSize,
        files: result.entryCount,
      };
    }),
  );
}
