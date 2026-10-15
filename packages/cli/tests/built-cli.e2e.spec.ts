import {execFile as execFileCallback} from 'node:child_process';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {expect, test} from 'vitest';

const execFile = promisify(execFileCallback);
const executable = fileURLToPath(new URL('../dist/bin.mjs', import.meta.url));

test('built executable loads its text, SVG, and PNG renderers on demand', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'qrcodesdk-built-cli-'));
  const run = (args: string[]) =>
    execFile(process.execPath, [executable, ...args], {cwd: directory});
  try {
    expect((await run(['--help'])).stdout).toContain('Usage: qrc');
    expect((await run(['-V'])).stdout).toMatch(/^\d+\.\d+\.\d+\n$/);
    expect((await run(['HELLO', '--ansi', 'off'])).stdout).toMatch(/[▀▄█]/);
    await run(['HELLO', '--output', 'code.svg']);
    expect(await readFile(path.join(directory, 'code.svg'), 'utf8')).toContain('<svg ');
    await run(['HELLO', '--output', 'code.png']);
    const bytes = await readFile(path.join(directory, 'code.png'));
    expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});
