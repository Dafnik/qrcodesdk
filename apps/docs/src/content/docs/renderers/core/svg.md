---
title: Render SVG
description: Render a QR code as a scalable SVG string from @qrcodesdk/core.

related:
  - ../../advanced/customize.md
  - ../../packages/node/
  - ../browser/image.md
---

Use this when you need a crisp, scalable QR code for web apps, dashboards, emails, documentation pages, server-rendered routes, or generated static assets.

SVG is the best default for most user-facing QR codes because it stays sharp at any size. The Core artifact works in any runtime meeting its [documented ESM, ES2020, and `TextEncoder` contract](/packages/core/#runtime-compatibility).

## Minimal example

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(QRCodeSVGRenderer());
```

The returned value is an SVG string.

## Common options

You can customize the rendered SVG by passing options to `QRCodeSVGRenderer`.

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(
  QRCodeSVGRenderer({
    size: 8,
    margin: 4,
    colors: {
      colorDark: '#111827',
      colorLight: '#ffffff',
    },
    dotsOptions: {type: 'rounded'},
    cornersSquareOptions: {type: 'extra-rounded', color: '#7c3aed'},
    cornersDotOptions: {type: 'dot'},
  }),
);
```

| Option                       |                     Type |            Default | Description                                           |
| ---------------------------- | -----------------------: | -----------------: | ----------------------------------------------------- |
| `size`                       |                 `number` |                `5` | Pixel size of each QR module.                         |
| `margin`                     |                 `number` |                `4` | Quiet-zone margin around the QR code, in modules.     |
| `colors.colorDark`           |                 `string` |        `'#000000'` | Color used for dark modules.                          |
| `colors.colorLight`          |                 `string` |        `'#ffffff'` | Background color.                                     |
| `dotsOptions.type`           |          `QRCodeDotType` |         `'square'` | Shape used for ordinary data modules.                 |
| `dotsOptions.color`          |                 `string` | `colors.colorDark` | Color used for ordinary data modules.                 |
| `cornersSquareOptions.type`  | `QRCodeCornerSquareType` |         `'square'` | Shape used for finder outer rings.                    |
| `cornersSquareOptions.color` |                 `string` | `colors.colorDark` | Color used for finder outer rings.                    |
| `cornersDotOptions.type`     |    `QRCodeCornerDotType` |         `'square'` | Shape used for finder centers.                        |
| `cornersDotOptions.color`    |                 `string` | `colors.colorDark` | Color used for finder centers.                        |
| `alt`                        |                 `string` |        `undefined` | Fallback accessible name when `ariaLabel` is omitted. |
| `ariaLabel`                  |                 `string` |        `undefined` | Sets the SVG's accessible name with `aria-label`.     |
| `title`                      |                 `string` |        `undefined` | Adds a child `<title>` element to the SVG.            |
| `image.source`               |     `QRCodeDataImageURL` |        `undefined` | Prepared embedded image data URL.                     |
| `image.size`                 |                 `number` |              `0.4` | Image box as a fraction of matrix width.              |
| `image.padding`              |                 `number` |                `1` | Clear padding in QR module units.                     |
| `image.clearBackground`      |                `boolean` |             `true` | Clears modules behind the image and padding.          |

Colors must be 6-digit hex values such as `'#000000'`, `'#ffffff'`, or `'#111827'`.

Data-module types are `square`, `rounded`, `dots`, `classy`, `classy-rounded`, and
`extra-rounded`. Finder rings and centers additionally support `dot`. Each feature color override
is independent; omit it to inherit `colors.colorDark`.

## Common recipes

### Add a prepared center image

The SVG renderer accepts an embedded `data:image/...` URL. Read or fetch the source and convert it
before calling the renderer; `QRCodeSVGRenderer` never reads a path or fetches a URL.

```ts
import {readFile} from 'node:fs/promises';

import {type QRCodeDataImageURL, QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const logoBytes = await readFile('./logo.png');
const logo = `data:image/png;base64,${logoBytes.toString('base64')}` as QRCodeDataImageURL;

const svg = qrcode('https://qrcodesdk.dev')
  .errorCorrection('H')
  .render(
    QRCodeSVGRenderer({
      image: {
        source: logo,
        size: 0.3,
        padding: 1,
        clearBackground: true,
      },
    }),
  );
```

In a browser, prepare a fetched image as a data URL with `FileReader`:

```ts
import {type QRCodeDataImageURL, QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

function readBlobAsDataImageURL(blob: Blob): Promise<QRCodeDataImageURL> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string' && reader.result.startsWith('data:image/')) {
        resolve(reader.result as QRCodeDataImageURL);
      } else {
        reject(new Error('Image preparation failed'));
      }
    });
    reader.addEventListener('error', () => reject(new Error('Image preparation failed')));
    reader.readAsDataURL(blob);
  });
}

const response = await fetch('/logo.png');
if (!response.ok) {
  throw new Error(`Image request failed with status ${response.status}`);
}
if (!response.headers.get('content-type')?.toLowerCase().startsWith('image/')) {
  throw new Error('Image request returned a non-image response');
}
const logo = await readBlobAsDataImageURL(await response.blob());

const svg = qrcode('https://qrcodesdk.dev')
  .errorCorrection('H')
  .render(
    QRCodeSVGRenderer({
      image: {
        source: logo,
        size: 0.3,
        padding: 1,
        clearBackground: true,
      },
    }),
  );
```

The image is centered and contained without cropping. `size` must be greater than `0` and at most
`1`; `padding` must be non-negative. Large images can make the code impossible to scan even with high
error correction, so start near `0.3` and test with real scanners.

### Add accessibility labels

For user-facing QR codes, provide a meaningful label so assistive technologies can describe the destination or action.

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(
  QRCodeSVGRenderer({
    title: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
  }),
);
```

SVG output uses `role="img"`. `ariaLabel` takes precedence over `alt` when both are provided;
`alt` is retained as a cross-renderer option and becomes `aria-label` in SVG output rather than an
invalid SVG `alt` attribute.

### Save to disk (node)

```ts
import {writeFile} from 'node:fs/promises';

import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(QRCodeSVGRenderer());

await writeFile('qrcode.svg', svg, 'utf8');
```

### Serve with Express

```ts
import express from 'express';

import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const app = express();

app.get('/qrcode.svg', (_req, res) => {
  const svg = qrcode('https://qrcodesdk.dev').render(QRCodeSVGRenderer());

  res.type('image/svg+xml').send(svg);
});

app.listen(3000);
```

### Inline in HTML

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(
  QRCodeSVGRenderer({
    ariaLabel: 'Scan to open qrcodesdk.dev',
  }),
);

const html = `
  <!doctype html>
  <html>
    <body>
      <h1>Scan this QR code</h1>
      ${svg}
    </body>
  </html>
`;
```

### Insert into the DOM

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(
  QRCodeSVGRenderer({
    ariaLabel: 'Scan to open qrcodesdk.dev',
  }),
);

const container = document.querySelector('#qrcode');

if (container) {
  container.innerHTML = svg;
}
```

```html
<div id="qrcode"></div>
```

### Download in the browser

Use `QRCodeDownloadSVGRenderer` from `@qrcodesdk/browser` when a browser action should download the rendered SVG.

```ts
import {QRCodeDownloadSVGRenderer} from '@qrcodesdk/browser';
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

qrcode('https://qrcodesdk.dev').render(
  QRCodeDownloadSVGRenderer({
    renderer: QRCodeSVGRenderer({
      ariaLabel: 'Scan to open qrcodesdk.dev',
    }),
    filename: 'qrcode',
  }),
);
```

The download renderer appends `.svg` when the filename does not already end with `.svg`. It creates an SVG `Blob`, clicks a temporary download link, revokes the object URL, and returns `void`.

Use the returned svg directly when you need to control the download link yourself.

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(
  QRCodeSVGRenderer({
    ariaLabel: 'Scan to open qrcodesdk.dev',
  }),
);

const blob = new Blob([svg], {
  type: 'image/svg+xml;charset=utf-8',
});

const url = URL.createObjectURL(blob);

const link = document.createElement('a');
link.href = url;
link.download = 'qrcode.svg';
link.click();

URL.revokeObjectURL(url);
```
