import assert from 'node:assert/strict';
import process from 'node:process';
import {test} from 'node:test';

import {read, run, runAsync} from '../scripts/process.mjs';

// Exit on our own so a broken timeout cannot hang the test suite.
const script = "process.on('SIGTERM', () => {}); setTimeout(() => {}, 2000);";

for (const execute of [run, read]) {
  test(`${execute.name} kills a command that ignores SIGTERM at the deadline`, () => {
    assert.throws(() => execute(process.execPath, ['-e', script], {timeout: 500}), {
      code: 'ETIMEDOUT',
      signal: 'SIGKILL',
    });
  });
}

test('runAsync rejects a timeout and a failed command', async () => {
  await assert.rejects(runAsync(process.execPath, ['-e', script], {timeout: 500}), /timed out/);
  await assert.rejects(runAsync(process.execPath, ['-e', 'process.exit(7)']), /exit 7/);
});
