import assert from 'node:assert/strict';
import process from 'node:process';
import {test} from 'node:test';

import {read, run} from '../scripts/process.mjs';

for (const execute of [run, read]) {
  test(`${execute.name} kills a command that ignores SIGTERM at the deadline`, () => {
    // Exit on our own so a broken timeout cannot hang the test suite.
    const script = "process.on('SIGTERM', () => {}); setTimeout(() => {}, 2000);";
    assert.throws(() => execute(process.execPath, ['-e', script], {timeout: 500}), {
      code: 'ETIMEDOUT',
      signal: 'SIGKILL',
    });
  });
}
