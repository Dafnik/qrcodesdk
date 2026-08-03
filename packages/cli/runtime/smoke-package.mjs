import assert from 'node:assert/strict';
import {execFile as execFileCallback} from 'node:child_process';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

const execFile = promisify(execFileCallback);
const consumerDirectory = path.dirname(fileURLToPath(import.meta.url));
const executable = path.join(
  consumerDirectory,
  'node_modules',
  '@qrcodesdk',
  'cli',
  'dist',
  'bin.mjs',
);
const outputDirectory = await mkdtemp(path.join(tmpdir(), 'qrcodesdk-cli-runtime-'));
const runtime = process.env['QRCODESDK_RUNTIME'] ?? 'node';

function runtimeCommand(args) {
  switch (runtime) {
    case 'node':
      return {command: process.execPath, args: [executable, ...args]};
    case 'deno':
      return {
        command: globalThis.Deno?.execPath() ?? process.execPath,
        args: ['run', '-A', '--node-modules-dir=manual', executable, ...args],
      };
    case 'bun':
      return {command: process.execPath, args: ['run', executable, ...args]};
    default:
      throw new Error(`Unsupported CLI runtime: ${runtime}`);
  }
}

function runCli(args) {
  const invocation = runtimeCommand(args);
  return execFile(invocation.command, invocation.args, {cwd: outputDirectory});
}

try {
  const packageJson = JSON.parse(
    await readFile(
      path.join(consumerDirectory, 'node_modules', '@qrcodesdk', 'cli', 'package.json'),
      'utf8',
    ),
  );
  const version = await runCli(['-V']);
  assert.equal(version.stdout, `${packageJson.version}\n`);
  assert.equal(version.stderr, '');

  const terminal = await runCli(['Runtime smoke']);
  assert.equal(terminal.stderr, '');
  assert.ok(terminal.stdout.split('\n').length > 10);

  await runCli(['Runtime smoke', '--output', 'runtime.svg']);
  assert.match(await readFile(path.join(outputDirectory, 'runtime.svg'), 'utf8'), /<svg /u);

  await runCli(['Runtime smoke', '--output', 'runtime.png']);
  const png = await readFile(path.join(outputDirectory, 'runtime.png'));
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
} finally {
  await rm(outputDirectory, {recursive: true, force: true});
}
