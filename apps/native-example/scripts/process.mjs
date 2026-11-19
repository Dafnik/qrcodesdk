import {execFileSync, spawn} from 'node:child_process';

export const minute = 60_000;

/**
 * Run a command with inherited output. Every command has a deadline, so a hung simulator,
 * emulator, or build fails this task instead of waiting for the CI job timeout.
 */
export function run(command, args, {timeout = 10 * minute, ...options} = {}) {
  return execFileSync(command, args, {
    stdio: 'inherit',
    timeout,
    ...options,
    killSignal: 'SIGKILL',
  });
}

/** Run a command with live output while other work proceeds. */
export function runAsync(command, args, {timeout = 10 * minute, signal, ...options} = {}) {
  const deadline = AbortSignal.timeout(timeout);
  const invocation = [command, ...args].join(' ');
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...options,
      stdio: 'inherit',
      signal: signal ? AbortSignal.any([signal, deadline]) : deadline,
      killSignal: 'SIGKILL',
    });
    child.once('error', (error) => {
      reject(
        deadline.aborted
          ? new Error(`${invocation} timed out after ${timeout} ms`, {cause: error})
          : error,
      );
    });
    child.once('close', (code, exitSignal) => {
      if (code === 0) resolve();
      else reject(new Error(`${invocation} failed (${exitSignal ?? `exit ${code}`})`));
    });
  });
}

/** Run a short command and return its trimmed standard output. */
export function read(command, args, {timeout = minute, ...options} = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    timeout,
    ...options,
    killSignal: 'SIGKILL',
  }).trim();
}
