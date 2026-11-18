import {createHash} from 'node:crypto';
import {existsSync} from 'node:fs';
import {appendFile, mkdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {read, run} from './process.mjs';
import {ccache, download, tools} from './tools.mjs';

// Pin the official universal macOS binary, so a package manager upgrade cannot change the
// compiler cache version and silently invalidate every cached object.
const version = '4.14.3';
const sha256 = '764dd2a8100ff83e6bbd7b9a1e2016cc401be34bee8a70ea99698186622c34d5';

if (process.platform !== 'darwin') throw new Error('The iOS compiler cache requires macOS.');
if (process.argv.includes('--stats')) {
  run(ccache, ['--show-stats']);
} else {
  const installed = existsSync(ccache) && read(ccache, ['--version']).split('\n')[0];
  if (installed !== `ccache version ${version}`) {
    const name = `ccache-${version}-darwin`;
    const bytes = await download(
      `https://github.com/ccache/ccache/releases/download/v${version}/${name}.tar.gz`,
      sha256,
    );
    const archive = path.join(tools, `${name}.tar.gz`);
    await mkdir(path.dirname(ccache), {recursive: true});
    await writeFile(archive, bytes);
    run('tar', [
      '-xzf',
      archive,
      '-C',
      path.dirname(ccache),
      '--strip-components=1',
      `${name}/ccache`,
    ]);
    await rm(archive);
  }
  const xcode = read('xcodebuild', ['-version']);
  const compilerCache = read(ccache, ['--version']);
  const toolchain = createHash('sha256').update(xcode).update(compilerCache).digest('hex');
  process.stdout.write(`${xcode}\n${compilerCache.split('\n')[0]}\n`);
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `toolchain=${toolchain}\n`);
  }
}
