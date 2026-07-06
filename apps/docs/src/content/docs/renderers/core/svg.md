---
title: Render SVG
description: Render a QR code as a scalable SVG string from @qrcodesdk/core.
---

Use this when you need a crisp, scalable QR code for web apps, dashboards, emails, documentation pages, server-rendered routes, or generated static assets.

SVG is the best default for most user-facing QR codes because it stays sharp at any size and works in any JavaScript runtime.

## Minimal example

```ts
import {SVGQRCodeRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(SVGQRCodeRenderer());
```

The returned value is an SVG string.

## Common options

You can customize the rendered SVG by passing options to `SVGQRCodeRenderer`.

```ts
import {SVGQRCodeRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(
  SVGQRCodeRenderer({
    size: 8,
    margin: 4,
    colors: {
      colorDark: '#111827',
      colorLight: '#ffffff',
    },
  }),
);
```

| Option              |     Type |     Default | Description                                       |
| ------------------- | -------: | ----------: | ------------------------------------------------- |
| `size`              | `number` |         `5` | Pixel size of each QR module.                     |
| `margin`            | `number` |         `4` | Quiet-zone margin around the QR code, in modules. |
| `colors.colorDark`  | `string` | `'#000000'` | Color used for dark modules.                      |
| `colors.colorLight` | `string` | `'#ffffff'` | Background color.                                 |
| `alt`               | `string` | `undefined` | Adds an `alt` attribute to the SVG.               |
| `ariaLabel`         | `string` | `undefined` | Adds an `aria-label` attribute to the SVG.        |
| `title`             | `string` | `undefined` | Adds a `title` attribute to the SVG.              |

Colors must be 6-digit hex values such as `'#000000'`, `'#ffffff'`, or `'#111827'`.

## Common recipes

### Add accessibility labels

For user-facing QR codes, provide a meaningful label so assistive technologies can describe the destination or action.

```ts
import {SVGQRCodeRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(
  SVGQRCodeRenderer({
    title: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
  }),
);
```

### Save to disk (node)

```ts
import {writeFile} from 'node:fs/promises';

import {SVGQRCodeRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(SVGQRCodeRenderer());

await writeFile('qrcode.svg', svg, 'utf8');
```

### Serve with Express

```ts
import express from 'express';

import {SVGQRCodeRenderer, qrcode} from '@qrcodesdk/core';

const app = express();

app.get('/qrcode.svg', (_req, res) => {
  const svg = qrcode('https://qrcodesdk.dev').render(SVGQRCodeRenderer());

  res.type('image/svg+xml').send(svg);
});

app.listen(3000);
```

### Inline in HTML

```ts
import {SVGQRCodeRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(
  SVGQRCodeRenderer({
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
import {SVGQRCodeRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(
  SVGQRCodeRenderer({
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

Use `DownloadSVGQRCodeRenderer` from `@qrcodesdk/browser` when a browser action should download the rendered SVG.

```ts
import {DownloadSVGQRCodeRenderer} from '@qrcodesdk/browser';
import {SVGQRCodeRenderer, qrcode} from '@qrcodesdk/core';

qrcode('https://qrcodesdk.dev').render(
  DownloadSVGQRCodeRenderer({
    renderer: SVGQRCodeRenderer({
      ariaLabel: 'Scan to open qrcodesdk.dev',
    }),
    filename: 'qrcode',
  }),
);
```

The download renderer appends `.svg` when the filename does not already end with `.svg`. It creates an SVG `Blob`, clicks a temporary download link, revokes the object URL, and returns `void`.

Use the returned svg directly when you need to control the download link yourself.

```ts
import {SVGQRCodeRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(
  SVGQRCodeRenderer({
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

## Output details

The SVG renderer generates:

- A square `<svg>` string
- A light background path using `colors.colorLight`
- A dark module path using `colors.colorDark`
- A `viewBox` measured in QR modules
- Pixel `width` and `height` values derived from `size`, matrix size, and `margin`
- Optional `alt`, `aria-label`, and `title` attributes

The final pixel size is calculated as:

```ts
const imageSize = size * (moduleCount + 2 * margin);
```

## Related pages

- [Customize QR Codes](/guides/customize/)
- [Render PNG in Node.js](/renderers/node/png/)
- [Render to an Image Element](/renderers/browser/image/)
