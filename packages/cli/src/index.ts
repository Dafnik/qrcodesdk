#!/usr/bin/env node
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import {runCli} from './run-cli';

export {runCli};
export type {CliRuntime, WritableTarget} from './run-cli';

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const exitCode = await runCli(process.argv.slice(2));
  process.exitCode = exitCode;
}
