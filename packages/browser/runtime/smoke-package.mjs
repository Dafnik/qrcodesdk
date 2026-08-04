import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {chromium, firefox, webkit} from 'playwright';

const browserName = process.env['QRCODESDK_BROWSER'];
const consumerDirectory = process.env['QRCODESDK_CONSUMER'];
const browserType = {chromium, firefox, webkit}[browserName];

assert.ok(browserType, `Unsupported browser runtime: ${browserName}`);
assert.ok(consumerDirectory, 'QRCODESDK_CONSUMER must point to the installed package consumer');

const [coreSource, browserSource] = await Promise.all([
  readFile(
    path.join(consumerDirectory, 'node_modules', '@qrcodesdk', 'core', 'dist', 'index.mjs'),
    'utf8',
  ),
  readFile(
    path.join(consumerDirectory, 'node_modules', '@qrcodesdk', 'browser', 'dist', 'index.mjs'),
    'utf8',
  ),
]);

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
                {
                  "imports": {
                    "@qrcodesdk/core": "/core.mjs",
                    "@qrcodesdk/browser": "/browser.mjs"
                  }
                }
              </script>
            </head>
            <body></body>
          </html>`,
      });
      return;
    }

    if (pathname === '/core.mjs') {
      await route.fulfill({contentType: 'text/javascript', body: coreSource});
      return;
    }

    if (pathname === '/browser.mjs') {
      await route.fulfill({contentType: 'text/javascript', body: browserSource});
      return;
    }

    await route.fulfill({status: 404, body: 'Not found'});
  });

  await page.goto('http://qrcodesdk.test/');
  await page.evaluate(async () => {
    const [core, browserPackage] = await Promise.all([
      import('@qrcodesdk/core'),
      import('@qrcodesdk/browser'),
    ]);
    const check = (condition, message) => {
      if (!condition) throw new Error(message);
    };

    const builder = core.qrcode('Runtime ✅ 你好').mode('octet').errorCorrection('H').mask(3);
    const matrix = builder.matrix();
    check(matrix.length === 29, 'Expected a 29×29 QR code matrix');
    check(
      matrix.every((row) => row.length === 29),
      'Expected square QR code matrix rows',
    );

    const svg = builder.render(core.QRCodeSVGRenderer({size: 2, margin: 1}));
    check(svg.includes('width="62"'), 'Expected installed Core to render SVG output');

    const canvas = builder.render(browserPackage.QRCodeCanvasRenderer({size: 2, margin: 1}));
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

    const image = builder.render(
      browserPackage.QRCodeImageRenderer({size: 2, margin: 1, alt: 'Runtime QR code'}),
    );
    globalThis.document.body.append(image);
    await image.decode();
    check(image instanceof globalThis.HTMLImageElement, 'Expected a browser image element');
    check(image.src.startsWith('data:image/png;base64,'), 'Expected a PNG data URL');
    check(image.naturalWidth === 62 && image.naturalHeight === 62, 'Expected a loaded 62×62 PNG');
    check(image.alt === 'Runtime QR code', 'Expected image accessibility attributes');
  });
} finally {
  await browser.close();
}
