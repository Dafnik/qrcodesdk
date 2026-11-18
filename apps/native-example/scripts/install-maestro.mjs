import {mkdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';

import {run} from './process.mjs';
import {download, tools} from './tools.mjs';

// Pin the archive and its digest rather than executing the remote install script.
const version = '2.12.1';
const bytes = await download(
  `https://github.com/mobile-dev-inc/Maestro/releases/download/cli-${version}/maestro.zip`,
  '54dbb0716425626604973cbb374c585ca30272375d9ce15177a1152765ddd9d7',
);
await mkdir(tools, {recursive: true});
const archive = path.join(tools, 'maestro.zip');
await writeFile(archive, bytes);
await rm(path.join(tools, 'maestro'), {recursive: true, force: true});
run('unzip', ['-q', '-o', archive, '-d', tools]);
await rm(archive);
