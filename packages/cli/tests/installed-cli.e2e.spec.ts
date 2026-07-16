import {execFile as execFileCallback} from 'node:child_process';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';

import packageJson from '../package.json' with {type: 'json'};

const execFile = promisify(execFileCallback);
const repositoryRoot = fileURLToPath(new URL('../../..', import.meta.url));

describe('installed qrc executable', () => {
  let installationDirectory: string;
  let qrcExecutable: string;

  beforeAll(async () => {
    installationDirectory = await mkdtemp(path.join(tmpdir(), 'qrcodesdk-cli-'));
    const tarballs = await Promise.all(
      ['core', 'node', 'cli'].map(async (packageName) => {
        const tarball = path.join(installationDirectory, `${packageName}.tgz`);
        await execFile('pnpm', ['-C', `packages/${packageName}`, 'pack', '--out', tarball], {
          cwd: repositoryRoot,
        });
        return tarball;
      }),
    );

    await writeFile(
      path.join(installationDirectory, 'package.json'),
      `${JSON.stringify({name: 'qrcodesdk-cli-install-test', private: true}, undefined, 2)}\n`,
    );
    await execFile(
      'npm',
      [
        'install',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--package-lock=false',
        ...tarballs,
      ],
      {cwd: installationDirectory},
    );

    qrcExecutable = path.join(
      installationDirectory,
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'qrc.cmd' : 'qrc',
    );
  }, 120_000);

  afterAll(async () => {
    if (installationDirectory !== undefined) {
      await rm(installationDirectory, {recursive: true, force: true});
    }
  });

  test('prints the packaged CLI version', async () => {
    const {stderr, stdout} = await execFile(qrcExecutable, ['-V'], {
      cwd: installationDirectory,
      shell: process.platform === 'win32',
    });

    expect(stdout).toBe(`${packageJson.version}\n`);
    expect(stderr).toBe('');
  });

  test('creates an SVG file', async () => {
    await execFile(qrcExecutable, ['HELLO WORLD', '--output', 'code.svg'], {
      cwd: installationDirectory,
      shell: process.platform === 'win32',
    });

    const svg = await readFile(path.join(installationDirectory, 'code.svg'), 'utf8');
    expect(svg).toContain('<svg ');
  });
});
