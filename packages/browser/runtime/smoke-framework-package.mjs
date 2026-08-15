import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createReadStream} from 'node:fs';
import {copyFile, mkdtemp, readdir, rm, stat} from 'node:fs/promises';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const framework = process.env['QRCODESDK_FRAMEWORK'];
const frameworkVersion = process.env['QRCODESDK_FRAMEWORK_VERSION'];
const packageDirectory = process.env['QRCODESDK_PACKAGES'];
const supportedVersions = {
  angular: new Set(['20', '21', '22']),
  react: new Set(['18', '19']),
  svelte: new Set(['5.0', '5.56']),
  vue: new Set(['3.3', '3.5']),
};

assert.ok(framework && supportedVersions[framework], `Unsupported framework: ${framework}`);
assert.ok(
  frameworkVersion && supportedVersions[framework].has(frameworkVersion),
  `Unsupported ${framework} version: ${frameworkVersion}`,
);
assert.ok(packageDirectory, 'QRCODESDK_PACKAGES must point to the packed package directory');

const repositoryDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
);
const temporaryDirectory = await mkdtemp(
  path.join(tmpdir(), `qrcodesdk-${framework}-${frameworkVersion}-`),
);
const consumerDirectory = path.join(temporaryDirectory, `${framework}-consumer`);
let browser;
let server;

try {
  const tarballs = await findTarballs(packageDirectory, ['core', 'browser', framework]);

  if (framework === 'react') {
    await run('npm', ['create', 'vite@latest', 'react-consumer', '--', '--template', 'react-ts'], {
      cwd: temporaryDirectory,
    });
    await copyFile(
      path.join(repositoryDirectory, 'packages', 'react', 'runtime', 'smoke-consumer.tsx'),
      path.join(consumerDirectory, 'src', 'main.tsx'),
    );
    await run(
      'npm',
      [
        'install',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--package-lock=false',
        `react@${frameworkVersion}`,
        `react-dom@${frameworkVersion}`,
        ...tarballs,
      ],
      {cwd: consumerDirectory},
    );
    await run(
      'npm',
      [
        'install',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--package-lock=false',
        '--save-dev',
        `@types/react@${frameworkVersion}`,
        `@types/react-dom@${frameworkVersion}`,
      ],
      {cwd: consumerDirectory},
    );
  } else if (framework === 'svelte') {
    await run(
      'npm',
      ['create', 'vite@latest', 'svelte-consumer', '--', '--template', 'svelte-ts'],
      {
        cwd: temporaryDirectory,
      },
    );
    await copyFile(
      path.join(repositoryDirectory, 'packages', 'svelte', 'runtime', 'smoke-consumer.svelte'),
      path.join(consumerDirectory, 'src', 'smoke-consumer.svelte'),
    );
    await copyFile(
      path.join(repositoryDirectory, 'packages', 'svelte', 'runtime', 'smoke-main.ts'),
      path.join(consumerDirectory, 'src', 'main.ts'),
    );
    const minimumSvelte = frameworkVersion === '5.0';
    await run(
      'npm',
      [
        'install',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--package-lock=false',
        `svelte@${frameworkVersion}`,
        `@sveltejs/vite-plugin-svelte@${minimumSvelte ? '4' : '7'}`,
        `vite@${minimumSvelte ? '5' : '8'}`,
        'typescript@5.9',
        ...tarballs,
      ],
      {cwd: consumerDirectory},
    );
  } else if (framework === 'vue') {
    await run('npm', ['create', 'vite@latest', 'vue-consumer', '--', '--template', 'vue-ts'], {
      cwd: temporaryDirectory,
    });
    await copyFile(
      path.join(repositoryDirectory, 'packages', 'vue', 'runtime', 'smoke-consumer.ts'),
      path.join(consumerDirectory, 'src', 'main.ts'),
    );
    await run(
      'npm',
      [
        'install',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--package-lock=false',
        `vue@${frameworkVersion}`,
        ...tarballs,
      ],
      {cwd: consumerDirectory},
    );
  } else if (framework === 'angular') {
    await run(
      'npx',
      [
        '--yes',
        `@angular/cli@${frameworkVersion}`,
        'new',
        'angular-consumer',
        '--defaults',
        '--skip-install',
        '--skip-git',
        '--routing=false',
        '--style=css',
        '--ssr=false',
        '--package-manager=npm',
      ],
      {cwd: temporaryDirectory},
    );
    await copyFile(
      path.join(repositoryDirectory, 'packages', 'angular', 'runtime', 'smoke-consumer.ts'),
      path.join(consumerDirectory, 'src', 'app', 'app.ts'),
    );
    await run(
      'npm',
      [
        'install',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--package-lock=false',
        ...tarballs,
      ],
      {cwd: consumerDirectory},
    );
  }

  await run('npm', ['run', 'build'], {cwd: consumerDirectory});

  const outputDirectory =
    framework === 'angular'
      ? path.join(consumerDirectory, 'dist', 'angular-consumer', 'browser')
      : path.join(consumerDirectory, 'dist');
  const staticServer = await serve(outputDirectory);
  server = staticServer.server;
  browser = await chromium.launch({headless: true});

  const page = await browser.newPage();
  const browserErrors = [];

  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });

  await page.goto(staticServer.origin, {waitUntil: 'networkidle'});
  await page.locator('[data-testid="qrcode-svg"] svg').waitFor();
  await page.locator('[data-testid="qrcode-canvas"] canvas').waitFor();
  await page.locator('[data-testid="qrcode-image"] img').waitFor();

  const result = await page.evaluate(async () => {
    const check = (value, message) => {
      if (!value) throw new Error(message);
      return value;
    };
    const versionElement = check(
      globalThis.document.querySelector('[data-testid="framework-version"]'),
      'Expected the framework version marker',
    );
    const svg = check(
      globalThis.document.querySelector('[data-testid="qrcode-svg"] svg'),
      'Expected an SVG QR code',
    );
    const canvas = check(
      globalThis.document.querySelector('[data-testid="qrcode-canvas"] canvas'),
      'Expected a Canvas QR code',
    );
    const image = check(
      globalThis.document.querySelector('[data-testid="qrcode-image"] img'),
      'Expected an Image QR code',
    );

    await image.decode();

    const context = check(canvas.getContext('2d'), 'Expected a 2D canvas context');
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let hasDarkPixel = false;
    let hasLightPixel = false;

    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const alpha = pixels[index + 3];

      hasDarkPixel ||= red === 0 && green === 0 && blue === 0 && alpha === 255;
      hasLightPixel ||= red === 255 && green === 255 && blue === 255 && alpha === 255;
      if (hasDarkPixel && hasLightPixel) break;
    }

    return {
      frameworkVersion: versionElement.textContent?.trim(),
      svgWidth: svg.getAttribute('width'),
      svgHeight: svg.getAttribute('height'),
      svgPaths: svg.querySelectorAll('path').length,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      hasDarkPixel,
      hasLightPixel,
      imageSource: image.src,
      imageWidth: image.naturalWidth,
      imageHeight: image.naturalHeight,
      imageAlt: image.alt,
      imageAriaLabel: image.getAttribute('aria-label'),
    };
  });

  const frameworkName = {angular: 'Angular', react: 'React', svelte: 'Svelte', vue: 'Vue'}[
    framework
  ];

  assert.match(
    result.frameworkVersion ?? '',
    new RegExp(`^${frameworkName} ${frameworkVersion}\\.`),
    `Expected ${frameworkName} ${frameworkVersion}, received ${result.frameworkVersion}`,
  );
  assert.equal(result.svgWidth, '46');
  assert.equal(result.svgHeight, '46');
  assert.ok(result.svgPaths > 0, 'Expected SVG QR paths');
  assert.equal(result.canvasWidth, 46);
  assert.equal(result.canvasHeight, 46);
  assert.ok(result.hasDarkPixel, 'Expected dark canvas pixels');
  assert.ok(result.hasLightPixel, 'Expected light canvas pixels');
  assert.match(result.imageSource, /^data:image\/png;base64,/);
  assert.equal(result.imageWidth, 46);
  assert.equal(result.imageHeight, 46);
  assert.equal(result.imageAlt, 'Framework runtime QR code');
  assert.equal(result.imageAriaLabel, 'Framework runtime QR code');
  assert.deepEqual(browserErrors, [], `Unexpected browser errors:\n${browserErrors.join('\n')}`);

  globalThis.console.log(`${result.frameworkVersion} installed-package smoke test passed`);
} finally {
  await Promise.allSettled([browser?.close(), closeServer(server)]);
  await rm(temporaryDirectory, {recursive: true, force: true});
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

function run(command, arguments_, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, arguments_, {
      ...options,
      env: {...process.env, CI: 'true', npm_config_yes: 'true'},
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `${command} ${arguments_.join(' ')} failed with ${
            signal ? `signal ${signal}` : `exit code ${code}`
          }`,
        ),
      );
    });
  });
}

async function serve(directory) {
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new globalThis.URL(request.url ?? '/', 'http://localhost');
      const requestPath = decodeURIComponent(requestUrl.pathname);
      const relativePath = requestPath === '/' ? 'index.html' : requestPath.slice(1);
      const filePath = path.resolve(directory, relativePath);
      const relativeFilePath = path.relative(directory, filePath);

      if (relativeFilePath.startsWith('..') || path.isAbsolute(relativeFilePath)) {
        throw new Error('Requested path is outside the consumer build');
      }

      const file = await stat(filePath);
      if (!file.isFile()) throw new Error('Requested path is not a file');

      response.statusCode = 200;
      response.setHeader('content-type', contentType(filePath));
      createReadStream(filePath).pipe(response);
    } catch {
      response.statusCode = 404;
      response.end('Not found');
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  assert.ok(address && typeof address === 'object');

  return {server, origin: `http://127.0.0.1:${address.port}`};
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    if (!server) {
      resolve();
      return;
    }

    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function contentType(filePath) {
  return (
    {
      '.css': 'text/css; charset=utf-8',
      '.html': 'text/html; charset=utf-8',
      '.ico': 'image/x-icon',
      '.js': 'text/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
    }[path.extname(filePath)] ?? 'application/octet-stream'
  );
}
