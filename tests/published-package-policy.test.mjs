import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

import {PACKAGE_POLICIES} from './fixtures/package-policies.mjs';

const workspaceRoot = path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const packagesDirectory = path.join(workspaceRoot, 'packages');
const packagePoliciesByName = new Map(PACKAGE_POLICIES.map(({name, ...policy}) => [name, policy]));

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

test('every published package follows its declared runtime metadata policy', async () => {
  const directoryEntries = await readdir(packagesDirectory, {withFileTypes: true});
  const publishedPackages = [];

  for (const entry of directoryEntries) {
    if (!entry.isDirectory()) continue;

    const packageJsonPath = path.join(packagesDirectory, entry.name, 'package.json');
    let packageJson;
    try {
      packageJson = await readJson(packageJsonPath);
    } catch (error) {
      if (error?.code === 'ENOENT') continue;
      throw error;
    }

    if (packageJson.private === false) {
      publishedPackages.push({directory: entry.name, packageJson});
    }
  }

  assert.deepEqual(
    publishedPackages.map(({packageJson}) => packageJson.name).sort(),
    [...packagePoliciesByName.keys()].sort(),
    'Every public package must have an explicit runtime metadata policy',
  );

  for (const {directory, packageJson} of publishedPackages) {
    const policy = packagePoliciesByName.get(packageJson.name);
    assert.equal(directory, policy.directory);
    assert.equal(packageJson.private, false);
    assert.equal(packageJson.sideEffects, false);

    if (policy.nodeEngine === undefined) {
      assert.equal(
        Object.hasOwn(packageJson, 'engines'),
        false,
        `${packageJson.name} must not declare a Node engine`,
      );
    } else {
      assert.deepEqual(packageJson.engines, {node: policy.nodeEngine});
    }

    if (policy.kind === 'library') {
      assert.equal(packageJson.type, 'module');
      assert.equal(packageJson.exports['.'], './dist/index.mjs');
      assert.equal(packageJson.exports['./package.json'], './package.json');
    } else if (policy.kind === 'cli') {
      assert.equal(packageJson.type, 'module');
      assert.deepEqual(packageJson.bin, {qrc: './dist/bin.mjs'});
    } else {
      assert.equal(packageJson.peerDependencies['@angular/core'], '^22.0.0');
      assert.equal(packageJson.publishConfig.directory, 'dist/angular');
    }
  }

  const rootPackageJson = await readJson(path.join(workspaceRoot, 'package.json'));
  assert.deepEqual(rootPackageJson.engines, {
    node: '^22.22.3 || ^24.15.0 || >=26.0.0',
  });

  const corePackageJson = publishedPackages.find(
    ({packageJson}) => packageJson.name === '@qrcodesdk/core',
  ).packageJson;
  const browserPackageJson = publishedPackages.find(
    ({packageJson}) => packageJson.name === '@qrcodesdk/browser',
  ).packageJson;
  assert.equal(corePackageJson.exports['.'], './dist/index.mjs');
  assert.equal(
    corePackageJson.devDependencies.playwright,
    browserPackageJson.devDependencies.playwright,
  );
});
