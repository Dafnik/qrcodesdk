import {execFileSync} from 'node:child_process';
import {mkdir, readdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import {bootIOS} from './boot-ios.mjs';
import {createFlow} from './fixtures.mjs';
import {run} from './process.mjs';
import {verifyScreenshots} from './verify-screenshots.mjs';

const platform = process.argv[2];
if (!['ios', 'android'].includes(platform)) throw new Error('Expected ios or android');
const root = fileURLToPath(new URL('../', import.meta.url));
const artifacts = path.join(root, 'artifacts', platform);
const maestro = path.join(root, '.tools/maestro/bin/maestro');
const expo = path.join(root, 'node_modules/.bin/expo');
run(maestro, ['--version']);
let device = process.env.QRCODESDK_NATIVE_DEVICE;
if (platform === 'ios') {
  device = bootIOS();
} else {
  const devices = execFileSync('adb', ['devices'], {encoding: 'utf8'})
    .split('\n')
    .filter((line) => /^emulator-\d+\s+device$/.test(line))
    .map((line) => line.split(/\s+/)[0]);
  device ??= process.env.ANDROID_SERIAL ?? (devices.length === 1 ? devices[0] : undefined);
  if (!device || !devices.includes(device))
    throw new Error(
      'Start one Android emulator, or select a running emulator with QRCODESDK_NATIVE_DEVICE.',
    );
}

await rm(artifacts, {recursive: true, force: true});
await mkdir(artifacts, {recursive: true});
// Release builds embed JavaScript and exercise native views without a Metro server.
if (!process.argv.includes('--skip-build')) {
  if (platform === 'ios') {
    // Build without launching Simulator.app. simctl and Maestro can use a booted simulator
    // without a desktop window or AppleScript permissions, including on CI.
    const output = path.join(root, '.expo/native-build/ios');
    await rm(output, {recursive: true, force: true});
    run(
      expo,
      [
        'run:ios',
        '--device',
        'generic',
        '--configuration',
        'Release',
        '--no-bundler',
        '--output',
        output,
      ],
      {cwd: root},
    );
    const apps = (await readdir(output)).filter((file) => file.endsWith('.app'));
    if (apps.length !== 1)
      throw new Error(`Expected one iOS app in ${output}, found ${apps.length}`);
    run('xcrun', ['simctl', 'install', device, path.join(output, apps[0])]);
  } else {
    run(expo, ['run:android', '--device', device, '--variant', 'release', '--no-bundler'], {
      cwd: root,
    });
  }
}
const flow = path.join(artifacts, 'flow.yaml');
await writeFile(flow, createFlow());
run(
  maestro,
  [
    '--device',
    device,
    'test',
    '--test-output-dir',
    artifacts,
    '--debug-output',
    artifacts,
    '--format',
    'junit',
    '--output',
    path.join(artifacts, 'junit.xml'),
    flow,
  ],
  {cwd: root},
);
const results = await verifyScreenshots(artifacts);
await writeFile(path.join(artifacts, 'decoded.json'), JSON.stringify(results, null, 2) + '\n');
process.stdout.write(`All native ${platform} screenshots decoded to the expected payloads.\n`);
