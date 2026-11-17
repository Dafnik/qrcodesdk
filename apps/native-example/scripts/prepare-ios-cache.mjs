import {execFileSync, spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {appendFile} from 'node:fs/promises';
import process from 'node:process';

import {run} from './process.mjs';

if (process.platform !== 'darwin') throw new Error('The iOS compiler cache requires macOS.');
if (process.argv.includes('--stats')) {
  run('ccache', ['--show-stats']);
} else {
  if (spawnSync('ccache', ['--version'], {stdio: 'ignore'}).error?.code === 'ENOENT') {
    run('brew', ['install', 'ccache'], {
      env: {...process.env, HOMEBREW_NO_AUTO_UPDATE: '1', HOMEBREW_NO_INSTALL_CLEANUP: '1'},
    });
  }
  const xcode = execFileSync('xcodebuild', ['-version'], {encoding: 'utf8'});
  const compilerCache = execFileSync('ccache', ['--version'], {encoding: 'utf8'});
  const toolchain = createHash('sha256').update(xcode).update(compilerCache).digest('hex');
  process.stdout.write(xcode + compilerCache);
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `toolchain=${toolchain}\n`);
  }
}
