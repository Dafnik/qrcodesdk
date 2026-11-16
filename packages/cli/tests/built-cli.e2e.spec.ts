import {execFile as execFileCallback} from 'node:child_process';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {afterEach, beforeEach, expect, test} from 'vitest';

const execFile = promisify(execFileCallback);
const executable = fileURLToPath(new URL('../dist/bin.mjs', import.meta.url));

let directory: string;
const run = (args: string[]) => execFile(process.execPath, [executable, ...args], {cwd: directory});

beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'qrcodesdk-built-cli-'));
});

afterEach(async () => {
  await rm(directory, {recursive: true, force: true});
});

test('built executable prints help', async () => {
  expect((await run(['--help'])).stdout).toContain('Usage: qrc');
});

test('built executable prints its version', async () => {
  expect((await run(['-V'])).stdout).toMatch(/^\d+\.\d+\.\d+\n$/);
});

test('built executable loads its text renderer on demand', async () => {
  expect((await run(['HELLO', '--ansi', 'off'])).stdout).toMatch(/[▀▄█]/);
});

test('built executable loads its SVG renderer on demand', async () => {
  await run(['HELLO', '--output', 'code.svg']);
  expect(await readFile(path.join(directory, 'code.svg'), 'utf8')).toContain('<svg ');
});

test('built executable loads its PNG renderer on demand', async () => {
  await run(['HELLO', '--output', 'code.png']);
  const bytes = await readFile(path.join(directory, 'code.png'));
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
});

test('built executable loads its WebP renderer on demand', async () => {
  await run(['HELLO', '--output', 'code.webp']);
  expect((await readFile(path.join(directory, 'code.webp'))).toString('latin1', 8, 16)).toBe(
    'WEBPVP8L',
  );
});

test('built executable loads its GIF renderer on demand', async () => {
  await run(['HELLO', '--output', 'code.gif']);
  expect((await readFile(path.join(directory, 'code.gif'))).toString('latin1', 0, 6)).toBe(
    'GIF89a',
  );
});

test('built executable loads its JPEG renderer on demand', async () => {
  await run(['HELLO', '--output', 'code.jpg', '--quality', '80', '--matte', '#336699']);
  expect((await readFile(path.join(directory, 'code.jpg'))).toString('latin1', 6, 11)).toBe(
    'JFIF\0',
  );
});

test.each([
  {symbol: 'micro', version: 'M1', width: 15, height: 15},
  {symbol: 'rmqr', version: 'R7x43', width: 47, height: 11},
])('built executable loads $symbol symbols on demand', async ({symbol, version, width, height}) => {
  await run(['12345', '--symbol', symbol, '--version', version, '--output', 'code.png']);
  const bytes = await readFile(path.join(directory, 'code.png'));
  expect(bytes.readUInt32BE(16)).toBe(width);
  expect(bytes.readUInt32BE(20)).toBe(height);
});
