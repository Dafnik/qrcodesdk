import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {createPackageManagerCommands} from './package-manager-commands.mjs';

/** @param {Parameters<typeof createPackageManagerCommands>[0]} options */
function commandsById(options) {
  return Object.fromEntries(
    createPackageManagerCommands(options).map(({id, command}) => [id, command]),
  );
}

describe('package manager commands', () => {
  test('uses Yarn 2+ commands for project installs and one-off runs', () => {
    const packages = ['@qrcodesdk/cli'];

    assert.equal(commandsById({packages, mode: 'add'}).yarn, 'yarn add @qrcodesdk/cli');
    assert.equal(commandsById({packages, mode: 'addDev'}).yarn, 'yarn add -D @qrcodesdk/cli');
    assert.equal(
      commandsById({packages, mode: 'exec', command: 'qrc', args: ['"hello"']}).yarn,
      'yarn qrc "hello"',
    );
    assert.equal(
      commandsById({packages, mode: 'dlx', command: 'qrc', args: ['"hello"']}).yarn,
      'yarn dlx @qrcodesdk/cli "hello"',
    );
  });

  test('leaves Yarn out of global installs', () => {
    const commands = createPackageManagerCommands({
      packages: ['@qrcodesdk/cli'],
      mode: 'addGlobal',
      command: 'qrc',
    });

    assert.deepEqual(
      commands.map(({id}) => id),
      ['npm', 'pnpm', 'viteplus', 'deno', 'bun'],
    );
    assert.ok(commands.every(({command}) => !command.includes('yarn global')));
  });

  test('rejects unknown modes', () => {
    assert.throws(
      () =>
        createPackageManagerCommands({
          packages: ['@qrcodesdk/core'],
          mode: /** @type {any} */ ('global'),
        }),
      /Unsupported package manager mode: global/,
    );
  });
});
