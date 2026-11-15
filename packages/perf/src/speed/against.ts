import {Buffer} from 'node:buffer';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {CACHE_ROOT, WORKSPACE_ROOT} from '../paths.ts';

function exec(
  command: string,
  args: readonly string[],
  cwd: string,
  quiet = false,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ['ignore', 'pipe', quiet ? 'pipe' : 'inherit'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk;
      if (!quiet) process.stdout.write(chunk);
    });
    child.stderr?.on('data', (chunk: Buffer) => (stderr += chunk));
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0
        ? resolve(stdout)
        : reject(new Error(`${command} ${args.join(' ')} exited with ${code}\n${stderr}`)),
    );
  });
}

/**
 * Checks out `ref` in a detached worktree under `.cache/against`, installs its dependencies,
 * and builds the packages the speed workloads load. Checkouts are reused per commit.
 */
export async function prepareAgainst(ref: string): Promise<{root: string; commit: string}> {
  const commit = (
    await exec('git', ['rev-parse', '--verify', `${ref}^{commit}`], WORKSPACE_ROOT, true)
  ).trim();
  const root = path.join(CACHE_ROOT, 'against', commit.slice(0, 12));
  if (!existsSync(root)) {
    await mkdir(path.dirname(root), {recursive: true});
    console.log(
      `Checking out ${ref} (${commit.slice(0, 12)}) in ${path.relative(process.cwd(), root)}…`,
    );
    await exec('git', ['worktree', 'add', '--detach', root, commit], WORKSPACE_ROOT, true);
  }
  console.log(`Installing and building ${ref}…`);
  await exec('pnpm', ['install', '--frozen-lockfile', '--prefer-offline'], root, true);
  await exec(
    'pnpm',
    [
      'turbo',
      'run',
      'build',
      '--filter=@qrcodesdk/core',
      '--filter=@qrcodesdk/browser',
      '--filter=@qrcodesdk/node',
      '--output-logs=errors-only',
    ],
    root,
    true,
  );
  return {root, commit};
}
