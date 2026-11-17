import {execFileSync} from 'node:child_process';

export function run(command, args, options = {}) {
  return execFileSync(command, args, {stdio: 'inherit', ...options});
}
