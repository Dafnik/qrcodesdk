import assert from 'node:assert/strict';
import {execFile as execFileCallback} from 'node:child_process';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import process from 'node:process';
import {test} from 'node:test';
import {pathToFileURL} from 'node:url';
import {promisify} from 'node:util';
import {gunzipSync} from 'node:zlib';

const execFile = promisify(execFileCallback);
const packageDirectory = process.cwd();
const sdkDependencyPolicy = {
  '@qrcodesdk/core': {},
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

test('runtime subpaths share the root exports', async () => {
  const packageJson = JSON.parse(
    await readFile(path.join(packageDirectory, 'package.json'), 'utf8'),
  );
  const exportsBySubpath =
    packageJson.name === '@qrcodesdk/core'
      ? {
          './matrix': ['qrcode', 'QRCodeBuilder'],
          './svg': ['QRCodeSVGRenderer'],
          './text': ['QRCodeTextRenderer'],
          './error': ['QRCodeError', 'QR_CODE_ERROR_CODES'],
        }
      : packageJson.name === '@qrcodesdk/browser'
        ? {
            './canvas': ['QRCodeCanvasRenderer'],
            './image': ['QRCodeImageRenderer', 'QRCodeDownloadImageRenderer'],
            './svg': ['QRCodeDownloadSVGRenderer'],
          }
        : {};
  if (Object.keys(exportsBySubpath).length === 0) return;
  const importTarget = (target) => import(pathToFileURL(path.join(packageDirectory, target)).href);
  const root = await importTarget(packageJson.exports['.']);
  for (const [subpath, names] of Object.entries(exportsBySubpath)) {
    const module = await importTarget(packageJson.exports[subpath]);
    for (const name of names) {
      assert.ok(root[name], `${packageJson.name} must export ${name}`);
      assert.equal(module[name], root[name], `${packageJson.name}${subpath} must share ${name}`);
    }
  }
});

test('core exposes the styler only from the drawing subpath', async () => {
  const packageJson = JSON.parse(
    await readFile(path.join(packageDirectory, 'package.json'), 'utf8'),
  );
  if (packageJson.name !== '@qrcodesdk/core') return;

  const importTarget = (target) => import(pathToFileURL(path.join(packageDirectory, target)).href);
  const root = await importTarget(packageJson.exports['.']);
  const drawing = await importTarget(packageJson.exports['./drawing']);
  assert.equal(typeof drawing.createQRCodeStyler, 'function');
  assert.equal('createQRCodeStyler' in root, false);
});

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

async function assertExactSdkDependency(packageJson, sourcePackageJson, field, name) {
  assert.equal(
    sourcePackageJson[field]?.[name],
    'workspace:*',
    `${packageJson.name} must reference ${name} with workspace:*`,
  );
  const dependencyPackageJson = JSON.parse(
    await readFile(
      path.join(packageDirectory, '..', name.slice('@qrcodesdk/'.length), 'package.json'),
      'utf8',
    ),
  );
  assert.equal(
    packageJson[field]?.[name],
    dependencyPackageJson.version,
    `${packageJson.name} must publish ${name} as an exact version before 1.0`,
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

    if (packageJson.bin === undefined) {
      const exportTargets = collectStringTargets(packageJson.exports);
      assert.ok(
        exportTargets.length > 0,
        `${packageJson.name} must declare at least one export target`,
      );
      assert.ok(
        typeof packageJson.types === 'string' || typeof packageJson.typings === 'string',
        `${packageJson.name} must declare a type declaration target`,
      );
    } else {
      assert.ok(
        collectStringTargets(packageJson.bin).length > 0,
        `${packageJson.name} must declare at least one bin target`,
      );
    }

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
    assert.ok(expectedPolicy, `${packageJson.name} must declare an SDK dependency policy`);
    for (const field of ['dependencies', 'peerDependencies']) {
      const expectedDependencies = expectedPolicy[field] ?? [];
      assert.deepEqual(
        Object.keys(collectQRCodeSdkDependencies(packageJson, field)).sort(),
        expectedDependencies,
        `${packageJson.name} must publish its SDK ${field}`,
      );
      for (const name of expectedDependencies) {
        await assertExactSdkDependency(packageJson, sourcePackageJson, field, name);
      }
    }
  } finally {
    await rm(packDirectory, {recursive: true, force: true});
  }
});
