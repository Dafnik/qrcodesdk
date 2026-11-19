import {existsSync} from 'node:fs';
import {mkdir, readdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import {bootIOS} from './boot-ios.mjs';
import {createFlow} from './fixtures.mjs';
import {minute, read, run, runAsync} from './process.mjs';
import {ccache, maestro} from './tools.mjs';
import {verifyScreenshots} from './verify-screenshots.mjs';

const platform = process.argv[2];
if (!['ios', 'android'].includes(platform)) throw new Error('Expected ios or android');
const root = fileURLToPath(new URL('../', import.meta.url));
const artifacts = path.join(root, 'artifacts', platform);
const expo = path.join(root, 'node_modules/.bin/expo');
const buildTimeout = 45 * minute;
const skipBuild = process.argv.includes('--skip-build');
const hostedRunner = process.env.RUNNER_ENVIRONMENT === 'github-hosted';

// The generic simulator build does not need a booted device or the Simulator window.
async function buildIOS(signal) {
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
  const buildOptions = {cwd: root, env: {...process.env, XCODE_XCCONFIG_FILE: settings}, signal};
  if (process.env.USE_CCACHE === '1') {
    if (!existsSync(ccache))
      throw new Error('Install the pinned compiler cache first with the native:cache:ios task.');
    // CocoaPods needs ccache on PATH, and Xcode compiler invocations inherit CCACHE_BINARY.
    buildOptions.env.PATH = `${path.dirname(ccache)}${path.delimiter}${process.env.PATH}`;
    buildOptions.env.CCACHE_BINARY = ccache;
    await runAsync(ccache, ['--zero-stats'], {signal});
  }
  // Apply app.json native settings to existing projects too, including ccacheEnabled.
  await runAsync(expo, ['prebuild', '--platform', 'ios', '--no-install'], buildOptions);
  await runAsync(
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
  if (apps.length !== 1) throw new Error(`Expected one iOS app in ${output}, found ${apps.length}`);
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
  return binary;
}

run(maestro, ['--version']);
await rm(artifacts, {recursive: true, force: true});
await mkdir(artifacts, {recursive: true});
// Release builds embed JavaScript and exercise native views without a Metro server.
let device = process.env.QRCODESDK_NATIVE_DEVICE;
if (platform === 'ios') {
  const bootAndBuild = new AbortController();
  try {
    const [simulator, binary] = await Promise.all([
      bootIOS(bootAndBuild.signal),
      skipBuild ? undefined : buildIOS(bootAndBuild.signal),
    ]);
    device = simulator;
    if (binary) run('xcrun', ['simctl', 'install', device, binary]);
  } finally {
    bootAndBuild.abort();
  }
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
  // would cover the app, so hide system error dialogs.
  run('adb', ['-s', device, 'shell', 'settings', 'put', 'global', 'hide_error_dialogs', '1']);
  if (!skipBuild) {
    run(expo, ['run:android', '--device', device, '--variant', 'release', '--no-bundler'], {
      cwd: root,
      timeout: buildTimeout,
    });
  }
}
const flow = path.join(artifacts, 'flow.yaml');
const freshIOSInstall = platform === 'ios' && hostedRunner && !skipBuild;
await writeFile(
  flow,
  createFlow(platform, {clearState: !freshIOSInstall, dismissAndroidDialogs: !hostedRunner}),
);
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
