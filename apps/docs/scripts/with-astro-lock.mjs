import {spawn} from 'node:child_process';
import {constants} from 'node:fs';
import {open, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {setTimeout} from 'node:timers/promises';

const [, , command, ...args] = process.argv;

if (!command) {
  console.error('Usage: node scripts/with-astro-lock.mjs <command> [...args]');
  process.exit(1);
}

const lockPath = join(process.cwd(), '.astro-command.lock');

async function acquireLock() {
  while (true) {
    try {
      const handle = await open(lockPath, constants.O_CREAT | constants.O_EXCL | constants.O_RDWR);
      await handle.writeFile(String(process.pid));
      await handle.close();
      return;
    } catch (error) {
      if (error?.code !== 'EEXIST') {
        throw error;
      }

      await setTimeout(250);
    }
  }
}

await acquireLock();

try {
  const child = spawn(command, args, {
    env: process.env,
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });

  const exitCode = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) {
        resolve(1);
        return;
      }

      resolve(code ?? 1);
    });
  });

  process.exitCode = exitCode;
} finally {
  await rm(lockPath, {force: true});
}
