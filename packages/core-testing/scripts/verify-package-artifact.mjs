import assert from 'node:assert/strict';
import {execFile as execFileCallback} from 'node:child_process';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import process from 'node:process';
import {test} from 'node:test';
import {promisify} from 'node:util';
import {gunzipSync} from 'node:zlib';

const execFile = promisify(execFileCallback);
const packageDirectory = process.cwd();

function readTarEntries(gzippedTarball) {
  const tarball = gunzipSync(gzippedTarball);
  const entries = new Map();

  for (let offset = 0; offset + 512 <= tarball.length;) {
    const header = tarball.subarray(offset, offset + 512);
    if (header.every((value) => value === 0)) break;

    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/u, '');
    const prefix = header.subarray(345, 500).toString('utf8').replace(/\0.*$/u, '');
    const modeText = header.subarray(100, 108).toString('ascii').replace(/\0.*$/u, '').trim();
    const sizeText = header.subarray(124, 136).toString('ascii').replace(/\0.*$/u, '').trim();
    const mode = Number.parseInt(modeText || '0', 8);
    const size = Number.parseInt(sizeText || '0', 8);
    const entryName = prefix ? `${prefix}/${name}` : name;
    const dataOffset = offset + 512;

    entries.set(entryName, {
      data: tarball.subarray(dataOffset, dataOffset + size),
      mode,
    });
    offset = dataOffset + Math.ceil(size / 512) * 512;
  }

  return entries;
}

function collectStringTargets(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectStringTargets);
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(collectStringTargets);
  }
  return [];
}

function assertTargetExists(entries, packageName, field, target) {
  const entryName = `package/${target.replace(/^\.\//u, '')}`;
  assert.equal(
    entries.has(entryName),
    true,
    `${packageName} ${field} target must exist in the tarball: ${target}`,
  );
  return entries.get(entryName);
}

test('packed package contains every declared entrypoint', async () => {
  const packDirectory = await mkdtemp(path.join(tmpdir(), 'qrcodesdk-package-artifact-'));
  const tarballPath = path.join(packDirectory, 'package.tgz');

  try {
    await execFile('pnpm', ['pack', '--out', tarballPath], {cwd: packageDirectory});

    const entries = readTarEntries(await readFile(tarballPath));
    const packageJsonEntry = entries.get('package/package.json');
    assert.ok(packageJsonEntry, 'Packed artifact must contain package/package.json');

    const packageJson = JSON.parse(packageJsonEntry.data.toString('utf8'));

    for (const field of ['exports', 'module', 'types', 'typings']) {
      for (const target of collectStringTargets(packageJson[field])) {
        assertTargetExists(entries, packageJson.name, field, target);
      }
    }

    for (const target of collectStringTargets(packageJson.bin)) {
      const entry = assertTargetExists(entries, packageJson.name, 'bin', target);
      assert.notEqual(
        entry.mode & 0o111,
        0,
        `${packageJson.name} bin target must be executable: ${target}`,
      );
    }
  } finally {
    await rm(packDirectory, {recursive: true, force: true});
  }
});
