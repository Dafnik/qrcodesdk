import {LOGO_IMAGE, encodeFixturePNG, fixtureImageDataURL} from '@repo/core-testing';
import {decodeQRCode} from '@repo/core-testing/decoder/node';
import assert from 'node:assert/strict';
import {Buffer} from 'node:buffer';
import {spawn} from 'node:child_process';
import {
  access,
  copyFile,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
import sharp from 'sharp';

const reactNativeVersion = process.env['QRCODESDK_REACT_NATIVE_VERSION'];
const packageDirectory = process.env['QRCODESDK_PACKAGES'];
const hermes = process.env['QRCODESDK_HERMES'];
const supportedVersions = new Set(['0.79', '0.88']);

function logSuccess(message) {
  globalThis.console.log(`  ✓ ${message}`);
}

assert.ok(
  supportedVersions.has(reactNativeVersion),
  `Unsupported React Native version: ${reactNativeVersion}`,
);
assert.ok(
  packageDirectory && path.isAbsolute(packageDirectory),
  'QRCODESDK_PACKAGES must be an absolute directory with the packed packages',
);
assert.ok(
  hermes && path.isAbsolute(hermes),
  'QRCODESDK_HERMES must be the absolute path of a Hermes CLI binary',
);
globalThis.console.log(
  `Testing installed @qrcodesdk/react-native package with React Native ${reactNativeVersion}`,
);

const runtimeDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryDirectory = path.resolve(runtimeDirectory, '..', '..', '..');
const temporaryDirectory = await mkdtemp(
  path.join(tmpdir(), `qrcodesdk-react-native-${reactNativeVersion}-`),
);
const consumerDirectory = path.join(temporaryDirectory, 'consumer');

try {
  const tarballs = await findTarballs(packageDirectory, ['core', 'react-native']);
  logSuccess('found exactly one packed tarball for each required QRCodeSDK package');

  await cp(path.join(runtimeDirectory, 'consumer'), consumerDirectory, {recursive: true});
  await cp(
    path.join(runtimeDirectory, 'fixtures', `react-native-${reactNativeVersion}`),
    consumerDirectory,
    {recursive: true},
  );
  await copyFile(
    path.join(repositoryDirectory, 'packages', 'core', 'runtime', 'smoke-package.mjs'),
    path.join(consumerDirectory, 'core-smoke.js'),
  );
  await writeFile(
    path.join(consumerDirectory, 'center-image.json'),
    JSON.stringify({
      bytes: [...encodeFixturePNG(LOGO_IMAGE)],
      dataURL: fixtureImageDataURL(LOGO_IMAGE),
    }),
  );

  const npmOptions = ['--ignore-scripts', '--legacy-peer-deps', '--no-audit', '--no-fund'];
  await run('npm', ['ci', ...npmOptions], {cwd: consumerDirectory});
  await run('npm', ['install', '--no-save', ...npmOptions, ...tarballs], {cwd: consumerDirectory});
  const installed = JSON.parse(
    await readFile(path.join(consumerDirectory, 'node_modules/react-native/package.json'), 'utf8'),
  );
  assert.ok(
    installed.version.startsWith(`${reactNativeVersion}.`),
    `Expected React Native ${reactNativeVersion}, found ${installed.version}`,
  );
  logSuccess(`installed the packed packages with React Native ${installed.version}`);

  const coreBundle = await bundle('core-smoke.js', 'standalone', 'android');
  const coreOutput = await run(hermes, ['-w', coreBundle], {capture: true});
  assert.match(coreOutput, /@qrcodesdk\/core installed-package smoke test passed/u);
  assert.match(coreOutput, /contact and calendar serializers/u);
  logSuccess('runs the @qrcodesdk/core smoke test in Hermes');

  const renderBundle = await bundle('render-entry.js', 'render', 'android');
  const hermesResults = parseResults(await run(hermes, ['-w', renderBundle], {capture: true}));
  const nodeResults = parseResults(await runInNode(renderBundle));
  assert.deepEqual(hermesResults, nodeResults, 'Hermes and Node.js must render the same output');
  logSuccess(`renders ${hermesResults.length} components in Hermes, matching Node.js exactly`);

  for (const result of hermesResults) {
    const hosts = parseHosts(result.markup);
    const raster = result.name.startsWith('svg')
      ? await rasterizeSVG(hosts)
      : await decodeImage(hosts, result.name);
    const scan = await decodeQRCode(
      new Uint8ClampedArray(raster.data),
      raster.width,
      raster.height,
    );
    assert.equal(scan.text, result.payload, `Expected the ${result.name} output to scan`);
  }
  logSuccess('scans the SVG and image output rendered in Hermes');

  const hermesc = await findHermesCompiler();
  for (const platform of ['android', 'ios']) {
    const appBundle = await bundle('app.tsx', 'app', platform);
    await run(hermesc, ['-w', '-emit-binary', '-O', '-out', `${appBundle}.hbc`, appBundle]);
    logSuccess(`bundles an app for ${platform} with Metro and compiles it to Hermes bytecode`);
  }

  globalThis.console.log('@qrcodesdk/react-native installed-package smoke test passed');
} finally {
  await rm(temporaryDirectory, {recursive: true, force: true});
}

async function bundle(entry, mode, platform) {
  const out = path.join(consumerDirectory, 'out', `${path.parse(entry).name}.${platform}.js`);
  await mkdir(path.dirname(out), {recursive: true});
  await run('node', ['bundle.cjs', entry, out, platform], {
    cwd: consumerDirectory,
    env: {QRCODESDK_METRO_MODE: mode},
  });
  return out;
}

/** Runs a Hermes CLI bundle in a fresh Node.js context with the globals that Hermes provides. */
async function runInNode(file) {
  let output = '';
  runInNewContext(await readFile(file, 'utf8'), {
    print: (...values) => (output += `${values.join(' ')}\n`),
    TextEncoder,
  });
  return output;
}

function parseResults(output) {
  return output
    .split('\n')
    .filter((line) => line.startsWith('{'))
    .map((line) => JSON.parse(line));
}

/** Reads the host components and their props from server-rendered markup. */
function parseHosts(markup) {
  const decode = (value) =>
    value
      .replace(/&quot;/gu, '"')
      .replace(/&#x27;/gu, "'")
      .replace(/&lt;/gu, '<')
      .replace(/&gt;/gu, '>')
      .replace(/&amp;/gu, '&');
  return [...markup.matchAll(/data-host="([^"]+)" data-props="([^"]*)"/gu)].map(
    ([, name, props]) => ({name, props: JSON.parse(decode(props))}),
  );
}

/** Serializes the react-native-svg elements as SVG and rasterizes them with libvips. */
async function rasterizeSVG(hosts) {
  const svg = hosts.find((host) => host.name === 'Svg');
  assert.ok(svg, 'Expected an Svg element');
  const attributes = (props) =>
    Object.entries(props)
      .map(([key, value]) => {
        const name =
          {
            fillOpacity: 'fill-opacity',
            fillRule: 'fill-rule',
            preserveAspectRatio: 'preserveAspectRatio',
          }[key] ?? key;
        const text = typeof value === 'string' ? value : String(value);
        return `${name}="${text.replace(/&/gu, '&amp;').replace(/"/gu, '&quot;')}"`;
      })
      .join(' ');
  let body = '';
  for (const host of hosts) {
    if (host.name === 'Path') body += `<path ${attributes(host.props)}/>`;
    if (host.name === 'SvgImage') body += `<image ${attributes(host.props)}/>`;
  }
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" ${attributes(svg.props)}>${body}</svg>`;
  return decodePixels(Buffer.from(markup), 4);
}

async function decodeImage(hosts, name) {
  const image = hosts.find((host) => host.name === 'Image');
  assert.ok(image, `Expected an Image element for ${name}`);
  const {uri, width, height} = image.props.source;
  const mimeType = {gif: 'image/gif', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp'}[
    name.split('-')[0]
  ];
  assert.ok(uri.startsWith(`data:${mimeType};base64,`), `Expected a ${mimeType} data URL`);
  const raster = await decodePixels(Buffer.from(uri.slice(uri.indexOf(',') + 1), 'base64'), 1);
  assert.equal(raster.width, width, `Expected the ${name} source width to match the image`);
  assert.equal(raster.height, height, `Expected the ${name} source height to match the image`);
  return raster;
}

async function decodePixels(input, scale) {
  const image = sharp(input, {density: 72 * scale});
  const {data, info} = await image
    .toColourspace('srgb')
    .ensureAlpha()
    .raw()
    .toBuffer({resolveWithObject: true});
  return {width: info.width, height: info.height, data};
}

async function findHermesCompiler() {
  for (const candidate of [
    'node_modules/hermes-compiler/hermesc/linux64-bin/hermesc',
    'node_modules/react-native/sdks/hermesc/linux64-bin/hermesc',
  ]) {
    const file = path.join(consumerDirectory, candidate);
    try {
      await access(file);
      return file;
    } catch {
      // Try the next location.
    }
  }
  throw new Error('Could not find the Hermes compiler of the installed React Native version');
}

async function findTarballs(directory, packageNames) {
  const entries = await readdir(directory);
  return packageNames.map((packageName) => {
    const prefix = `qrcodesdk-${packageName}-`;
    const matches = entries.filter(
      (entry) =>
        entry.startsWith(prefix) &&
        /^\d/u.test(entry.slice(prefix.length)) &&
        entry.endsWith('.tgz'),
    );
    assert.equal(
      matches.length,
      1,
      `Expected exactly one ${packageName} tarball in ${directory}, found ${matches.length}`,
    );
    return path.join(directory, matches[0]);
  });
}

function run(command, arguments_, {cwd, env, capture = false} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, arguments_, {
      cwd,
      env: {...process.env, CI: 'true', ...env},
      stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    });
    let output = '';
    child.stdout?.on('data', (chunk) => (output += chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`${command} ${arguments_.join(' ')} exited with ${code}\n${output}`));
    });
  });
}
