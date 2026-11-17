import {createHash} from 'node:crypto';
import {mkdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {run} from './process.mjs';

const directory = fileURLToPath(new URL('../.tools/', import.meta.url));
// Pin the archive and its digest rather than executing the remote install script.
const version = '2.12.1';
const sha256 = '54dbb0716425626604973cbb374c585ca30272375d9ce15177a1152765ddd9d7';
const response = await fetch(
  `https://github.com/mobile-dev-inc/Maestro/releases/download/cli-${version}/maestro.zip`,
);
if (!response.ok) throw new Error(`Unable to download Maestro: HTTP ${response.status}`);
const bytes = new Uint8Array(await response.arrayBuffer());
if (createHash('sha256').update(bytes).digest('hex') !== sha256)
  throw new Error('Maestro archive checksum mismatch');
await mkdir(directory, {recursive: true});
const archive = path.join(directory, 'maestro.zip');
await writeFile(archive, bytes);
await rm(path.join(directory, 'maestro'), {recursive: true, force: true});
run('unzip', ['-q', '-o', archive, '-d', directory]);
await rm(archive);
