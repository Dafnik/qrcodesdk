import {execFileSync} from 'node:child_process';

export const minute = 60_000;

/**
 * Run a command with inherited output. Every command has a deadline, so a hung simulator,
 * emulator, or build fails this task instead of waiting for the CI job timeout.
 */
export function run(command, args, {timeout = 10 * minute, ...options} = {}) {
  return execFileSync(command, args, {stdio: 'inherit', timeout, ...options});
}

/** Run a short command and return its trimmed standard output. */
export function read(command, args, {timeout = minute, ...options} = {}) {
  return execFileSync(command, args, {encoding: 'utf8', timeout, ...options}).trim();
}
