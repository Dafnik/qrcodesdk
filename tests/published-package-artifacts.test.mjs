import assert from 'node:assert/strict';
import {execFile as execFileCallback} from 'node:child_process';
import {mkdtemp, readFile, readdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {gunzipSync} from 'node:zlib';

import {PACKAGE_POLICIES} from './fixtures/package-policies.mjs';

const execFile = promisify(execFileCallback);
const workspaceRoot = path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)));

function readTarEntries(gzippedTarball) {
  const tarball = gunzipSync(gzippedTarball);
  const entries = new Map();

  for (let offset = 0; offset + 512 <= tarball.length;) {
    const header = tarball.subarray(offset, offset + 512);
    if (header.every((value) => value === 0)) break;

    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/u, '');
    const prefix = header.subarray(345, 500).toString('utf8').replace(/\0.*$/u, '');
    const modeText = header.subarray(100, 108).toString('ascii').replace(/\0.*$/u, '').trim();
    const mode = Number.parseInt(modeText || '0', 8);
    const sizeText = header.subarray(124, 136).toString('ascii').replace(/\0.*$/u, '').trim();
    const size = Number.parseInt(sizeText || '0', 8);
    const entryName = prefix ? `${prefix}/${name}` : name;
    const dataOffset = offset + 512;

    entries.set(entryName, {data: tarball.subarray(dataOffset, dataOffset + size), mode});
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
    `${packageName} ${field} target must exist: ${target}`,
  );
  return entries.get(entryName);
}

function assertPackageArtifacts(entries, packageJson) {
  for (const target of collectStringTargets(packageJson.exports)) {
    assertTargetExists(entries, packageJson.name, 'exports', target);
  }

  for (const field of ['module', 'types', 'typings']) {
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

  for (const file of ['README.md', 'CHANGELOG.md', 'LICENSE']) {
    assert.equal(
      entries.has(`package/${file}`),
      true,
      `${packageJson.name} tarball must contain ${file}`,
    );
  }
}

function assertPackageMetadata(packageJson, policy) {
  assert.equal(packageJson.name, policy.name);
  assert.equal(packageJson.private, false);
  assert.equal(packageJson.sideEffects, false);
  assert.equal(packageJson.type, 'module');

  if (policy.nodeEngine === undefined) {
    assert.equal(Object.hasOwn(packageJson, 'engines'), false);
  } else {
    assert.deepEqual(packageJson.engines, {node: policy.nodeEngine});
  }

  if (policy.kind === 'library') {
    assert.equal(packageJson.exports['.'], './dist/index.mjs');
    assert.equal(packageJson.exports['./package.json'], './package.json');
  } else if (policy.kind === 'cli') {
    assert.deepEqual(packageJson.bin, {qrc: './dist/bin.mjs'});
  } else {
    assert.equal(packageJson.module, 'fesm2022/qrcodesdk-angular.mjs');
    assert.equal(packageJson.exports['.'].default, './fesm2022/qrcodesdk-angular.mjs');
  }
}

test('packed public packages preserve the runtime metadata contract', async () => {
  const packDirectory = await mkdtemp(path.join(tmpdir(), 'qrcodesdk-package-artifacts-'));

  try {
    for (const policy of PACKAGE_POLICIES) {
      const before = new Set(await readdir(packDirectory));
      await execFile(
        'pnpm',
        ['--dir', `packages/${policy.directory}`, 'pack', '--pack-destination', packDirectory],
        {cwd: workspaceRoot},
      );
      const tarballName = (await readdir(packDirectory)).find((name) => !before.has(name));
      assert.ok(tarballName?.endsWith('.tgz'), `Expected a tarball for ${policy.name}`);

      const tarball = await readFile(path.join(packDirectory, tarballName));
      const entries = readTarEntries(tarball);
      const packageJsonEntry = entries.get('package/package.json');
      assert.ok(packageJsonEntry, `${policy.name} tarball must contain package/package.json`);

      const packageJson = JSON.parse(packageJsonEntry.data.toString('utf8'));
      assertPackageMetadata(packageJson, policy);
      assertPackageArtifacts(entries, packageJson);

      if (policy.name === '@qrcodesdk/core') {
        assert.equal(
          [...entries.keys()].some((entry) => entry.startsWith('package/runtime/')),
          false,
          'Core runtime fixtures must not be published',
        );
      }
    }
  } finally {
    await rm(packDirectory, {recursive: true, force: true});
  }
});
