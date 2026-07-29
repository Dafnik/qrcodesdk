import assert from 'node:assert/strict';
import {execFile as execFileCallback} from 'node:child_process';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

const execFile = promisify(execFileCallback);
const consumerDirectory = path.dirname(fileURLToPath(import.meta.url));
const executable = path.join(consumerDirectory, 'node_modules', '.bin', 'qrc');
const outputDirectory = await mkdtemp(path.join(tmpdir(), 'qrcodesdk-cli-runtime-'));

try {
  const packageJson = JSON.parse(
    await readFile(
      path.join(consumerDirectory, 'node_modules', '@qrcodesdk', 'cli', 'package.json'),
      'utf8',
    ),
  );
  const version = await execFile(executable, ['-V'], {cwd: outputDirectory});
  assert.equal(version.stdout, `${packageJson.version}\n`);
  assert.equal(version.stderr, '');

  const terminal = await execFile(executable, ['Runtime smoke'], {cwd: outputDirectory});
  assert.equal(terminal.stderr, '');
  assert.ok(terminal.stdout.split('\n').length > 10);

  await execFile(executable, ['Runtime smoke', '--output', 'runtime.svg'], {
    cwd: outputDirectory,
  });
  assert.match(await readFile(path.join(outputDirectory, 'runtime.svg'), 'utf8'), /<svg /u);

  await execFile(executable, ['Runtime smoke', '--output', 'runtime.png'], {
    cwd: outputDirectory,
  });
  const png = await readFile(path.join(outputDirectory, 'runtime.png'));
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
} finally {
  await rm(outputDirectory, {recursive: true, force: true});
}
