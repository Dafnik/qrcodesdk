import {existsSync} from 'node:fs';
import {mkdir, readdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import {bootIOS} from './boot-ios.mjs';
import {createFlow} from './fixtures.mjs';
import {minute, read, run} from './process.mjs';
import {ccache, maestro} from './tools.mjs';
import {verifyScreenshots} from './verify-screenshots.mjs';

const platform = process.argv[2];
if (!['ios', 'android'].includes(platform)) throw new Error('Expected ios or android');
const root = fileURLToPath(new URL('../', import.meta.url));
const artifacts = path.join(root, 'artifacts', platform);
const expo = path.join(root, 'node_modules/.bin/expo');
// A cold release build compiles React Native and every pod from source.
const buildTimeout = 45 * minute;
run(maestro, ['--version']);
let device = process.env.QRCODESDK_NATIVE_DEVICE;
if (platform === 'ios') {
  device = bootIOS();
} else {
  const devices = read('adb', ['devices'])
    .split('\n')
    .filter((line) => /^emulator-\d+\s+device$/.test(line))
    .map((line) => line.split(/\s+/)[0]);
  device ??= process.env.ANDROID_SERIAL ?? (devices.length === 1 ? devices[0] : undefined);
  if (!device || !devices.includes(device))
    throw new Error(
      'Start one Android emulator, or select a running emulator with QRCODESDK_NATIVE_DEVICE.',
    );
  // A slow emulator can report the launcher or another system app as not responding. Its dialog
  // would cover the app, so hide system error dialogs. The flow also dismisses any that appear.
  run('adb', ['-s', device, 'shell', 'settings', 'put', 'global', 'hide_error_dialogs', '1']);
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
    const architecture = {arm64: 'arm64', x64: 'x86_64'}[process.arch];
    if (!architecture)
      throw new Error(`Unsupported iOS simulator host architecture: ${process.arch}`);
    const settings = path.join(root, '.expo/native-build/simulator.xcconfig');
    await mkdir(path.dirname(settings), {recursive: true});
    // A generic simulator destination ignores ONLY_ACTIVE_ARCH. ARCHS explicitly limits all
    // simulator targets, including Pods and nested framework builds, to this host's architecture.
    await writeFile(settings, `ARCHS[sdk=iphonesimulator*] = ${architecture}\n`);
    const buildOptions = {cwd: root, env: {...process.env, XCODE_XCCONFIG_FILE: settings}};
    if (process.env.USE_CCACHE === '1') {
      if (!existsSync(ccache))
        throw new Error('Install the pinned compiler cache first with the native:cache:ios task.');
      // CocoaPods enables ccache only when it is on PATH. Compiler tool invocations also need
      // CCACHE_BINARY in their inherited environment; a user-defined Xcode build setting alone is
      // not exported to every compiler invocation.
      buildOptions.env.PATH = `${path.dirname(ccache)}${path.delimiter}${process.env.PATH}`;
      buildOptions.env.CCACHE_BINARY = ccache;
      run(ccache, ['--zero-stats']);
    }
    // Apply app.json native settings to existing projects too, including ccacheEnabled.
    run(expo, ['prebuild', '--platform', 'ios', '--no-install'], buildOptions);
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
      {...buildOptions, timeout: buildTimeout},
    );
    const apps = (await readdir(output)).filter((file) => file.endsWith('.app'));
    if (apps.length !== 1)
      throw new Error(`Expected one iOS app in ${output}, found ${apps.length}`);
    const binary = path.join(output, apps[0]);
    const executable = read('plutil', [
      '-extract',
      'CFBundleExecutable',
      'raw',
      '-o',
      '-',
      path.join(binary, 'Info.plist'),
    ]);
    const builtArchitecture = read('lipo', ['-archs', path.join(binary, executable)]);
    if (builtArchitecture !== architecture)
      throw new Error(`Expected only ${architecture}, built ${builtArchitecture}`);
    process.stdout.write(`Built iOS simulator app for ${builtArchitecture}.\n`);
    run('xcrun', ['simctl', 'install', device, binary]);
  } else {
    run(expo, ['run:android', '--device', device, '--variant', 'release', '--no-bundler'], {
      cwd: root,
      timeout: buildTimeout,
    });
  }
}
const flow = path.join(artifacts, 'flow.yaml');
await writeFile(flow, createFlow(platform));
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
  {cwd: root, timeout: 20 * minute},
);
const results = await verifyScreenshots(artifacts);
await writeFile(path.join(artifacts, 'decoded.json'), JSON.stringify(results, null, 2) + '\n');
process.stdout.write(`All native ${platform} screenshots decoded to the expected payloads.\n`);
