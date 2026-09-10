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
const sdkDependencyPolicy = {
  '@qrcodesdk/angular': {
    dependencies: ['@qrcodesdk/browser', '@qrcodesdk/core'],
  },
  '@qrcodesdk/browser': {
    peerDependencies: ['@qrcodesdk/core'],
  },
  '@qrcodesdk/cli': {
    dependencies: ['@qrcodesdk/core', '@qrcodesdk/node'],
  },
  '@qrcodesdk/node': {
    peerDependencies: ['@qrcodesdk/core'],
  },
  '@qrcodesdk/react': {
    dependencies: ['@qrcodesdk/browser', '@qrcodesdk/core'],
  },
  '@qrcodesdk/svelte': {
    dependencies: ['@qrcodesdk/browser', '@qrcodesdk/core'],
  },
  '@qrcodesdk/vue': {
    dependencies: ['@qrcodesdk/browser', '@qrcodesdk/core'],
  },
};

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

function collectQRCodeSdkDependencies(packageJson, field) {
  return Object.fromEntries(
    Object.entries(packageJson[field] ?? {}).filter(([name]) => name.startsWith('@qrcodesdk/')),
  );
}

function assertExactSdkDependency(packageJson, sourcePackageJson, field, name) {
  const sourceSpecifier = sourcePackageJson[field]?.[name];
  assert.match(
    sourceSpecifier ?? '',
    /^workspace:\d+\.\d+\.\d+$/u,
    `${packageJson.name} must pin ${name} with an exact workspace version before 1.0`,
  );
  assert.equal(
    packageJson[field]?.[name],
    sourceSpecifier.slice('workspace:'.length),
    `${packageJson.name} must publish ${name} as an exact version`,
  );
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
    const sourcePackageJson = JSON.parse(
      await readFile(path.join(packageDirectory, 'package.json'), 'utf8'),
    );

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

    const expectedPolicy = sdkDependencyPolicy[packageJson.name];
    if (expectedPolicy) {
      for (const field of ['dependencies', 'peerDependencies']) {
        const expectedDependencies = expectedPolicy[field] ?? [];
        assert.deepEqual(
          Object.keys(collectQRCodeSdkDependencies(packageJson, field)).sort(),
          expectedDependencies,
          `${packageJson.name} must publish its SDK ${field}`,
        );
        for (const name of expectedDependencies) {
          assertExactSdkDependency(packageJson, sourcePackageJson, field, name);
        }
      }
    }
  } finally {
    await rm(packDirectory, {recursive: true, force: true});
  }
});
