import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {chromium, firefox, webkit} from 'playwright';

const browserName = process.env['QRCODESDK_BROWSER'];
const consumerDirectory = process.env['QRCODESDK_CONSUMER'];
const browserType = {chromium, firefox, webkit}[browserName];

function logSuccess(message) {
  globalThis.console.log(`  ✓ ${message}`);
}

assert.ok(browserType, `Unsupported browser runtime: ${browserName}`);
assert.ok(consumerDirectory, 'QRCODESDK_CONSUMER must point to the installed package consumer');

globalThis.console.log(`Testing the installed @qrcodesdk/browser package in ${browserName}`);

const moduleDirectories = [
  {
    packageName: '@qrcodesdk/core',
    pathnamePrefix: '/core/',
    directory: path.join(consumerDirectory, 'node_modules', '@qrcodesdk', 'core', 'dist'),
  },
  {
    packageName: '@qrcodesdk/browser',
    pathnamePrefix: '/browser/',
    directory: path.join(consumerDirectory, 'node_modules', '@qrcodesdk', 'browser', 'dist'),
  },
];
const imports = {};
for (const {packageName, pathnamePrefix, directory} of moduleDirectories) {
  const packageJson = JSON.parse(
    await readFile(path.join(directory, '..', 'package.json'), 'utf8'),
  );
  for (const [subpath, target] of Object.entries(packageJson.exports)) {
    if (!target.startsWith('./dist/') || !target.endsWith('.mjs')) continue;
    const specifier = packageName + (subpath === '.' ? '' : subpath.slice(1));
    imports[specifier] = pathnamePrefix + target.slice('./dist/'.length);
  }
}
logSuccess('installed Core and Browser ESM bundles are readable');

const browser = await browserType.launch({headless: true});

try {
  const page = await browser.newPage();

  await page.route('http://qrcodesdk.test/**', async (route) => {
    const pathname = new globalThis.URL(route.request().url()).pathname;

    if (pathname === '/') {
      await route.fulfill({
        contentType: 'text/html',
        body: `<!doctype html>
          <html>
            <head>
              <script type="importmap">
                ${JSON.stringify({imports})}
              </script>
            </head>
            <body></body>
          </html>`,
      });
      return;
    }

    for (const {pathnamePrefix, directory} of moduleDirectories) {
      if (!pathname.startsWith(pathnamePrefix)) continue;

      const modulePath = path.resolve(directory, pathname.slice(pathnamePrefix.length));
      const relativeModulePath = path.relative(directory, modulePath);
      if (
        !relativeModulePath.endsWith('.mjs') ||
        relativeModulePath.startsWith('..') ||
        path.isAbsolute(relativeModulePath)
      ) {
        break;
      }

      try {
        await route.fulfill({
          contentType: 'text/javascript',
          body: await readFile(modulePath, 'utf8'),
        });
        return;
      } catch {
        break;
      }
    }

    await route.fulfill({status: 404, body: 'Not found'});
  });

  await page.goto('http://qrcodesdk.test/');
  await page.evaluate(async () => {
    const [core, browserPackage, {kanji}, {automaticSegmenter}] = await Promise.all([
      import('@qrcodesdk/core'),
      import('@qrcodesdk/browser'),
      import('@qrcodesdk/core/kanji'),
      import('@qrcodesdk/core/segmenter'),
    ]);
    const check = (condition, message) => {
      if (!condition) throw new Error(message);
    };

    const builder = core.qrcode('Runtime ✅ 你好').mode('octet').errorCorrection('H').mask(3);
    const matrix = builder.matrix();
    check(matrix.size === 29, 'Expected a 29×29 QR code matrix');
    check(
      matrix.modules.length === 29 * 29 && matrix.roles.length === 29 * 29,
      'Expected row-major QR code modules and roles',
    );

    const style = {moduleSize: 2, quietZone: 1};
    const svg = builder.render(core.QRCodeSVGRenderer({style}));
    check(svg.includes('width="62"'), 'Expected installed Core to render SVG output');

    const canvas = builder.render(browserPackage.QRCodeCanvasRenderer({style}));
    check(canvas instanceof globalThis.HTMLCanvasElement, 'Expected a browser canvas element');
    check(canvas.width === 62 && canvas.height === 62, 'Expected a 62×62 browser canvas');

    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let hasDarkPixel = false;
    let hasLightPixel = false;
    for (let index = 0; index < pixels.length; index += 4) {
      const [red, green, blue, alpha] = pixels.slice(index, index + 4);
      hasDarkPixel ||= red === 0 && green === 0 && blue === 0 && alpha === 255;
      hasLightPixel ||= red === 255 && green === 255 && blue === 255 && alpha === 255;
      if (hasDarkPixel && hasLightPixel) break;
    }
    check(hasDarkPixel && hasLightPixel, 'Expected rendered dark and light canvas pixels');

    for (const [renderer, mimeType] of [
      [browserPackage.QRCodePNGImageRenderer, 'image/png'],
      [browserPackage.QRCodeWebPImageRenderer, 'image/webp'],
      [browserPackage.QRCodeGIFImageRenderer, 'image/gif'],
      [browserPackage.QRCodeJPEGImageRenderer, 'image/jpeg'],
    ]) {
      const image = builder.render(renderer({style, accessibility: {alt: 'Runtime QR code'}}));
      globalThis.document.body.append(image);
      await image.decode();
      check(image instanceof globalThis.HTMLImageElement, 'Expected a browser image element');
      check(image.src.startsWith(`data:${mimeType};base64,`), `Expected a ${mimeType} data URL`);
      check(
        image.naturalWidth === 62 && image.naturalHeight === 62,
        `Expected a loaded 62×62 ${mimeType} image`,
      );
      check(image.alt === 'Runtime QR code', 'Expected image accessibility attributes');
    }

    // The Kanji entry registers its table in a chunk shared with the root entry, so the root
    // builder must accept the separately imported table.
    const kanjiPayload = '東京タワー';
    check(
      core.qrcode(kanjiPayload).matrix().size === 25,
      'Expected Japanese text to need version 2 as UTF-8 octets',
    );
    const kanjiBuilder = core.qrcode(kanjiPayload).mode('kanji').kanji(kanji).mask(3);
    check(kanjiBuilder.matrix().size === 21, 'Expected forced Kanji mode to fit version 1');
    check(
      core.qrcode(kanjiPayload).kanji(kanji).matrix().size === 21,
      'Expected auto mode to pick Kanji mode with the Kanji table',
    );
    check(
      core.qrcode(`${kanjiPayload}123`).segmenter(automaticSegmenter).kanji(kanji).matrix().size ===
        21,
      'Expected the automatic segmenter to combine Kanji and numeric segments',
    );
    const kanjiCanvas = kanjiBuilder.render(browserPackage.QRCodeCanvasRenderer({style}));
    check(
      kanjiCanvas.width === 46 && kanjiCanvas.height === 46,
      'Expected a 46×46 Kanji mode canvas',
    );
    const kanjiImage = kanjiBuilder.render(browserPackage.QRCodePNGImageRenderer({style}));
    globalThis.document.body.append(kanjiImage);
    await kanjiImage.decode();
    check(
      kanjiImage.naturalWidth === 46 && kanjiImage.naturalHeight === 46,
      'Expected a loaded 46×46 Kanji mode PNG image',
    );
    let rejected = false;
    try {
      core.qrcode(kanjiPayload).mode('kanji').matrix();
    } catch (error) {
      rejected = error instanceof core.QRCodeError && error.code === 'INVALID_OPTIONS';
    }
    check(rejected, 'Expected Kanji mode without the Kanji table to throw INVALID_OPTIONS');
  });

  logSuccess('installed ESM bundles import in a real browser page');
  logSuccess('Core builder creates the expected matrix and SVG output');
  logSuccess('Canvas renderer creates a 62×62 canvas with dark and light pixels');
  logSuccess(
    'PNG, WebP, GIF, and JPEG image renderers create loaded 62×62 images with accessible alternative text',
  );
  logSuccess(
    'Kanji table from @qrcodesdk/core/kanji enables Kanji mode, auto detection, and Kanji segments',
  );
  globalThis.console.log(
    `@qrcodesdk/browser installed-package smoke test passed in ${browserName}`,
  );
} finally {
  await browser.close();
}
